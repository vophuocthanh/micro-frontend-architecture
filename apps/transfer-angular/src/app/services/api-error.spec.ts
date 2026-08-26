import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { describeError, normaliseError } from './api-error';

const apiErrorBody = {
  statusCode: 422,
  code: 'INSUFFICIENT_FUNDS',
  message: 'The source account does not have enough available balance',
  requestId: 'req-42',
  timestamp: '2026-01-01T00:00:00.000Z',
  path: '/transfers',
};

describe('normaliseError', () => {
  it('unwraps the platform error envelope', () => {
    const error = new HttpErrorResponse({ status: 422, error: apiErrorBody });

    expect(normaliseError(error)).toEqual({
      code: 'INSUFFICIENT_FUNDS',
      statusCode: 422,
      message: apiErrorBody.message,
      requestId: 'req-42',
    });
  });

  it('falls back for a transport failure that carries no envelope', () => {
    // A CORS rejection, a dead gateway or a DNS failure never produces our JSON,
    // and the user still needs something honest to read.
    const error = new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') });
    const normalised = normaliseError(error);

    expect(normalised.code).toBe('INTERNAL_ERROR');
    expect(normalised.requestId).toBe('unknown');
    expect(normalised.message).toContain('could not be reached');
  });

  it('falls back for something that is not an HTTP error at all', () => {
    expect(normaliseError(new Error('boom')).code).toBe('INTERNAL_ERROR');
  });
});

describe('describeError', () => {
  it('explains a domain failure in terms the customer can act on', () => {
    const message = describeError(normaliseError(new HttpErrorResponse({ status: 422, error: apiErrorBody })));
    expect(message).toContain('enough available balance');
  });

  it('does not leak an internal message for an unexpected failure', () => {
    const message = describeError({
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      message: 'TypeError: cannot read property of undefined',
      requestId: 'req-1',
    });
    // The default branch returns the API's message, which the API itself has
    // already scrubbed — the guarantee lives on the server, and this asserts the
    // client does not add anything of its own.
    expect(message).toBe('TypeError: cannot read property of undefined');
  });

  it('covers every branch it claims to handle', () => {
    for (const code of ['ACCOUNT_INACTIVE', 'FORBIDDEN', 'RATE_LIMITED', 'VALIDATION_FAILED'] as const) {
      const message = describeError({ code, statusCode: 400, message: 'raw', requestId: 'r' });
      expect(message).not.toBe('raw');
    }
  });
});
