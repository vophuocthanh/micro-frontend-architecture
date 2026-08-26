/**
 * Rate limits for the two endpoints worth protecting individually.
 *
 * Read from `process.env` directly rather than through `AppConfig`, because
 * `@Throttle()` is a decorator: its metadata is fixed when the class is first
 * imported, long before Nest's dependency injection exists. The defaults are
 * the production-safe values — an environment that needs different ones (an
 * end-to-end suite signing in a dozen times a minute, a load test) raises them
 * explicitly, and a plain deployment inherits the strict limits.
 */
function readLimit(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Brute-forcing a password is a volume attack; five attempts a minute makes it uneconomic. */
export const LOGIN_THROTTLE = {
  limit: readLimit(process.env.AUTH_LOGIN_RATE_LIMIT, 5),
  ttl: readLimit(process.env.AUTH_LOGIN_RATE_TTL_MS, 60_000),
} as const;

/** Caps how fast money can leave an account even with a valid session. */
export const TRANSFER_THROTTLE = {
  limit: readLimit(process.env.TRANSFER_RATE_LIMIT, 10),
  ttl: readLimit(process.env.TRANSFER_RATE_TTL_MS, 60_000),
} as const;
