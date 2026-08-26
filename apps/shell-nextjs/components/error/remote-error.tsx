import { RemoteLoadError } from '@/lib/federation/runtime';

interface RemoteErrorProps {
  remoteId: string;
  error: Error;
  onRetry: () => void;
}

/**
 * What the user sees when one remote cannot be loaded.
 *
 * The rest of the platform keeps working: the navigation, the session and the
 * other two applications are untouched, because this failure is scoped to one
 * outlet. That is the promise of error isolation made visible.
 */
export function RemoteError({ remoteId, error, onRetry }: RemoteErrorProps) {
  const reason = error instanceof RemoteLoadError ? error.reason : 'unavailable';

  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-900"
    >
      <p className="text-base font-semibold">Failed to load {remoteId}</p>
      <p className="mx-auto mt-2 max-w-md text-amber-800">{describe(reason)}</p>
      <p className="mt-2 font-mono text-xs text-amber-700">{error.message}</p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-lg border border-amber-300 bg-white px-4 py-2 font-semibold text-amber-900 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
      >
        Retry
      </button>

      <p className="mt-4 text-xs text-amber-700">
        Other areas of the platform are unaffected and remain available.
      </p>
    </div>
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
