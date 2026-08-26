import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

import {
  type CreateTransferRequest,
  TRANSFER_STATUSES,
  type TransferQuery,
  type TransferQuoteRequest,
  type TransferStatus,
} from '@banking/contracts';

import { MAX_PAGE_SIZE } from '../../common/pagination/pagination';
import { TRANSFER_POLICY } from '../services/transfer.policy';

export class TransferQuoteDto implements TransferQuoteRequest {
  @IsString()
  sourceAccountId!: string;

  @IsString()
  beneficiaryId!: string;

  @IsInt({ message: 'amountMinor must be a whole number of minor units' })
  @Min(TRANSFER_POLICY.minAmountMinor)
  @Max(TRANSFER_POLICY.dailyLimitMinor)
  amountMinor!: number;
}

export class CreateTransferDto extends TransferQuoteDto implements CreateTransferRequest {
  @IsOptional()
  @IsString()
  @MaxLength(140)
  note?: string;

  /**
   * Required, not optional: a client that cannot produce an idempotency key
   * cannot be allowed to retry, and every browser can produce a UUID.
   */
  @IsUUID('4', { message: 'idempotencyKey must be a v4 UUID' })
  idempotencyKey!: string;
}

export class TransferQueryDto implements TransferQuery {
  @IsOptional()
  @IsEnum(TRANSFER_STATUSES as unknown as Record<string, string>, {
    message: `status must be one of: ${TRANSFER_STATUSES.join(', ')}`,
  })
  status?: TransferStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize?: number;
}
