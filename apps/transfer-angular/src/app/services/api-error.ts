import { HttpErrorResponse } from '@angular/common/http';

import type { ApiErrorBody, ApiErrorCode } from '@banking/contracts';

/**
 * Turns Angular's transport-level error into the platform's error contract, so
 * components branch on a code instead of guessing from a status number.
 */
export interface NormalisedApiError {
  code: ApiErrorCode;
  statusCode: number;
  message: string;
  requestId: string;
}

export function normaliseError(error: unknown): NormalisedApiError {
  if (error instanceof HttpErrorResponse && isApiErrorBody(error.error)) {
    return {
      code: error.error.code,
      statusCode: error.error.statusCode,
      message: error.error.message,
      requestId: error.error.requestId,
    };
  }

  // A CORS rejection, a DNS failure or a dead gateway never carries our
  // envelope; the user still needs something honest to read.
  return {
    code: 'INTERNAL_ERROR',
    statusCode: error instanceof HttpErrorResponse ? error.status : 0,
    message: 'The transfer service could not be reached. Please try again.',
    requestId: 'unknown',
  };
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'requestId' in value &&
    'statusCode' in value
  );
}

/** Maps an error code to wording a customer can act on. */
export function describeError(error: NormalisedApiError): string {
  switch (error.code) {
    case 'INSUFFICIENT_FUNDS':
      return 'This account does not have enough available balance for the transfer and its fee.';
    case 'ACCOUNT_INACTIVE':
      return 'This account is not active and cannot send money.';
    case 'CONFLICT':
      return error.message;
    case 'FORBIDDEN':
      return 'Your role does not allow you to move money.';
    case 'RATE_LIMITED':
      return 'Too many transfer attempts. Please wait a moment and try again.';
    case 'VALIDATION_FAILED':
      return 'Please check the transfer details and try again.';
    default:
      return error.message;
  }
}
