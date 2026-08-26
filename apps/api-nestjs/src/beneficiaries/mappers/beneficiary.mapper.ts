import type { Beneficiary as BeneficiaryContract } from '@banking/contracts';
import type { Beneficiary } from '@prisma/client';

import { maskAccountNumber } from '../../common/masking/mask';

export function toBeneficiaryContract(beneficiary: Beneficiary): BeneficiaryContract {
  return {
    id: beneficiary.id,
    fullName: beneficiary.fullName,
    accountNumber: maskAccountNumber(beneficiary.accountNumber),
    bankName: beneficiary.bankName,
    currency: beneficiary.currency,
    isFavourite: beneficiary.isFavourite,
    createdAt: beneficiary.createdAt.toISOString(),
  };
}
