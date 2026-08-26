import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomBytes } from 'node:crypto';

import type { AuthenticatedUser, JwtAccessTokenClaims } from '@banking/contracts';
import { permissionsForRole } from '@banking/contracts';
import type { Role, User } from '@prisma/client';

import { AppConfig } from '../../config/app.config';
import { PrismaService } from '../../database/prisma.service';
import { UnauthenticatedException } from '../../common/errors/domain.exception';

export interface SessionContext {
  userAgent?: string;
  ipAddress?: string;
}

export interface IssuedAccessToken {
  token: string;
  expiresAt: string;
}

const REFRESH_TOKEN_BYTES = 48;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfig,
    private readonly prisma: PrismaService,
  ) {}

  toAuthenticatedUser(user: Pick<User, 'id' | 'email' | 'fullName' | 'role'>): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      permissions: [...permissionsForRole(user.role)],
    };
  }

  async issueAccessToken(user: { id: string; email: string; role: Role }): Promise<IssuedAccessToken> {
    const claims: Omit<JwtAccessTokenClaims, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: [...permissionsForRole(user.role)],
    };

    const token = await this.jwt.signAsync(claims, {
      secret: this.config.jwtAccessSecret,
      expiresIn: this.config.jwtAccessTtlSeconds,
    });

    const { exp } = this.jwt.decode<JwtAccessTokenClaims>(token);
    return { token, expiresAt: new Date(exp * 1000).toISOString() };
  }

  /**
   * Refresh tokens are opaque random strings, not JWTs.
   *
   * A JWT is valid until it expires, which is precisely the wrong property for
   * the long-lived half of a session: logging out, or reacting to a stolen
   * cookie, has to take effect immediately. An opaque token backed by a row we
   * can revoke gives us that.
   */
  async issueRefreshToken(userId: string, context: SessionContext): Promise<string> {
    const rawToken = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    const expiresAt = new Date(Date.now() + this.config.refreshTtlDays * MS_PER_DAY);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(rawToken),
        expiresAt,
        userAgent: context.userAgent ?? null,
        ipAddress: context.ipAddress ?? null,
      },
    });

    return rawToken;
  }

  /**
   * Rotates a refresh token: the presented one is revoked and a fresh one takes
   * its place, so a leaked cookie is usable at most once. Reuse of an
   * already-revoked token is treated as theft and kills every session the user
   * has, because the legitimate client and the attacker cannot be told apart.
   */
  async rotateRefreshToken(
    rawToken: string,
    context: SessionContext,
  ): Promise<{ user: User; refreshToken: string }> {
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthenticatedException('Invalid session');
    }

    if (stored.revokedAt) {
      await this.revokeAllForUser(stored.userId);
      throw new UnauthenticatedException('Session reuse detected, all sessions revoked');
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthenticatedException('Session has expired');
    }

    const nextRawToken = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    const expiresAt = new Date(Date.now() + this.config.refreshTtlDays * MS_PER_DAY);

    await this.prisma.$transaction(async (tx) => {
      const replacement = await tx.refreshToken.create({
        data: {
          userId: stored.userId,
          tokenHash: this.hashToken(nextRawToken),
          expiresAt,
          userAgent: context.userAgent ?? null,
          ipAddress: context.ipAddress ?? null,
        },
      });

      await tx.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date(), replacedById: replacement.id },
      });
    });

    return { user: stored.user, refreshToken: nextRawToken };
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * HMAC rather than a bare SHA-256: the secret acts as a pepper, so a stolen
   * database dump alone cannot be matched against precomputed hashes.
   */
  private hashToken(rawToken: string): string {
    return createHmac('sha256', this.config.jwtRefreshSecret).update(rawToken).digest('hex');
  }
}
