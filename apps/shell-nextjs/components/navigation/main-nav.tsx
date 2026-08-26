'use client';

import { ArrowLeftRight, LayoutDashboard, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useRuntimeConfig } from '@/providers/config-provider';

const NAV: Record<string, { label: string; icon: LucideIcon }> = {
  dashboard: { label: 'Dashboard', icon: LayoutDashboard },
  account: { label: 'Accounts', icon: Wallet },
  transfer: { label: 'Transfer', icon: ArrowLeftRight },
};

/**
 * Navigation across the whole platform, owned by the shell.
 *
 * Built from the same remote registry the outlet loads from, so adding a fourth
 * micro frontend is one config entry rather than an edit here *and* there.
 * Entries the user has no permission for are omitted — the API enforces the
 * same rule, so this is presentation, not protection.
 */
export function MainNav() {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const config = useRuntimeConfig();

  const visible = config.remotes.filter((remote) => hasPermission(remote.requiredPermission));

  return (
    <nav aria-label="Banking sections" className="flex items-center gap-1">
      {visible.map((remote) => {
        const isActive = pathname.startsWith(remote.basePath);
        const item = NAV[remote.id] ?? { label: remote.id, icon: LayoutDashboard };
        const Icon = item.icon;

        return (
          <Link
            key={remote.id}
            href={remote.basePath}
            // The label collapses below `sm`, which would leave the link with
            // no accessible name at all — the icon is decorative. Naming it
            // explicitly keeps it announceable at every width.
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'ring-offset-background focus-visible:ring-ring inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
              isActive
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
