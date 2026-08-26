import type { Account as AccountContract, AccountSummary } from '@banking/contracts';
import type { Account } from '@prisma/client';

import { maskAccountNumber } from '../../common/masking/mask';
import { toMinorUnits } from '../../common/money/money';

/**
 * The only place a persistence row becomes a wire object.
 *
 * Mapping explicitly — rather than returning the Prisma model — is what
 * guarantees a column added to the table (an internal risk score, an audit
 * flag) does not silently start shipping to browsers.
 */
export function toAccountContract(account: Account): AccountContract {
  return {
    id: account.id,
    accountNumber: maskAccountNumber(account.accountNumber),
    nickname: account.nickname,
    type: account.type,
    status: account.status,
    balanceMinor: toMinorUnits(account.balance),
    availableBalanceMinor: toMinorUnits(account.availableBalance),
    currency: account.currency,
    openedAt: account.openedAt.toISOString(),
  };
}

export function toAccountSummary(accounts: Account[]): AccountSummary {
  const mapped = accounts.map(toAccountContract);

  return {
    // A real platform converts through an FX rate; the seed data is
    // single-currency, so the total is only meaningful within one currency.
    totalBalanceMinor: mapped.reduce((total, account) => total + account.balanceMinor, 0),
    currency: accounts[0]?.currency ?? 'USD',
    accountCount: mapped.length,
    accounts: mapped,
  };
}
