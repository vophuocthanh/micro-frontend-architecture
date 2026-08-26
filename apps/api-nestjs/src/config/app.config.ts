import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from './env.schema';

/**
 * A typed facade over `ConfigService`. Call sites read `config.jwtAccessSecret`
 * instead of `config.get('JWT_ACCESS_SECRET')`, so a renamed variable is a
 * compile error rather than an `undefined` that surfaces at runtime.
 */
@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService<Env, true>) {}

  private get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true });
  }

  get nodeEnv(): Env['NODE_ENV'] {
    return this.get('NODE_ENV');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return this.get('PORT');
  }

  get jwtAccessSecret(): string {
    return this.get('JWT_ACCESS_SECRET');
  }

  get jwtRefreshSecret(): string {
    return this.get('JWT_REFRESH_SECRET');
  }

  /** Seconds, not a duration string: `jsonwebtoken` takes either, but only a
   * number survives the trip through configuration without a cast. */
  get jwtAccessTtlSeconds(): number {
    return this.get('JWT_ACCESS_TTL_SECONDS');
  }

  get refreshTtlDays(): number {
    return this.get('JWT_REFRESH_TTL_DAYS');
  }

  get cookieDomain(): string | undefined {
    const domain = this.get('COOKIE_DOMAIN');
    return domain ? domain : undefined;
  }

  get corsOrigins(): string[] {
    return this.get('CORS_ORIGINS');
  }
}
