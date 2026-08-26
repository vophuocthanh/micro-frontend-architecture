import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import type { LoginRequest } from '@banking/contracts';

/**
 * Implementing the shared contract makes the DTO and the type the frontends
 * compile against the same thing: adding a field to one without the other is a
 * compile error, not a runtime surprise.
 */
export class LoginDto implements LoginRequest {
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(128)
  password!: string;
}
