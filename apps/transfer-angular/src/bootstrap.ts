import type { MfeMountContext, MfeUnmount } from '@banking/contracts';
import { LocationStrategy } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { type ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { ShellLocationStrategy } from './app/core/shell-location.strategy';
import { SHELL_CONTEXT } from './app/core/shell-context.token';
import { authInterceptor } from './app/interceptors/auth.interceptor';

/**
 * Starts the Angular application inside an element the caller owns.
 *
 * Kept separate from `mount.ts` on purpose. `mount.ts` is the module Module
 * Federation virtualises, and having the standalone entry import from it too
 * gives the bundler two routes into the same module — a race that shows up as
 * an intermittent `"mount" is not exported by "src/mount.ts"` at build time.
 * Both entry points depend on *this* module instead, and the federation
 * boundary stays a boundary.
 */
export async function bootstrapTransfer(
  element: HTMLElement,
  context: MfeMountContext,
): Promise<MfeUnmount> {
  // Angular bootstraps into a component's selector, so the host element has to
  // carry it. Creating a child leaves the caller's element untouched.
  const host = document.createElement('bank-transfer-root');
  element.appendChild(host);

  const app: ApplicationRef = await bootstrapApplication(AppComponent, {
    providers: [
      { provide: SHELL_CONTEXT, useValue: context },
      // Zoneless: zone.js monkey-patches setTimeout, Promise and every DOM
      // event globally. In a page it shares with React and Vue, that is not a
      // local decision — it changes how *their* async code behaves too.
      provideZonelessChangeDetection(),
      provideHttpClient(withInterceptors([authInterceptor])),
      provideRouter(routes),
      // Replaces Angular's own history handling; see ShellLocationStrategy.
      { provide: LocationStrategy, useClass: ShellLocationStrategy },
    ],
  });

  return () => {
    app.destroy();
    host.remove();
  };
}
