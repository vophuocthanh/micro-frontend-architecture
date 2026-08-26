import { HttpException, HttpStatus } from '@nestjs/common';
import type { ApiErrorCode } from '@banking/contracts';

/**
 * Every failure the API raises deliberately carries a machine-readable
 * `ApiErrorCode`. Clients branch on the code; the message is for humans and may
 * be reworded or translated without breaking a single consumer.
 */
export class DomainException extends HttpException {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    status: HttpStatus,
    readonly details?: Record<string, string[]>,
  ) {
    super({ code, message, details }, status);
  }
}

export class UnauthenticatedException extends DomainException {
  constructor(message = 'Authentication required') {
    super('UNAUTHENTICATED', message, HttpStatus.UNAUTHORIZED);
  }
}

export class TokenExpiredException extends DomainException {
  constructor(message = 'Access token has expired') {
    super('TOKEN_EXPIRED', message, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenException extends DomainException {
  constructor(message = 'You do not have permission to perform this action') {
    super('FORBIDDEN', message, HttpStatus.FORBIDDEN);
  }
}

export class ResourceNotFoundException extends DomainException {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} was not found`, HttpStatus.NOT_FOUND);
  }
}

export class ConflictException extends DomainException {
  constructor(message: string) {
    super('CONFLICT', message, HttpStatus.CONFLICT);
  }
}

export class InsufficientFundsException extends DomainException {
  constructor(message = 'The source account does not have enough available balance') {
    super('INSUFFICIENT_FUNDS', message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

export class AccountInactiveException extends DomainException {
  constructor(message = 'The account is not active') {
    super('ACCOUNT_INACTIVE', message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
