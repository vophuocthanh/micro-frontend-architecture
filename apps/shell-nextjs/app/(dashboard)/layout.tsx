'use client';

import { Loader2 } from 'lucide-react';

import { AppHeader } from '@/components/layout/app-header';
import { NotificationHost } from '@/components/layout/notification-host';
import { useAuth } from '@/providers/auth-provider';

/**
 * Chrome shared by every authenticated route.
 *
 * While the session is being restored from the refresh cookie this renders a
 * neutral placeholder rather than the layout: showing navigation for a user we
 * cannot yet name would be a lie that lasts one network round trip.
 */
export default function BankingLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  if (status !== 'authenticated') {
    return (
      <div className="grid min-h-screen place-items-center" role="status" aria-live="polite">
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Restoring your session…
        </p>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <NotificationHost />
    </div>
  );
}
