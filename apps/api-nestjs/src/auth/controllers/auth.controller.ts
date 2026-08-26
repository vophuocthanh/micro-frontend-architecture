import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';

import type { LoginResponse } from '@banking/contracts';

import { Public } from '../../common/decorators/public.decorator';
import { LOGIN_THROTTLE } from '../../common/throttling/throttle.config';
import { UnauthenticatedException } from '../../common/errors/domain.exception';
import { AppConfig } from '../../config/app.config';
import { LoginDto } from '../dto/login.dto';
import { type AuthenticatedSession, AuthService } from '../services/auth.service';
import type { SessionContext } from '../services/token.service';

export const REFRESH_COOKIE_NAME = 'banking_refresh_token';

/** Scoping the cookie to `/auth` keeps it off every other request the platform makes. */
const REFRESH_COOKIE_PATH = '/auth';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: AppConfig,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: LOGIN_THROTTLE })
  async login(
    @Body() credentials: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const session = await this.auth.login(credentials, this.sessionContext(request));
    return this.completeSession(session, response);
  }

  /**
   * Authenticated by the refresh cookie alone, which is why it is `@Public()`:
   * the caller has no access token yet — that is the point of the endpoint.
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const rawToken = this.readRefreshCookie(request);
    if (!rawToken) {
      throw new UnauthenticatedException('No session cookie present');
    }

    try {
      const session = await this.auth.refresh(rawToken, this.sessionContext(request));
      return this.completeSession(session, response);
    } catch (error) {
      // A refresh that fails leaves a cookie the browser would keep resending;
      // clearing it turns every subsequent reload into a clean login.
      this.clearRefreshCookie(response);
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.logout(this.readRefreshCookie(request));
    this.clearRefreshCookie(response);
  }

  private completeSession(session: AuthenticatedSession, response: Response): LoginResponse {
    response.cookie(REFRESH_COOKIE_NAME, session.refreshToken, this.refreshCookieOptions());
    return session.response;
  }

  private readRefreshCookie(request: Request): string | undefined {
    const value: unknown = request.cookies?.[REFRESH_COOKIE_NAME];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private clearRefreshCookie(response: Response): void {
    const { maxAge: _maxAge, ...options } = this.refreshCookieOptions();
    response.clearCookie(REFRESH_COOKIE_NAME, options);
  }

  private refreshCookieOptions(): CookieOptions {
    const isProduction = this.config.isProduction;

    return {
      // The whole point of the design: no script in the shell or in any remote
      // can read this value, so an XSS payload cannot steal the long-lived half
      // of the session.
      httpOnly: true,
      secure: isProduction,
      // In production the frontends are on sibling domains, so the cookie must
      // survive a cross-site request; `none` demands `secure`, which is why the
      // two flags move together.
      sameSite: isProduction ? 'none' : 'lax',
      path: REFRESH_COOKIE_PATH,
      domain: this.config.cookieDomain,
      maxAge: this.config.refreshTtlDays * 24 * 60 * 60 * 1000,
    };
  }

  private sessionContext(request: Request): SessionContext {
    return {
      userAgent: request.header('user-agent'),
      ipAddress: request.ip,
    };
  }
}
