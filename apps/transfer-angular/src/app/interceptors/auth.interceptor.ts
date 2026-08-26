import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';

import { SHELL_CONTEXT } from '../core/shell-context.token';

/**
 * Attaches the session and the calling application to every outbound request.
 *
 * The token is fetched per request rather than captured once: the shell may
 * have refreshed it since this remote mounted, and asking each time is what
 * lets a long-lived transfer wizard survive a token expiry mid-flow.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const context = inject(SHELL_CONTEXT);

  return from(context.auth.getAccessToken()).pipe(
    switchMap((token) =>
      next(
        request.clone({
          setHeaders: {
            authorization: `Bearer ${token}`,
            'x-application-id': 'transfer',
            'x-request-id': crypto.randomUUID(),
          },
        }),
      ),
    ),
  );
};
