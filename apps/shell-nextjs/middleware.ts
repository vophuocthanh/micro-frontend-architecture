import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route normalisation only — deliberately *not* an auth gate.
 *
 * The session's refresh cookie belongs to the API's origin, so it is never sent
 * to the shell's server and middleware simply cannot see it. Pretending
 * otherwise would produce a check that always fails. Authentication is enforced
 * where the evidence actually is: in the browser, by `AuthProvider`, and on
 * every request by the API.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // `/banking` on its own belongs to no remote; send it to the default section
  // rather than rendering a "page not found" for a URL a user typed reasonably.
  if (pathname === '/banking' || pathname === '/banking/') {
    return NextResponse.redirect(new URL('/banking/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/banking', '/banking/'],
};
