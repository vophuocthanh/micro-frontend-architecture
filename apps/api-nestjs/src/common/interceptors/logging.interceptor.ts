import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * One structured line per successful request, carrying the fields that make a
 * micro frontend platform debuggable: which application called, on behalf of
 * which user, under which correlation id.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Request');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          JSON.stringify({
            requestId: request.requestId,
            application: request.sourceApp,
            userId: request.user?.id ?? null,
            method: request.method,
            path: request.url,
            durationMs: Date.now() - startedAt,
            timestamp: new Date().toISOString(),
          }),
        );
      }),
    );
  }
}
