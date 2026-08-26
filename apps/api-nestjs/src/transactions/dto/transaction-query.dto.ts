import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

import { TRANSACTION_CATEGORIES, type TransactionCategory, type TransactionQuery } from '@banking/contracts';

import { MAX_PAGE_SIZE } from '../../common/pagination/pagination';

export class TransactionQueryDto implements TransactionQuery {
  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsEnum(TRANSACTION_CATEGORIES as unknown as Record<string, string>, {
    message: `category must be one of: ${TRANSACTION_CATEGORIES.join(', ')}`,
  })
  category?: TransactionCategory;

  @IsOptional()
  @IsISO8601({}, { message: 'from must be an ISO-8601 date' })
  from?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'to must be an ISO-8601 date' })
  to?: string;

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
