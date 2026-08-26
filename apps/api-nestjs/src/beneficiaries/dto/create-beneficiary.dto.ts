import { IsBoolean, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import type {
  CreateBeneficiaryRequest,
  CurrencyCode,
  UpdateBeneficiaryRequest,
} from '@banking/contracts';

const CURRENCIES = ['USD', 'EUR', 'VND'] as const;

export class CreateBeneficiaryDto implements CreateBeneficiaryRequest {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  // An allowlist, not a blocklist: anything that is not 8–20 digits is
  // rejected, so no encoding trick can smuggle a payload through this field.
  @Matches(/^\d{8,20}$/, { message: 'accountNumber must be 8 to 20 digits' })
  accountNumber!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  bankName!: string;

  @IsEnum(CURRENCIES as unknown as Record<string, string>, {
    message: `currency must be one of: ${CURRENCIES.join(', ')}`,
  })
  currency!: CurrencyCode;
}

export class UpdateBeneficiaryDto implements UpdateBeneficiaryRequest {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  bankName?: string;

  @IsOptional()
  @IsBoolean()
  isFavourite?: boolean;
}
