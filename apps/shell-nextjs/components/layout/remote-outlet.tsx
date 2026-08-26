'use client';

import type { MfeMountContext, MfeUnmount, RemoteDefinition } from '@banking/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ShieldAlert } from 'lucide-react';

import { RemoteError } from '@/components/error/remote-error';
import { RemoteSkeleton } from '@/components/loading/remote-skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { sessionStore } from '@/lib/auth/session-store';
import { loadRemoteModule } from '@/lib/federation/runtime';
import { useAuth } from '@/providers/auth-provider';
import { useRuntimeConfig } from '@/providers/config-provider';
import { usePlatform } from '@/providers/platform-provider';

interface RemoteOutletProps {
  remote: RemoteDefinition;
}

type OutletState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; error: Error };

/**
 * Mounts one micro frontend into the shell's DOM.
 *
 * This component is the entire integration surface of the platform: it fetches
 * a container at runtime, hands it a DOM node and a set of capabilities, and
 * tears it down again. Everything downstream — React, Vue or Angular — is
 * opaque to the shell.
 */
export function RemoteOutlet({ remote }: RemoteOutletProps) {
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<OutletState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  const { user, hasPermission } = useAuth();
  const config = useRuntimeConfig();
  const { events, navigate, createRoute } = usePlatform();

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((count) => count + 1);
  }, []);

  useEffect(() => {
    const element = container.current;
    if (!element || !user) return;

    let unmount: MfeUnmount | null = null;
    // Guards the window between an unmount and a still-in-flight load: without
    // it, a remote can mount into a node React has already discarded.
    let cancelled = false;

    const context: MfeMountContext = {
      auth: {
        user,
        getAccessToken: () => sessionStore.getAccessToken(),
        hasPermission,
      },
      events,
      navigate,
      basePath: remote.basePath,
      route: createRoute(remote.basePath),
      apiBaseUrl: config.apiBaseUrl,
      locale: 'en-US',
      theme: 'light',
    };

    void (async () => {
      try {
        const remoteModule = await loadRemoteModule(config, remote);
        if (cancelled) return;

        const teardown = await remoteModule.mount(element, context);
        if (cancelled) {
          // The outlet unmounted while `mount` was still running; undo it
          // immediately rather than leaking a live application.
          teardown();
          return;
        }

        unmount = teardown;
        setState({ status: 'ready' });
      } catch (error) {
        if (cancelled) return;
        setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) });
      }
    })();

    return () => {
      cancelled = true;
      unmount?.();
      // Belt and braces: a remote that leaves nodes behind must not bleed into
      // whatever mounts here next.
      element.replaceChildren();
    };
    // `attempt` is in the list so Retry re-runs the whole effect.
  }, [remote, config, user, hasPermission, events, navigate, createRoute, attempt]);

  if (!hasPermission(remote.requiredPermission)) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <ShieldAlert className="text-muted-foreground size-6" aria-hidden="true" />
          <p role="status" className="text-base font-semibold">
            Not available for your role
          </p>
          <p className="text-muted-foreground text-sm">
            You need the {remote.requiredPermission.replace(/_/g, ' ').toLowerCase()} permission to
            open this area.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {state.status === 'loading' && <RemoteSkeleton label={`Loading ${remote.id}`} />}
      {state.status === 'error' && (
        <RemoteError remoteId={remote.id} error={state.error} onRetry={retry} />
      )}
      {/*
        Always rendered, and never conditionally: the remote needs a stable node
        to mount into, and React must not reuse or reorder the children it owns.
        Hiding it during loading avoids a flash of an empty box.
      */}
      <div ref={container} hidden={state.status !== 'ready'} />
    </>
  );
}
