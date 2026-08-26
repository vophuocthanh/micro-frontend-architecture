import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

import type { AppId } from '@banking/contracts';

const KNOWN_APPS: readonly string[] = ['shell', 'dashboard', 'account', 'transfer'];

/**
 * Stamps every request with a correlation id and the calling application.
 *
 * In a distributed frontend a failed call could have come from any of four
 * independently deployed applications; without this the only thing a log line
 * proves is that *someone* called the API. An id supplied by the caller is
 * honoured so a single user interaction stays traceable across the hop from
 * micro frontend to gateway.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incomingId = req.header('x-request-id');
    req.requestId = incomingId && incomingId.length <= 100 ? incomingId : randomUUID();

    const declaredApp = req.header('x-application-id');
    req.sourceApp = declaredApp && KNOWN_APPS.includes(declaredApp) ? (declaredApp as AppId) : 'unknown';

    res.setHeader('x-request-id', req.requestId);
    next();
  }
}
