import type { EventBus, PlatformEvent } from '@banking/contracts';
import { createEventBus } from '@banking/contracts';

/**
 * The platform's single event bus, created by the shell and lent to every
 * remote through the mount contract.
 *
 * One bus, owned by the host, is what makes the topology a star rather than a
 * mesh: Account publishes, the shell relays, Transfer receives — and no remote
 * ever holds a reference to another.
 */
export function createPlatformBus(onEvent: (event: PlatformEvent) => void): EventBus {
  return createEventBus({
    source: 'shell',
    onEmit: onEvent,
  });
}

/**
 * Structured, greppable logging for everything that crosses the platform.
 *
 * In a distributed frontend this is often the only record of *why* a remote
 * reacted: without it, a dashboard that refreshed itself looks like a bug
 * rather than a response to a transfer three applications away.
 */
export function logPlatformEvent(event: PlatformEvent): void {
  if (process.env.NODE_ENV === 'production') return;

  console.info(
    `[platform-event] ${event.type}`,
    JSON.stringify({
      source: event.meta.source,
      correlationId: event.meta.correlationId,
      emittedAt: event.meta.emittedAt,
      payload: event.payload,
    }),
  );
}
