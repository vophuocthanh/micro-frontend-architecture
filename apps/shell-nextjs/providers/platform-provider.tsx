'use client';

import type { EventBus, MfeRoute, PlatformEvent, Unsubscribe } from '@banking/contracts';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef } from 'react';

import { createPlatformBus, logPlatformEvent } from '@/lib/events/platform-bus';

interface PlatformContextValue {
  events: EventBus;
  /** Builds the route slice handed to a remote mounted at `basePath`. */
  createRoute: (basePath: string) => MfeRoute;
  navigate: (path: string) => void;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

/**
 * Provides the two capabilities every remote needs from the host: a way to talk
 * to the platform, and a way to participate in routing without owning the URL.
 */
export function PlatformProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Kept in a ref so the subscription callbacks below always read the *current*
  // path without the bus being rebuilt — and every remote remounted — on every
  // navigation.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const listenersRef = useRef(new Set<(pathname: string) => void>());

  useEffect(() => {
    for (const listener of listenersRef.current) {
      listener(pathname);
    }
  }, [pathname]);

  const value = useMemo<PlatformContextValue>(() => {
    const navigate = (path: string): void => router.push(path);

    const events = createPlatformBus((event: PlatformEvent) => {
      logPlatformEvent(event);
    });

    return {
      events,
      navigate,
      createRoute: (basePath) => ({
        current: () => toSubPath(pathnameRef.current, basePath),
        subscribe: (listener): Unsubscribe => {
          const wrapped = (nextPathname: string): void =>
            listener(toSubPath(nextPathname, basePath));
          listenersRef.current.add(wrapped);
          return () => listenersRef.current.delete(wrapped);
        },
      }),
    };
  }, [router]);

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): PlatformContextValue {
  const value = useContext(PlatformContext);
  if (!value) {
    throw new Error('usePlatform must be used inside <PlatformProvider>');
  }
  return value;
}

function toSubPath(pathname: string, basePath: string): string {
  if (!pathname.startsWith(basePath)) return '/';
  return pathname.slice(basePath.length) || '/';
}
