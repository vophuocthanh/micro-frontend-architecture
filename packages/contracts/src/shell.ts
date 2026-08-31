import type { AuthenticatedUser } from './auth.js';
import type { RemoteAppId } from './common.js';
import type { EventBus, Unsubscribe } from './events.js';
import type { Permission } from './rbac.js';

/**
 * What the shell lends a remote for the duration of a mount.
 *
 * Deliberately narrow: a remote receives capabilities (ask for a token, publish
 * an event, request navigation) rather than state it could mutate. Nothing here
 * is framework-specific, which is what lets one contract serve a React, a Vue
 * and an Angular application without any of them sharing a runtime.
 */
export interface ShellAuth {
  user: AuthenticatedUser;
  /**
   * Resolves a *currently valid* access token, transparently refreshing an
   * expired one. Remotes never see, store or refresh the token themselves —
   * the shell owns the session, so there is exactly one refresh in flight and
   * exactly one place that can log the user out.
   */
  getAccessToken(): Promise<string>;
  hasPermission(permission: Permission): boolean;
}

/**
 * How a remote participates in routing without owning the URL.
 *
 * Two routers writing to `history` in one page is the classic micro frontend
 * bug: the host pushes a state the remote does not recognise, the remote
 * rewrites it, and the back button stops working. So there is exactly one
 * owner — the shell — and remotes read their slice of the path and ask for
 * changes. Deep links and a browser refresh work because the path is the real
 * URL, not private state.
 */
export interface MfeRoute {
  /** Path *within* `basePath`, always leading-slashed: `/`, `/acc_123`. */
  current(): string;
  /** Fires whenever the shell's URL changes, including back/forward. */
  subscribe(listener: (subPath: string) => void): Unsubscribe;
}

export interface MfeMountContext {
  auth: ShellAuth;
  events: EventBus;
  /** Route ownership: the URL belongs to the shell, remotes ask for changes. */
  navigate(path: string): void;
  /**
   * Hands the user off to another application on the platform.
   *
   * `navigate()` takes a URL, which would mean the caller knowing where another
   * application is mounted — and that is knowledge no remote is entitled to.
   * The registry the shell resolves at runtime is the only thing that legitimately
   * knows it, and it can be repointed between deploys.
   *
   * So the caller states an intent — "take the user to Transfer" — and the shell
   * resolves the address. Moving Transfer to `/payments/send` then breaks
   * nothing, and a remote still cannot fabricate a route into an application
   * the user has no permission for: the shell refuses, and the outlet enforces
   * the permission again on arrival.
   */
  navigateToApp(app: RemoteAppId, subPath?: string): void;
  /** Where this remote is mounted, e.g. `/banking/accounts`. */
  basePath: string;
  /** This remote's own slice of the URL, owned by the shell. */
  route: MfeRoute;
  apiBaseUrl: string;
  locale: string;
  theme: 'light' | 'dark';
}

/** Tearing down must be synchronous and total — no timers, no listeners left. */
export type MfeUnmount = () => void;

export type MfeMount = (
  element: HTMLElement,
  context: MfeMountContext,
) => MfeUnmount | Promise<MfeUnmount>;

/**
 * The shape every remote's exposed module must have. This *is* the federation
 * contract; breaking it is a major version bump for that remote.
 */
export interface MfeModule {
  mount: MfeMount;
  /** The remote's own package version, surfaced in the shell for diagnostics. */
  version: string;
}

export interface RemoteDefinition {
  id: RemoteAppId;
  /** Module Federation container name, must match the remote's build config. */
  name: string;
  /** Absolute URL of `remoteEntry.js`. */
  entry: string;
  /** Exposed module key, e.g. `./mount`. */
  module: string;
  /** Shell route this remote owns. */
  basePath: string;
  /** Denied without it — enforced again by the API on every request. */
  requiredPermission: Permission;
}

/**
 * Fetched by the shell at runtime rather than compiled in, so that pointing a
 * route at `dashboard@3.1.0` instead of `3.0.0` — or at a rolled-back build —
 * is a config change, not a shell rebuild and redeploy.
 */
export interface RuntimeConfig {
  apiBaseUrl: string;
  remotes: RemoteDefinition[];
}
