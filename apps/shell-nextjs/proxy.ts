import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { ProxyConfig } from 'next/server';

/**
 * Route normalisation only — deliberately *not* an auth gate.
 *
 * The session's refresh cookie belongs to the API's origin, so it is never sent
 * to the shell's server and this proxy simply cannot see it. Pretending
 * otherwise would produce a check that always fails. Authentication is enforced
 * where the evidence actually is: in the browser by `AuthProvider`, and on every
 * request by the API.
 *
 * Named `proxy.ts` because Next.js 16 renamed the middleware convention — the
 * file, the exported handler shape (now a default export) and the types
 * (`NextProxy`, `ProxyConfig`) all moved. `middleware.ts` still works but is
 * deprecated.
 */
export default function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // `/banking` on its own belongs to no remote; send it to the default section
  // rather than rendering a "page not found" for a URL a user typed reasonably.
  if (pathname === '/banking' || pathname === '/banking/') {
    return NextResponse.redirect(new URL('/banking/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config: ProxyConfig = {
  matcher: ['/banking', '/banking/'],
};
