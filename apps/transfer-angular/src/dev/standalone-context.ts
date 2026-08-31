import type { AuthenticatedUser, LoginResponse, MfeMountContext, Unsubscribe } from '@banking/contracts';
import { createEventBus } from '@banking/contracts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const BASE_PATH = '/banking/transfer';
const DEV_CREDENTIALS = { email: 'customer@bank.test', password: 'Password123!' };

/**
 * A stand-in shell for standalone development, implementing the same contract
 * the real shell provides — including routing, so the Angular Router behaves
 * identically on port 3003 and inside the shell.
 */
export async function createStandaloneContext(): Promise<MfeMountContext> {
  const session = await login();
  let accessToken = session.accessToken;
  let expiresAt = new Date(session.expiresAt).getTime();

  const listeners = new Set<(subPath: string) => void>();
  const currentSubPath = (): string => {
    const path = window.location.pathname;
    return path.startsWith(BASE_PATH) ? path.slice(BASE_PATH.length) || '/' : '/';
  };

  window.addEventListener('popstate', () => {
    for (const listener of listeners) listener(currentSubPath());
  });

  return {
    auth: {
      user: session.user,
      async getAccessToken() {
        if (Date.now() > expiresAt - 60_000) {
          const refreshed = await login();
          accessToken = refreshed.accessToken;
          expiresAt = new Date(refreshed.expiresAt).getTime();
        }
        return accessToken;
      },
      hasPermission: (permission) => hasPermission(session.user, permission),
    },
    events: createEventBus({ source: 'transfer', onEmit: (event) => console.info('[event]', event) }),
    navigate: (path) => {
      window.history.pushState({}, '', path);
      for (const listener of listeners) listener(currentSubPath());
    },
    // Standalone runs one application, so there is nowhere to hand off to.
    // Logging keeps the intent visible in the dev loop rather than making the
    // button look broken.
    navigateToApp: (app, subPath) =>
      console.info('[navigate-to-app]', app, subPath ?? '/', '(no shell — ignored)'),
    basePath: BASE_PATH,
    apiBaseUrl: API_BASE_URL,
    locale: 'en-US',
    theme: 'light',
    route: {
      current: currentSubPath,
      subscribe: (listener): Unsubscribe => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
  };
}

function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  return user.permissions.includes(permission as AuthenticatedUser['permissions'][number]);
}

async function login(): Promise<LoginResponse> {
  const response = await fetch(new URL('/auth/login', API_BASE_URL), {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-application-id': 'transfer' },
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
