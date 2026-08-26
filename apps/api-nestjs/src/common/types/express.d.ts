import type { AppId, AuthenticatedUser } from '@banking/contracts';

/**
 * Per-request context the platform attaches to every Express request.
 *
 * Declared once, here, rather than beside each producer: a single augmentation
 * keeps the shape of `Request` discoverable, and stops two files from
 * disagreeing about whether `user` is optional.
 */
declare module 'express-serve-static-core' {
  interface Request {
    /** Correlation id, set by `RequestContextMiddleware`. */
    requestId: string;
    /** Which frontend originated the call, when it declares one. */
    sourceApp: AppId | 'unknown';
    /** Set by `JwtAuthGuard`; absent on routes marked `@Public()`. */
    user?: AuthenticatedUser;
  }
}
