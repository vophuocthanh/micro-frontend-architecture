import type { ApiErrorBody, ApiErrorCode, LoginRequest, LoginResponse } from '@banking/contracts';

export class ShellApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ShellApiError';
  }
}

/**
 * `credentials: 'include'` on every auth call is what carries the httpOnly
 * refresh cookie. It is the only place in the platform that needs it — remotes
 * authenticate with a bearer token the shell hands them and never touch the
 * cookie at all.
 */
async function authFetch<T>(baseUrl: string, path: string, body?: LoginRequest): Promise<T> {
  const response = await fetch(new URL(path, baseUrl), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      'x-application-id': 'shell',
      'x-request-id': crypto.randomUUID(),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ShellApiError(
      error?.code ?? 'INTERNAL_ERROR',
      response.status,
      error?.message ?? 'The authentication service could not be reached',
    );
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

/**
 * The API's base URL is passed in rather than imported: it is server-resolved
 * configuration that reaches the browser as a prop, so no module here may
 * assume it at import time.
 */
export const authApi = {
  login: (baseUrl: string, credentials: LoginRequest): Promise<LoginResponse> =>
    authFetch<LoginResponse>(baseUrl, '/auth/login', credentials),

  /** Exchanges the refresh cookie for a new access token and rotates the cookie. */
  refresh: (baseUrl: string): Promise<LoginResponse> =>
    authFetch<LoginResponse>(baseUrl, '/auth/refresh'),

  logout: (baseUrl: string): Promise<void> => authFetch<void>(baseUrl, '/auth/logout'),
};
