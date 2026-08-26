import type { Transfer as TransferContract } from '@banking/contracts';
import type { Beneficiary, Transfer } from '@prisma/client';

import { toMinorUnits } from '../../common/money/money';

export type TransferWithBeneficiary = Transfer & { beneficiary: Pick<Beneficiary, 'fullName'> };

export function toTransferContract(transfer: TransferWithBeneficiary): TransferContract {
  return {
    id: transfer.id,
    reference: transfer.reference,
    sourceAccountId: transfer.sourceAccountId,
    beneficiaryId: transfer.beneficiaryId,
    beneficiaryName: transfer.beneficiary.fullName,
    amountMinor: toMinorUnits(transfer.amount),
    currency: transfer.currency,
    note: transfer.note,
    status: transfer.status,
    failureReason: transfer.failureReason,
    createdAt: transfer.createdAt.toISOString(),
  };
}
