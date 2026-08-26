import { IsString, MaxLength, MinLength } from 'class-validator';
import type { UpdateAccountRequest } from '@banking/contracts';

export class UpdateAccountDto implements UpdateAccountRequest {
  @IsString()
  @MinLength(1, { message: 'nickname must not be empty' })
  @MaxLength(60)
  nickname!: string;
}
