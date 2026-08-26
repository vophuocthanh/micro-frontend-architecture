import type { ApiErrorBody, ApiErrorCode } from '@banking/contracts';

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
}

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken: () => Promise<string>;
}

type QueryValue = string | number | boolean | undefined;
type JsonBody = Record<string, unknown>;

/**
 * The Account domain's HTTP client.
 *
 * A near-twin of the Dashboard's on purpose. Extracting a shared package would
 * couple three independently deployed applications to one release cadence for
 * the sake of forty lines — the contract is what must be shared, not the
 * plumbing that speaks it.
 */
export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  get<T>(path: string, query?: Record<string, QueryValue>): Promise<T> {
    return this.request<T>('GET', path, { query });
  }

  post<T>(path: string, body: JsonBody): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  patch<T>(path: string, body: JsonBody): Promise<T> {
    return this.request<T>('PATCH', path, { body });
  }

  delete(path: string): Promise<void> {
    return this.request<void>('DELETE', path, {});
  }

  private async request<T>(
    method: string,
    path: string,
    options: { query?: Record<string, QueryValue>; body?: JsonBody },
  ): Promise<T> {
    const token = await this.options.getAccessToken();
    const url = new URL(path, this.options.baseUrl);

    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        'x-application-id': 'account',
        'x-request-id': crypto.randomUUID(),
        ...(options.body ? { 'content-type': 'application/json' } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });

    if (!response.ok) {
      throw await toApiError(response);
    }

    // 204 has no body; parsing it would throw on a perfectly successful delete.
    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new ApiError(body.code, body.statusCode, body.message, body.requestId);
  } catch {
    return new ApiError('INTERNAL_ERROR', response.status, response.statusText, 'unknown');
  }
}
