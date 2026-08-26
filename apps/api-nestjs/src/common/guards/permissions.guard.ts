import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type { Permission } from '@banking/contracts';
import { hasEveryPermission } from '@banking/contracts';

import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ForbiddenException, UnauthenticatedException } from '../errors/domain.exception';

/**
 * Server-side enforcement of the permissions a route declares. This runs on
 * every request regardless of which micro frontend made it — a remote that
 * simply renders its own "Transfer" button still cannot move money.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<Request>();
    if (!request.user) {
      throw new UnauthenticatedException();
    }

    if (!hasEveryPermission(request.user.permissions, required)) {
      throw new ForbiddenException(`Requires permission: ${required.join(', ')}`);
    }

    return true;
  }
}
