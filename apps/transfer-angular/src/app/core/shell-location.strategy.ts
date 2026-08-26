import type { LocationChangeListener } from '@angular/common';
import { LocationStrategy } from '@angular/common';
import { inject, Injectable, type OnDestroy } from '@angular/core';

import { SHELL_CONTEXT } from './shell-context.token';

/**
 * Lets the Angular Router work normally while the shell keeps sole ownership of
 * the browser URL.
 *
 * This is the piece that makes an embedded framework router safe. Angular
 * routes against the sub-path the shell exposes and asks the shell to navigate;
 * it never touches `history` itself. Without it, two routers would push
 * competing states and the back button would break — the classic micro frontend
 * routing failure.
 */
@Injectable()
export class ShellLocationStrategy extends LocationStrategy implements OnDestroy {
  private readonly context = inject(SHELL_CONTEXT);
  private readonly listeners = new Set<LocationChangeListener>();

  private readonly unsubscribe = this.context.route.subscribe(() => {
    // Angular only needs to know *that* the location moved; it re-reads the
    // path through `path()` immediately afterwards.
    for (const listener of this.listeners) {
      listener({ type: 'popstate', state: null });
    }
  });

  override path(): string {
    return this.context.route.current();
  }

  override prepareExternalUrl(internal: string): string {
    const suffix = internal.startsWith('/') ? internal : `/${internal}`;
    return suffix === '/' ? this.context.basePath : `${this.context.basePath}${suffix}`;
  }

  override pushState(_state: unknown, _title: string, url: string, queryParams: string): void {
    this.context.navigate(this.prepareExternalUrl(url + queryParams));
  }

  /**
   * The shell exposes one navigation primitive, so replace behaves like push.
   * The consequence — a redirect leaves an extra history entry — is a smaller
   * problem than handing a remote the power to rewrite the host's history.
   */
  override replaceState(state: unknown, title: string, url: string, queryParams: string): void {
    this.pushState(state, title, url, queryParams);
  }

  override getBaseHref(): string {
    // Empty, because `path()` already returns a path relative to the base;
    // returning `basePath` here would make Angular strip it a second time.
    return '';
  }

  override getState(): unknown {
    return null;
  }

  override forward(): void {
    window.history.forward();
  }

  override back(): void {
    window.history.back();
  }

  override historyGo(relativePosition: number): void {
    window.history.go(relativePosition);
  }

  override onPopState(fn: LocationChangeListener): void {
    this.listeners.add(fn);
  }

  ngOnDestroy(): void {
    this.unsubscribe();
    this.listeners.clear();
  }
}
