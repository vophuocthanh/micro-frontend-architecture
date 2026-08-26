import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import type { ApiErrorBody, ApiErrorCode } from '@banking/contracts';

import { DomainException } from '../errors/domain.exception';

interface NestValidationBody {
  message?: string | string[];
  error?: string;
}

/**
 * The single exit point for every failure, so that clients see one error shape
 * whatever went wrong — a validation failure, a domain rule, or a bug.
 *
 * Unexpected errors are logged with their stack and their correlation id but
 * answered with a generic message: an internal error string is exactly the kind
 * of detail that tells an attacker which library version to target.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const body = this.toErrorBody(exception, request);

    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${body.requestId}] ${request.method} ${request.url} from "${request.sourceApp}" failed`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `[${body.requestId}] ${request.method} ${request.url} from "${request.sourceApp}" → ${body.statusCode} ${body.code}`,
      );
    }

    response.status(body.statusCode).json(body);
  }

  private toErrorBody(exception: unknown, request: Request): ApiErrorBody {
    const base = {
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof DomainException) {
      return {
        ...base,
        statusCode: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        ...(exception.details ? { details: exception.details } : {}),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      return {
        ...base,
        statusCode: status,
        code: this.codeForStatus(status),
        message: this.messageFrom(payload, exception.message),
        ...this.detailsFrom(payload),
      };
    }

    return {
      ...base,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    };
  }

  private codeForStatus(status: number): ApiErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_FAILED';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHENTICATED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      default:
        return status >= HttpStatus.INTERNAL_SERVER_ERROR ? 'INTERNAL_ERROR' : 'VALIDATION_FAILED';
    }
  }

  private messageFrom(payload: string | object, fallback: string): string {
    if (typeof payload === 'string') return payload;
    const { message } = payload as NestValidationBody;
    if (Array.isArray(message)) return 'Request validation failed';
    return message ?? fallback;
  }

  /** `ValidationPipe` reports failures as a flat string array; group them by field. */
  private detailsFrom(payload: string | object): Pick<ApiErrorBody, 'details'> | Record<string, never> {
    if (typeof payload === 'string') return {};
    const { message } = payload as NestValidationBody;
    if (!Array.isArray(message)) return {};

    const details: Record<string, string[]> = {};
    for (const entry of message) {
      const field = entry.split(' ')[0] ?? 'unknown';
      (details[field] ??= []).push(entry);
    }
    return { details };
  }
}
