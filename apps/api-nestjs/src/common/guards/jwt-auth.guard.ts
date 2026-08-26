import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import type { Request } from 'express';

import type { JwtAccessTokenClaims } from '@banking/contracts';
import { permissionsForRole } from '@banking/contracts';

import { AppConfig } from '../../config/app.config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenExpiredException, UnauthenticatedException } from '../errors/domain.exception';

/**
 * Verifies the bearer access token and attaches the caller to the request.
 *
 * Permissions are re-derived from the token's *role* rather than read from the
 * token's permission list: the list is convenience data for the UI, and this
 * way a change to the role→permission table takes effect on the next request
 * instead of waiting for every issued token to expire.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfig,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthenticatedException('Missing bearer token');
    }

    let claims: JwtAccessTokenClaims;
    try {
      claims = await this.jwt.verifyAsync<JwtAccessTokenClaims>(token, {
        secret: this.config.jwtAccessSecret,
      });
    } catch (error) {
      // A distinct code lets the client refresh silently instead of bouncing
      // the user to the login screen mid-task.
      if (error instanceof TokenExpiredError) {
        throw new TokenExpiredException();
      }
      throw new UnauthenticatedException('Invalid bearer token');
    }

    request.user = {
      id: claims.sub,
      email: claims.email,
      fullName: '',
      role: claims.role,
      permissions: [...permissionsForRole(claims.role)],
    };

    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.header('authorization');
    if (!header) return null;

    const [scheme, token] = header.split(' ');
    return scheme?.toLowerCase() === 'bearer' && token ? token : null;
  }
}
