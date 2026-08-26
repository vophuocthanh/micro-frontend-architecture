interface RemoteSkeletonProps {
  label: string;
}

/**
 * Shown while a remote's container is being fetched and mounted.
 *
 * A shaped skeleton rather than a spinner: the layout it occupies is roughly
 * the layout that will replace it, so the page does not jump when the remote
 * arrives — the single biggest source of layout shift in a runtime-composed UI.
 */
export function RemoteSkeleton({ label }: RemoteSkeletonProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-4">
      <span className="sr-only">{label}</span>
      <div className="h-28 animate-pulse rounded-xl bg-slate-200" aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-48 animate-pulse rounded-xl bg-slate-200" aria-hidden="true" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-200" aria-hidden="true" />
      </div>
    </div>
  );
}
