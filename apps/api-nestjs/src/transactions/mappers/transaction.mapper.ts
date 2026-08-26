import type { Transaction as TransactionContract } from '@banking/contracts';
import type { Transaction } from '@prisma/client';

import { toMinorUnits } from '../../common/money/money';

export function toTransactionContract(transaction: Transaction): TransactionContract {
  return {
    id: transaction.id,
    accountId: transaction.accountId,
    direction: transaction.direction,
    amountMinor: toMinorUnits(transaction.amount),
    currency: transaction.currency,
    category: transaction.category,
    description: transaction.description,
    counterparty: transaction.counterparty,
    bookedAt: transaction.bookedAt.toISOString(),
  };
}
