import type { Account } from '@banking/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { createHarness, mountInShell, settle } from '../../test/shell-harness';
import AccountDetail from './AccountDetail.vue';

const ACCOUNT: Account = {
  id: 'acc_1',
  accountNumber: '•••• 4001',
  nickname: 'Everyday Checking',
  type: 'CHECKING',
  status: 'ACTIVE',
  balanceMinor: 845_035,
  availableBalanceMinor: 845_035,
  currency: 'USD',
  openedAt: '2021-05-17T00:00:00.000Z',
};

/**
 * `AccountDetail` takes a prop, so it cannot go through `mountInShell` directly
 * — that helper renders a component with no props.
 */
function detailFor(accountId: string) {
  return defineComponent({
    name: 'AccountDetailHost',
    setup: () => () => h(AccountDetail, { accountId }),
  });
}

const EMPTY_PAGE = { items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 };

/**
 * Routes by URL rather than answering every call with the same body.
 *
 * `AccountDetail` renders `TransactionHistory` as well, and a single canned
 * response would hand the history component an account object — an unhandled
 * rejection in a component this file is not testing.
 */
function mockFetch(account: unknown): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockImplementation((url: URL) => {
    const body = String(url).includes('/transactions') ? EMPTY_PAGE : account;
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('AccountDetail hand-off to the Transfer application', () => {
  it('publishes the selection and asks the shell for the Transfer application', async () => {
    mockFetch(ACCOUNT);
    const harness = createHarness();
    const wrapper = mountInShell(detailFor('acc_1'), harness);
    await settle();

    await wrapper.find('button.handoff-action').trigger('click');

    // Two separate statements: what the user is working on, and where to go.
    expect(harness.emitted).toEqual([
      {
        type: 'account:selected',
        payload: { accountId: 'acc_1', accountNumber: '•••• 4001', currency: 'USD' },
      },
    ]);
    expect(harness.handedOff).toEqual([{ app: 'transfer', subPath: undefined }]);
  });

  it('never names the other application by URL', async () => {
    mockFetch(ACCOUNT);
    const harness = createHarness();
    const wrapper = mountInShell(detailFor('acc_1'), harness);
    await settle();

    await wrapper.find('button.handoff-action').trigger('click');

    // Where Transfer is mounted is runtime configuration the shell resolves.
    // A remote that pushed a path would break the moment that config changed.
    expect(harness.navigated).toEqual([]);
  });

  it('does not offer a transfer from an account that cannot send money', async () => {
    mockFetch({ ...ACCOUNT, status: 'FROZEN' });
    const wrapper = mountInShell(detailFor('acc_1'), createHarness());
    await settle();

    expect(wrapper.find('button.handoff-action').attributes('disabled')).toBeDefined();
  });
});
