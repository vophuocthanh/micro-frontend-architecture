import type { Account } from '@banking/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createHarness, mountInShell, settle } from '../../test/shell-harness';
import AccountList from './AccountList.vue';

const ACCOUNTS: Account[] = [
  {
    id: 'acc_1',
    accountNumber: '•••• 4001',
    nickname: 'Everyday Checking',
    type: 'CHECKING',
    status: 'ACTIVE',
    balanceMinor: 845_035,
    availableBalanceMinor: 845_035,
    currency: 'USD',
    openedAt: '2021-05-17T00:00:00.000Z',
  },
];

function mockFetch(value: unknown, ok = true, status = 200): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue({ ok, status, json: () => Promise.resolve(value) });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('AccountList', () => {
  it('announces a busy state while accounts load', () => {
    mockFetch(new Promise(() => undefined));
    const wrapper = mountInShell(AccountList, createHarness());

    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true);
  });

  it('renders each account once loaded', async () => {
    mockFetch(ACCOUNTS);
    const wrapper = mountInShell(AccountList, createHarness());
    await settle();

    expect(wrapper.text()).toContain('Everyday Checking');
    expect(wrapper.text()).toContain('$8,450.35');
  });

  it('shows an empty state rather than an empty list', async () => {
    mockFetch([]);
    const wrapper = mountInShell(AccountList, createHarness());
    await settle();

    expect(wrapper.text()).toContain('No open accounts');
  });

  it('surfaces an error with a retry', async () => {
    const fetchMock = mockFetch(
      {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'boom',
        requestId: 'req-1',
        timestamp: '2026-01-01T00:00:00.000Z',
        path: '/accounts',
      },
      false,
      500,
    );

    const wrapper = mountInShell(AccountList, createHarness());
    await settle();

    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    // The correlation id is what turns a user report into a findable log line.
    expect(wrapper.text()).toContain('req-1');

    await wrapper.find('button.retry').trigger('click');
    await settle();
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
  });

  it('publishes account:selected and asks the shell to navigate', async () => {
    mockFetch(ACCOUNTS);
    const harness = createHarness();
    const wrapper = mountInShell(AccountList, harness);
    await settle();

    await wrapper.find('button.tile').trigger('click');

    // The Transfer application listens for this. Neither knows the other exists.
    expect(harness.emitted).toEqual([
      {
        type: 'account:selected',
        payload: { accountId: 'acc_1', accountNumber: '•••• 4001', currency: 'USD' },
      },
    ]);
    // The URL belongs to the shell; the remote may only request a change.
    expect(harness.navigated).toEqual(['/banking/accounts/acc_1']);
  });

  it('sends the bearer token and identifies itself to the API', async () => {
    const fetchMock = mockFetch(ACCOUNTS);
    mountInShell(AccountList, createHarness());
    await settle();

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer test-token');
    expect(headers['x-application-id']).toBe('account');
  });
});
