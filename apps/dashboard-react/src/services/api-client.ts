import type { ApiErrorBody, ApiErrorCode } from '@banking/contracts';

/**
 * A typed failure the UI can branch on, instead of the bare `Error` that
 * `fetch` would otherwise surface for a 4xx.
 */
export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly statusCode: number,
    message: string,
    readonly requestId: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isAuthError(): boolean {
    return this.code === 'UNAUTHENTICATED' || this.code === 'TOKEN_EXPIRED';
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  /** Supplied by the shell; this remote never stores or refreshes a token itself. */
  getAccessToken: () => Promise<string>;
}

type QueryValue = string | number | boolean | undefined;

/**
 * The Dashboard's own HTTP client.
 *
 * Each micro frontend owns one rather than importing a shared package: an HTTP
 * client is a dependency that would have to be versioned and released in
 * lockstep across three frameworks, and forty lines of `fetch` is a cheaper
 * price than that coupling. The *contract* is shared; the transport is not.
 */
export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async get<T>(path: string, query?: Record<string, QueryValue>): Promise<T> {
    const token = await this.options.getAccessToken();
    const url = new URL(path, this.options.baseUrl);

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url, {
      headers: {
        authorization: `Bearer ${token}`,
        // Lets a failed request be traced back to this application rather than
        // to "some frontend" — see the API's request-context middleware.
        'x-application-id': 'dashboard',
        'x-request-id': crypto.randomUUID(),
      },
    });

    if (!response.ok) {
      throw await toApiError(response);
    }

    return (await response.json()) as T;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new ApiError(body.code, body.statusCode, body.message, body.requestId);
  } catch {
    // A gateway or proxy failure never produces our JSON envelope; fall back to
    // something the UI can still render rather than throwing while throwing.
    return new ApiError('INTERNAL_ERROR', response.status, response.statusText, 'unknown');
  }
}
