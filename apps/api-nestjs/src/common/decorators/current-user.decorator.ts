import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthenticatedUser } from '@banking/contracts';

import { UnauthenticatedException } from '../errors/domain.exception';

/**
 * Resolves the caller from the verified token. Throwing when it is missing
 * keeps controllers free of `user!` assertions — a route that asks for a user
 * is a route that requires one.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.user) {
      throw new UnauthenticatedException();
    }
    return request.user;
  },
);
