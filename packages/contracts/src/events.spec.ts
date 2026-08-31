import { describe, expect, it, vi } from 'vitest';

import { createEventBus, REPLAYED_EVENTS } from './events.js';
import type { PlatformEvent } from './events.js';

function bus() {
  return createEventBus({ source: 'shell', correlationId: () => 'corr-test' });
}

/** Lets a queued microtask run before assertions. */
const settle = (): Promise<void> => Promise.resolve();

describe('event delivery', () => {
  it('delivers an event to every live subscriber', () => {
    const platform = bus();
    const first = vi.fn();
    const second = vi.fn();

    platform.on('transfer:completed', first);
    platform.on('transfer:completed', second);
    platform.emit('transfer:completed', {
      transferId: 't_1',
      sourceAccountId: 'acc_1',
      amountMinor: 2_500,
      currency: 'USD',
      status: 'COMPLETED',
    });

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it('isolates subscribers, so one that throws cannot silence the rest', () => {
    const platform = bus();
    const survivor = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    platform.on('auth:logout', () => {
      throw new Error('subscriber blew up');
    });
    platform.on('auth:logout', survivor);

    expect(() => platform.emit('auth:logout', { reason: 'user-action' })).not.toThrow();
    expect(survivor).toHaveBeenCalledOnce();
  });

  it('stops delivering after unsubscribe', () => {
    const platform = bus();
    const handler = vi.fn();

    const unsubscribe = platform.on('auth:logout', handler);
    unsubscribe();
    platform.emit('auth:logout', { reason: 'token-expired' });

    expect(handler).not.toHaveBeenCalled();
  });
});

/**
 * The behaviour a hand-off between two micro frontends rests on. The publisher
 * is unmounted before the receiver is mounted, so "deliver to whoever is
 * listening right now" is precisely the wrong rule for this one class of event.
 */
describe('replay for late subscribers', () => {
  it('replays the last account selection to a subscriber that arrives afterwards', async () => {
    const platform = bus();

    // Account publishes, then the shell unmounts it and mounts Transfer.
    platform.emit('account:selected', {
      accountId: 'acc_9',
      accountNumber: '•••• 4417',
      currency: 'USD',
    });

    const lateSubscriber = vi.fn();
    platform.on('account:selected', lateSubscriber);
    await settle();

    expect(lateSubscriber).toHaveBeenCalledOnce();
    const event = lateSubscriber.mock.calls[0]![0] as PlatformEvent<'account:selected'>;
    expect(event.payload.accountId).toBe('acc_9');
  });

  it('replays on a microtask, never during the on() call itself', () => {
    const platform = bus();
    platform.emit('account:selected', {
      accountId: 'acc_9',
      accountNumber: '•••• 4417',
      currency: 'USD',
    });

    const handler = vi.fn();
    // A synchronous replay would run before the caller holds its unsubscribe
    // function — and, in a component, mid-construction.
    platform.on('account:selected', handler);

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not replay to a subscriber that unsubscribed before the microtask ran', async () => {
    const platform = bus();
    platform.emit('account:selected', {
      accountId: 'acc_9',
      accountNumber: '•••• 4417',
      currency: 'USD',
    });

    const handler = vi.fn();
    platform.on('account:selected', handler)();
    await settle();

    expect(handler).not.toHaveBeenCalled();
  });

  it('replays only the most recent value', async () => {
    const platform = bus();

    platform.emit('account:selected', { accountId: 'acc_1', accountNumber: '1', currency: 'USD' });
    platform.emit('account:selected', { accountId: 'acc_2', accountNumber: '2', currency: 'EUR' });

    const handler = vi.fn();
    platform.on('account:selected', handler);
    await settle();

    expect(handler).toHaveBeenCalledOnce();
    const event = handler.mock.calls[0]![0] as PlatformEvent<'account:selected'>;
    expect(event.payload.accountId).toBe('acc_2');
  });

  it('fires a replayed `once` subscriber exactly once', async () => {
    const platform = bus();
    platform.emit('account:selected', { accountId: 'acc_1', accountNumber: '1', currency: 'USD' });

    const handler = vi.fn();
    platform.once('account:selected', handler);
    await settle();

    platform.emit('account:selected', { accountId: 'acc_2', accountNumber: '2', currency: 'USD' });
    await settle();

    expect(handler).toHaveBeenCalledOnce();
  });

  it('honours `once` even when a live event beats the queued replay', async () => {
    const platform = bus();
    platform.emit('account:selected', { accountId: 'acc_1', accountNumber: '1', currency: 'USD' });

    const handler = vi.fn();
    platform.once('account:selected', handler);
    // Lands before the replay's microtask, and removes the listener with it.
    platform.emit('account:selected', { accountId: 'acc_2', accountNumber: '2', currency: 'USD' });
    await settle();

    expect(handler).toHaveBeenCalledOnce();
    const event = handler.mock.calls[0]![0] as PlatformEvent<'account:selected'>;
    expect(event.payload.accountId).toBe('acc_2');
  });

  it('never replays imperative events', async () => {
    const platform = bus();
    platform.emit('notification:show', { level: 'success', message: 'Sent.' });

    const handler = vi.fn();
    platform.on('notification:show', handler);
    await settle();

    // Replaying this would show the user a toast for something that already
    // happened, every time a remote mounts.
    expect(handler).not.toHaveBeenCalled();
    expect(REPLAYED_EVENTS).not.toContain('notification:show');
  });

  it('drops retained state on logout, so the next session starts clean', async () => {
    const platform = bus();
    platform.emit('account:selected', { accountId: 'acc_1', accountNumber: '1', currency: 'USD' });
    platform.emit('auth:logout', { reason: 'user-action' });

    const handler = vi.fn();
    platform.on('account:selected', handler);
    await settle();

    expect(handler).not.toHaveBeenCalled();
  });
});
