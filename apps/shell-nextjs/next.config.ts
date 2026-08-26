import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Remote applications are fetched at runtime from their own origins, so the
   * shell's own security headers have to permit exactly those origins and no
   * others.
   *
   * This is the central mitigation for the biggest risk in this architecture:
   * the shell executes JavaScript it did not build. A compromised remote can do
   * anything the page can — so the policy names the hosts we accept code from,
   * and nothing else.
   */
  async headers() {
    const remoteOrigins = (process.env.REMOTE_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    const apiOrigin = process.env.API_BASE_URL ?? '';
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // React Refresh compiles modules with `eval`, so the development server
    // cannot run under a policy that forbids it. Scoped to development
    // explicitly: `'unsafe-eval'` in production would let an attacker who can
    // inject a string turn it into executing code, which is most of what a CSP
    // exists to prevent.
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      ...(isDevelopment ? ["'unsafe-eval'"] : []),
      ...remoteOrigins,
    ].join(' ');

    // Vite serves HMR over a WebSocket from each remote's own origin.
    const connectSrc = [
      "'self'",
      apiOrigin,
      ...remoteOrigins,
      ...(isDevelopment ? remoteOrigins.map((origin) => origin.replace(/^http/, 'ws')) : []),
    ]
      .filter(Boolean)
      .join(' ');

    const csp = [
      "default-src 'self'",
      // 'unsafe-inline' is required by Next.js's own bootstrap; a hardened
      // production deployment should replace it with a per-request nonce.
      `script-src ${scriptSrc}`,
      `connect-src ${connectSrc}`,
      `style-src 'self' 'unsafe-inline' ${remoteOrigins.join(' ')}`,
      "img-src 'self' data:",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      // Blocks clickjacking: no other site may frame the banking shell.
      "frame-ancestors 'none'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
