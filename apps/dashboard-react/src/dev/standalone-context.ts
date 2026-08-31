import type { AuthenticatedUser, LoginResponse, MfeMountContext } from '@banking/contracts';
import { createEventBus } from '@banking/contracts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

/** Seeded demo credentials — this module is only ever imported by `main.tsx`. */
const DEV_CREDENTIALS = { email: 'customer@bank.test', password: 'Password123!' };

/**
 * A stand-in for the shell, used only when this remote runs on its own port.
 *
 * Standalone development is a first-class requirement: the team owning this
 * domain must be able to work without booting the shell and two unrelated
 * applications. The price is this file — a minimal, honest implementation of
 * the same `MfeMountContext` the shell provides in production.
 */
export async function createStandaloneContext(): Promise<MfeMountContext> {
  const session = await login();
  let accessToken = session.accessToken;
  let expiresAt = new Date(session.expiresAt).getTime();

  return {
    auth: {
      user: session.user,
      async getAccessToken() {
        // Refresh a minute early so a request never starts with a token that
        // expires while it is in flight.
        if (Date.now() > expiresAt - 60_000) {
          const refreshed = await login();
          accessToken = refreshed.accessToken;
          expiresAt = new Date(refreshed.expiresAt).getTime();
        }
        return accessToken;
      },
      hasPermission: (permission) => hasPermission(session.user, permission),
    },
    events: createEventBus({ source: 'dashboard', onEmit: (event) => console.info('[event]', event) }),
    navigate: (path) => console.info('[navigate]', path),
    // Standalone runs one application, so there is nowhere to hand off to.
    // Logging keeps the intent visible in the dev loop rather than making the
    // button look broken.
    navigateToApp: (app, subPath) =>
      console.info('[navigate-to-app]', app, subPath ?? '/', '(no shell — ignored)'),
    basePath: '/banking/dashboard',
    // The Dashboard has no sub-routes; standalone mode still has to satisfy the
    // contract, so it reports a static root and never notifies.
    route: { current: () => '/', subscribe: () => () => undefined },
    apiBaseUrl: API_BASE_URL,
    locale: 'en-US',
    theme: 'light',
  };
}

function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  return user.permissions.includes(permission as AuthenticatedUser['permissions'][number]);
}

async function login(): Promise<LoginResponse> {
  const response = await fetch(new URL('/auth/login', API_BASE_URL), {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-application-id': 'dashboard' },
    credentials: 'include',
    body: JSON.stringify(DEV_CREDENTIALS),
  });

  if (!response.ok) {
    throw new Error(
      `Standalone login failed (${response.status}). Is the API running on ${API_BASE_URL} and seeded?`,
    );
  }

  return (await response.json()) as LoginResponse;
}
