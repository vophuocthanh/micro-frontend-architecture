import type { AccountSummary } from '@banking/contracts';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createHarness, renderInShell } from '../../test/shell-harness';
import { BalanceSummary } from './BalanceSummary';

const SUMMARY: AccountSummary = {
  totalBalanceMinor: 3_467_125,
  currency: 'USD',
  accountCount: 2,
  accounts: [
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
    {
      id: 'acc_2',
      accountNumber: '•••• 4002',
      nickname: 'Frozen Savings',
      type: 'SAVINGS',
      status: 'FROZEN',
      balanceMinor: 2_622_090,
      availableBalanceMinor: 0,
      currency: 'USD',
      openedAt: '2021-05-17T00:00:00.000Z',
    },
  ],
};

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, ...response }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('BalanceSummary', () => {
  it('announces a busy state while balances load', () => {
    mockFetch({ json: () => new Promise(() => undefined) });
    renderInShell(<BalanceSummary />, createHarness());

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading balances')).toBeInTheDocument();
  });

  it('renders the total and every account once loaded', async () => {
    mockFetch({ json: () => Promise.resolve(SUMMARY) });
    renderInShell(<BalanceSummary />, createHarness());

    expect(await screen.findByText('$34,671.25')).toBeInTheDocument();
    expect(screen.getByText('Everyday Checking')).toBeInTheDocument();
    expect(screen.getByText('$8,450.35')).toBeInTheDocument();
  });

  it('surfaces a non-active status so a frozen account is not read as spendable', async () => {
    mockFetch({ json: () => Promise.resolve(SUMMARY) });
    renderInShell(<BalanceSummary />, createHarness());

    expect(await screen.findByText('FROZEN')).toBeInTheDocument();
  });

  it('shows an empty state rather than a zero total when there are no accounts', async () => {
    mockFetch({
      json: () =>
        Promise.resolve({ ...SUMMARY, accountCount: 0, accounts: [], totalBalanceMinor: 0 }),
    });
    renderInShell(<BalanceSummary />, createHarness());

    expect(await screen.findByText('No open accounts')).toBeInTheDocument();
    expect(screen.queryByText('$0.00')).not.toBeInTheDocument();
  });

  it('offers a retry when the request fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          statusCode: 500,
          code: 'INTERNAL_ERROR',
          message: 'boom',
          requestId: 'req-1',
          timestamp: '2026-01-01T00:00:00.000Z',
          path: '/accounts/summary',
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderInShell(<BalanceSummary />, createHarness());

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    // The correlation id is what turns a user report into a findable log line.
    expect(screen.getByText('Request req-1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('publishes account:selected instead of reaching into another micro frontend', async () => {
    mockFetch({ json: () => Promise.resolve(SUMMARY) });
    const harness = createHarness();
    renderInShell(<BalanceSummary />, harness);

    await userEvent.click(await screen.findByRole('button', { name: /Everyday Checking/ }));

    expect(harness.emitted).toEqual([
      {
        type: 'account:selected',
        payload: { accountId: 'acc_1', accountNumber: '•••• 4001', currency: 'USD' },
      },
    ]);
  });

  it('hands the user off by naming an application, never a URL', async () => {
    mockFetch({ json: () => Promise.resolve(SUMMARY) });
    const harness = createHarness();
    renderInShell(<BalanceSummary />, harness);

    await userEvent.click(await screen.findByRole('button', { name: /Everyday Checking/ }));

    // `account`, not `/banking/accounts`: where that application is mounted is
    // the shell's runtime configuration, and this remote must not encode it.
    expect(harness.handedOff).toEqual([{ app: 'account', subPath: '/acc_1' }]);
  });

  it('sends the bearer token and identifies itself to the API', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(SUMMARY) });
    vi.stubGlobal('fetch', fetchMock);

    renderInShell(<BalanceSummary />, createHarness());
    await screen.findByText('$34,671.25');

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer test-token');
    expect(headers['x-application-id']).toBe('dashboard');
  });
});
