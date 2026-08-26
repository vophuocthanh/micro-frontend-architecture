import { Injectable } from '@nestjs/common';

import type { LoginResponse } from '@banking/contracts';

import { UnauthenticatedException } from '../../common/errors/domain.exception';
import { UsersRepository } from '../../users/repositories/users.repository';
import type { LoginDto } from '../dto/login.dto';
import { PasswordService } from './password.service';
import { type SessionContext, TokenService } from './token.service';

/** A login response plus the opaque refresh token the controller turns into a cookie. */
export interface AuthenticatedSession {
  response: LoginResponse;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  async login(credentials: LoginDto, context: SessionContext): Promise<AuthenticatedSession> {
    const user = await this.users.findByEmail(credentials.email);

    // The same error for "no such account" and "wrong password": telling them
    // apart hands an attacker a free account-enumeration oracle.
    if (!user || !(await this.passwords.verify(credentials.password, user.passwordHash))) {
      throw new UnauthenticatedException('Incorrect email or password');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.issueAccessToken(user),
      this.tokens.issueRefreshToken(user.id, context),
    ]);

    return {
      response: {
        accessToken: accessToken.token,
        expiresAt: accessToken.expiresAt,
        user: this.tokens.toAuthenticatedUser(user),
      },
      refreshToken,
    };
  }

  async refresh(rawRefreshToken: string, context: SessionContext): Promise<AuthenticatedSession> {
    const { user, refreshToken } = await this.tokens.rotateRefreshToken(rawRefreshToken, context);
    const accessToken = await this.tokens.issueAccessToken(user);

    return {
      response: {
        accessToken: accessToken.token,
        expiresAt: accessToken.expiresAt,
        user: this.tokens.toAuthenticatedUser(user),
      },
      refreshToken,
    };
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (rawRefreshToken) {
      await this.tokens.revokeRefreshToken(rawRefreshToken);
    }
  }
}
