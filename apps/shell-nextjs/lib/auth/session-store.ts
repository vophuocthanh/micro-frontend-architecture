import type { AuthenticatedUser, LoginRequest, LoginResponse } from '@banking/contracts';

import { authApi } from './api-client';

/** Refresh this far before expiry, so no request starts with a dying token. */
const REFRESH_SKEW_MS = 60_000;

export type SessionListener = (user: AuthenticatedUser | null) => void;

/**
 * The single owner of the browser session.
 *
 * The access token lives **in memory only**. It is never written to
 * `localStorage` or `sessionStorage`, so an XSS payload — in the shell or in
 * any of the three remotes — has no persisted credential to steal; it would
 * have to exfiltrate during the lifetime of the page it already controls. The
 * cost is that a reload loses the token, which is exactly what the httpOnly
 * refresh cookie is for.
 */
class SessionStore {
  /**
   * Injected once by `AuthProvider` from the server-resolved config. Not read
   * from the environment here, because a module-level read would be inlined at
   * build time and quietly pin the browser to yesterday's API URL.
   */
  private apiBaseUrl = '';
  private accessToken: string | null = null;
  private expiresAt = 0;
  private user: AuthenticatedUser | null = null;
  private readonly listeners = new Set<SessionListener>();

  /**
   * Deduplicates concurrent refreshes.
   *
   * Three remotes mount at once and all ask for a token in the same tick.
   * Without this they would fire three refreshes; each rotates the cookie, so
   * the second and third would present an already-revoked token and the API
   * would treat it as theft and log the user out. One in-flight promise, shared.
   */
  private refreshInFlight: Promise<LoginResponse> | null = null;

  configure(apiBaseUrl: string): void {
    this.apiBaseUrl = apiBaseUrl;
  }

  getUser(): AuthenticatedUser | null {
    return this.user;
  }

  subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async login(credentials: LoginRequest): Promise<AuthenticatedUser> {
    this.apply(await authApi.login(this.apiBaseUrl, credentials));
    return this.user as AuthenticatedUser;
  }

  /**
   * Rebuilds the session after a page load from the refresh cookie alone.
   * Returns null when there is no valid session — the caller redirects to login.
   */
  async restore(): Promise<AuthenticatedUser | null> {
    try {
      this.apply(await this.refresh());
      return this.user;
    } catch {
      this.clear();
      return null;
    }
  }

  /**
   * Handed to every remote through the mount contract. This is the only way a
   * remote can obtain a credential, which means the shell can revoke access to
   * all of them at once simply by clearing this store.
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.expiresAt - REFRESH_SKEW_MS) {
      return this.accessToken;
    }

    this.apply(await this.refresh());

    if (!this.accessToken) {
      throw new Error('Session expired');
    }

    return this.accessToken;
  }

  async logout(): Promise<void> {
    try {
      await authApi.logout(this.apiBaseUrl);
    } finally {
      // Cleared even if the network call fails: a user who clicked "log out"
      // must not be left holding a live token because the server was slow.
      this.clear();
    }
  }

  /** Drops the session without calling the API — used when a refresh fails. */
  clear(): void {
    this.accessToken = null;
    this.expiresAt = 0;
    this.user = null;
    this.notify();
  }

  private refresh(): Promise<LoginResponse> {
    this.refreshInFlight ??= authApi.refresh(this.apiBaseUrl).finally(() => {
      this.refreshInFlight = null;
    });

    return this.refreshInFlight;
  }

  private apply(session: LoginResponse): void {
    this.accessToken = session.accessToken;
    this.expiresAt = new Date(session.expiresAt).getTime();
    this.user = session.user;
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.user);
    }
  }
}

export const sessionStore = new SessionStore();
