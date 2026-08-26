'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/providers/auth-provider';
import { useRuntimeConfig } from '@/providers/config-provider';

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  account: 'Accounts',
  transfer: 'Transfer',
};

/**
 * Navigation across the whole platform, owned by the shell.
 *
 * Built from the same remote registry the outlet loads from, so adding a fourth
 * micro frontend is one entry in the config rather than an edit here *and*
 * there. Entries the user has no permission for are omitted — the API enforces
 * the same rule, so this is presentation, not protection.
 */
export function MainNav() {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const config = useRuntimeConfig();

  const visible = config.remotes.filter((remote) =>
    hasPermission(remote.requiredPermission),
  );

  return (
    <nav aria-label="Banking sections" className="flex gap-1">
      {visible.map((remote) => {
        const isActive = pathname.startsWith(remote.basePath);

        return (
          <Link
            key={remote.id}
            href={remote.basePath}
            aria-current={isActive ? 'page' : undefined}
            className={
              isActive
                ? 'rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700'
                : 'rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100'
            }
          >
            {LABELS[remote.id] ?? remote.id}
          </Link>
        );
      })}
    </nav>
  );
}
