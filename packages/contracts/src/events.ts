import type { AppId, CurrencyCode, IsoDateTime, MinorUnits } from './common.js';
import type { TransferStatus } from './transfer.js';

/**
 * The complete cross-application event contract.
 *
 * This map is the *only* sanctioned way two micro frontends influence each
 * other. A remote may not import another remote's store, component or service;
 * it publishes an event and the shell relays it. Adding a key here is a
 * deliberate, reviewable widening of the platform's public surface.
 */
export interface PlatformEventMap {
  /** The user picked an account in the Account MFE; Transfer pre-fills its source. */
  'account:selected': {
    accountId: string;
    accountNumber: string;
    currency: CurrencyCode;
  };
  /** A transfer settled; Dashboard and Account refresh their server state. */
  'transfer:completed': {
    transferId: string;
    sourceAccountId: string;
    amountMinor: MinorUnits;
    currency: CurrencyCode;
    status: TransferStatus;
  };
  /** Session ended, whatever the cause; every remote must drop cached user data. */
  'auth:logout': {
    reason: 'user-action' | 'token-expired' | 'forbidden';
  };
  /** A remote asks the shell to show a toast — remotes own no global UI. */
  'notification:show': {
    level: 'info' | 'success' | 'warning' | 'error';
    message: string;
    ttlMs?: number;
  };
  /** A remote asks the shell to navigate; the shell owns the URL. */
  'navigation:request': {
    path: string;
  };
}

export type PlatformEventName = keyof PlatformEventMap;

/**
 * Events whose most recent value is delivered to a subscriber that arrives
 * *after* it was published.
 *
 * This exists because of one thing federation makes unavoidable: a hand-off
 * from one micro frontend to another crosses an unmount and a mount. Account
 * publishes `account:selected` and asks the shell to open Transfer — but
 * Transfer does not exist yet when that happens, and by the time it subscribes
 * the event is long gone. A plain fire-and-forget bus loses exactly the message
 * the hand-off depends on, silently, and the receiving application simply looks
 * like it ignored the user.
 *
 * Only *state* belongs here — "which account is the user working with" is still
 * true a moment later. Anything imperative (`notification:show`,
 * `navigation:request`) must never be replayed: re-running it on a late
 * subscriber would fire an action the user did not ask for a second time.
 */
export const REPLAYED_EVENTS = ['account:selected'] as const satisfies readonly PlatformEventName[];

export type ReplayedEventName = (typeof REPLAYED_EVENTS)[number];

function isReplayed(type: PlatformEventName): type is ReplayedEventName {
  return (REPLAYED_EVENTS as readonly PlatformEventName[]).includes(type);
}

/**
 * Events travel in an envelope. `meta` is what makes a distributed frontend
 * debuggable: it says which application published the event and ties it to the
 * user interaction that started the chain.
 */
export interface PlatformEvent<K extends PlatformEventName = PlatformEventName> {
  type: K;
  payload: PlatformEventMap[K];
  meta: {
    source: AppId;
    emittedAt: IsoDateTime;
    correlationId: string;
  };
}

export type EventHandler<K extends PlatformEventName> = (event: PlatformEvent<K>) => void;

export type Unsubscribe = () => void;

export interface EventBus {
  emit<K extends PlatformEventName>(type: K, payload: PlatformEventMap[K]): void;
  on<K extends PlatformEventName>(type: K, handler: EventHandler<K>): Unsubscribe;
  once<K extends PlatformEventName>(type: K, handler: EventHandler<K>): Unsubscribe;
}

export interface EventBusOptions {
  /** Stamped onto every event this bus publishes. */
  source: AppId;
  /** Correlation id shared across the whole user interaction, if one is known. */
  correlationId?: () => string;
  /** Observability hook — the shell logs every event that crosses the platform. */
  onEmit?: (event: PlatformEvent) => void;
}

function defaultCorrelationId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `corr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * A typed facade over the DOM's own `EventTarget`.
 *
 * Building on `CustomEvent` rather than a bespoke registry means the transport
 * is the browser's, already understood by React, Vue and Angular alike, and
 * requires no shared runtime between remotes. The facade adds the two things
 * raw `addEventListener` lacks: compile-time payload types, and isolation —
 * one subscriber throwing must never stop the others from being notified.
 */
export function createEventBus(options: EventBusOptions): EventBus {
  const target = new EventTarget();
  const nextCorrelationId = options.correlationId ?? defaultCorrelationId;

  /** Last value of each replayed event — see `REPLAYED_EVENTS`. */
  const retained = new Map<ReplayedEventName, PlatformEvent>();

  function deliver<K extends PlatformEventName>(
    type: K,
    handler: EventHandler<K>,
    event: PlatformEvent<K>,
  ): void {
    try {
      handler(event);
    } catch (error) {
      console.error(`[event-bus] subscriber of "${type}" threw`, error);
    }
  }

  function subscribe<K extends PlatformEventName>(
    type: K,
    handler: EventHandler<K>,
    once: boolean,
  ): Unsubscribe {
    let live = true;

    const listener = (raw: Event): void => {
      // A `once` listener has already been removed by the time it runs, so a
      // replay still queued behind it would be a second delivery to a handler
      // that asked for exactly one.
      if (once) live = false;
      deliver(type, handler, (raw as CustomEvent<PlatformEvent<K>>).detail);
    };

    target.addEventListener(type, listener, { once });

    const unsubscribe = (): void => {
      live = false;
      target.removeEventListener(type, listener);
    };

    const retainedEvent = isReplayed(type) ? retained.get(type) : undefined;
    if (retainedEvent) {
      /**
       * Delivered on a microtask, never synchronously.
       *
       * A handler that fires *during* `on()` runs before the caller has its
       * unsubscribe function — and, in a component, before the framework has
       * finished setting the component up. Angular and Vue both react badly to
       * state changing mid-construction, and the bug reads as a mysterious
       * ordering problem rather than as a replay.
       */
      queueMicrotask(() => {
        if (!live) return;
        if (once) unsubscribe();
        deliver(type, handler, retainedEvent as PlatformEvent<K>);
      });
    }

    return unsubscribe;
  }

  return {
    emit(type, payload) {
      const event: PlatformEvent<typeof type> = {
        type,
        payload,
        meta: {
          source: options.source,
          emittedAt: new Date().toISOString(),
          correlationId: nextCorrelationId(),
        },
      };

      if (isReplayed(type)) {
        retained.set(type, event as PlatformEvent);
      }

      // The end of a session invalidates everything held about the user. A
      // retained account selection outliving a logout would let the next person
      // to sign in on this tab see the previous one's account pre-filled.
      if (type === 'auth:logout') {
        retained.clear();
      }

      options.onEmit?.(event as PlatformEvent);
      target.dispatchEvent(new CustomEvent(type, { detail: event }));
    },
    on: (type, handler) => subscribe(type, handler, false),
    once: (type, handler) => subscribe(type, handler, true),
  };
}
