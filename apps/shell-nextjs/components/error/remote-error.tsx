import { AlertTriangle, RotateCw } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RemoteLoadError } from '@/lib/federation/runtime';

interface RemoteErrorProps {
  remoteId: string;
  error: Error;
  onRetry: () => void;
}

/**
 * What the user sees when one remote cannot be loaded.
 *
 * The rest of the platform keeps working: navigation, the session and the other
 * two applications are untouched, because this failure is scoped to one outlet.
 * That is error isolation made visible.
 */
export function RemoteError({ remoteId, error, onRetry }: RemoteErrorProps) {
  const reason = error instanceof RemoteLoadError ? error.reason : 'unavailable';

  return (
    <Alert className="mx-auto max-w-xl">
      <AlertTriangle className="size-4" aria-hidden="true" />
      <AlertTitle>Failed to load {remoteId}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{describe(reason)}</p>
        <p className="text-muted-foreground font-mono text-xs break-all">{error.message}</p>

        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw className="size-3.5" aria-hidden="true" />
          Retry
        </Button>

        <p className="text-muted-foreground text-xs">
          Other areas of the platform are unaffected and remain available.
        </p>
      </AlertDescription>
    </Alert>
  );
}

function describe(reason: string): string {
  switch (reason) {
    case 'timeout':
      return 'This application did not respond in time. It may be deploying or under heavy load.';
    case 'invalid-contract':
      return 'This application loaded but does not match the version this shell expects. A rollback may be in progress.';
    default:
      return 'This application could not be reached. It may be offline.';
  }
}
