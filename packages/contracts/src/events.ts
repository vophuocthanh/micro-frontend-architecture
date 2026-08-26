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

  function subscribe<K extends PlatformEventName>(
    type: K,
    handler: EventHandler<K>,
    once: boolean,
  ): Unsubscribe {
    const listener = (raw: Event): void => {
      const event = (raw as CustomEvent<PlatformEvent<K>>).detail;
      try {
        handler(event);
      } catch (error) {
        console.error(`[event-bus] subscriber of "${type}" threw`, error);
      }
    };

    target.addEventListener(type, listener, { once });
    return () => target.removeEventListener(type, listener);
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
      options.onEmit?.(event as PlatformEvent);
      target.dispatchEvent(new CustomEvent(type, { detail: event }));
    },
    on: (type, handler) => subscribe(type, handler, false),
    once: (type, handler) => subscribe(type, handler, true),
  };
}
