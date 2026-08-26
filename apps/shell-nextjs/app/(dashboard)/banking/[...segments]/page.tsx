'use client';

import { usePathname } from 'next/navigation';

import { ErrorBoundary } from '@/components/error/error-boundary';
import { RemoteOutlet } from '@/components/layout/remote-outlet';
import { Card, CardContent } from '@/components/ui/card';
import { findRemoteForPath } from '@/lib/config/runtime-config';
import { useRuntimeConfig } from '@/providers/config-provider';

/**
 * One catch-all route for the entire `/banking` space.
 *
 * A required catch-all (`[...segments]`) rather than an optional one: bare
 * `/banking` is normalised by middleware, so the optional form would buy
 * nothing — and Next.js 15 fails to serve the chunk it generates for a
 * `[[...]]` segment, which surfaces as a blank page rather than an error.
 *
 * A remote owns everything below its base path, so the shell cannot enumerate
 * the URLs — `/banking/accounts/acc_123` is a route only the Account
 * application knows about. Matching a prefix here is what makes deep links and
 * a browser refresh work: the shell resolves *which* application owns the URL
 * and hands it the rest.
 */
export default function BankingPage() {
  const pathname = usePathname();
  const config = useRuntimeConfig();
  const remote = findRemoteForPath(config, pathname);

  if (!remote) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="py-10 text-center">
          <p className="text-lg font-semibold">Page not found</p>
          <p className="text-muted-foreground mt-1 text-sm">
            No application on this platform owns{' '}
            <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">{pathname}</code>.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary area={remote.id}>
      {/*
        Keyed by remote id, not by pathname: navigating within one remote must
        not remount it (that would discard a half-filled transfer form), while
        moving between remotes must.
      */}
      <RemoteOutlet key={remote.id} remote={remote} />
    </ErrorBoundary>
  );
}
