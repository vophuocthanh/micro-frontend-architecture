'use client';

import type {
  EventBus,
  MfeRoute,
  PlatformEvent,
  RemoteAppId,
  Unsubscribe,
} from '@banking/contracts';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { createPlatformBus, logPlatformEvent } from '@/lib/events/platform-bus';
import { useRuntimeConfig } from '@/providers/config-provider';

interface PlatformContextValue {
  events: EventBus;
  /** Builds the route slice handed to a remote mounted at `basePath`. */
  createRoute: (basePath: string) => MfeRoute;
  navigate: (path: string) => void;
  /** Resolves an application id against the registry, then navigates to it. */
  navigateToApp: (app: RemoteAppId, subPath?: string) => void;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

/**
 * Provides the two capabilities every remote needs from the host: a way to talk
 * to the platform, and a way to participate in routing without owning the URL.
 */
export function PlatformProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const config = useRuntimeConfig();

  const listenersRef = useRef(new Set<(pathname: string) => void>());

  /**
   * One bus for the lifetime of the shell, created lazily and never rebuilt.
   *
   * `useState` rather than `useMemo`: a memo is a cache React is allowed to
   * discard and recompute, and recomputing this one would drop every remote's
   * subscriptions along with the events retained for replay — the exact state a
   * hand-off between two applications depends on.
   */
  const [events] = useState<EventBus>(() =>
    createPlatformBus((event: PlatformEvent) => {
      logPlatformEvent(event);
    }),
  );

  useEffect(() => {
    for (const listener of listenersRef.current) {
      listener(pathname);
    }
  }, [pathname]);

  /**
   * The registry is read through a ref, updated in an effect rather than during
   * render.
   *
   * Everything in `value` has to keep a stable identity: `RemoteOutlet` lists
   * these callbacks in the dependencies of the effect that mounts a remote, so
   * a new function identity tears a live application down and rebuilds it —
   * discarding, say, a half-filled transfer form. The registry itself arrives
   * as a fresh object whenever the server re-renders the root layout, even when
   * every route in it is identical, so closing over it directly would make that
   * happen for no reason at all.
   */
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  /**
   * The registry is the single source of truth for where an application lives,
   * so a hand-off between two remotes is resolved here rather than by either of
   * them. An id with no entry is a caller bug, not a user-facing failure: log it
   * and stay put, because navigating somewhere arbitrary would be worse than
   * not moving at all.
   */
  const navigateToApp = useCallback(
    (app: RemoteAppId, subPath = ''): void => {
      const target = configRef.current.remotes.find((remote) => remote.id === app);

      if (!target) {
        console.error(`[platform] no application registered under the id "${app}"`);
        return;
      }

      const suffix = subPath && subPath !== '/' ? ensureLeadingSlash(subPath) : '';
      router.push(`${target.basePath}${suffix}`);
    },
    [router],
  );

  const value = useMemo<PlatformContextValue>(() => {
    const navigate = (path: string): void => router.push(path);

    return {
      events,
      navigate,
      navigateToApp,
      createRoute: (basePath) => ({
        /**
         * Read from the browser rather than from React state.
         *
         * `usePathname()` is a mirror of `window.location`, and mirrors lag: a
         * remote that mounts in the same commit as a navigation would see the
         * previous path, because child effects run before the parent's. The
         * location itself is never stale, and it removes the need to hold the
         * path in a ref — which React 19 rightly forbids writing during render.
         */
        current: () =>
          typeof window === 'undefined' ? '/' : toSubPath(window.location.pathname, basePath),
        subscribe: (listener): Unsubscribe => {
          const wrapped = (nextPathname: string): void =>
            listener(toSubPath(nextPathname, basePath));
          listenersRef.current.add(wrapped);
          return () => listenersRef.current.delete(wrapped);
        },
      }),
    };
  }, [router, events, navigateToApp]);

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): PlatformContextValue {
  const value = useContext(PlatformContext);
  if (!value) {
    throw new Error('usePlatform must be used inside <PlatformProvider>');
  }
  return value;
}

function ensureLeadingSlash(subPath: string): string {
  return subPath.startsWith('/') ? subPath : `/${subPath}`;
}

function toSubPath(pathname: string, basePath: string): string {
  if (!pathname.startsWith(basePath)) return '/';
  return pathname.slice(basePath.length) || '/';
}
