'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

import { Toaster } from '@/components/ui/sonner';
import { usePlatform } from '@/providers/platform-provider';

const DEFAULT_TTL_MS = 5_000;

/**
 * The platform's only toast surface.
 *
 * Remotes ask for a notification by publishing `notification:show`; none of them
 * renders global UI itself. Three applications each floating their own toast
 * stack would overlap, disagree on placement, and give the user three
 * different-looking versions of the same product.
 */
export function NotificationHost() {
  const { events } = usePlatform();

  useEffect(() => {
    const unsubscribe = events.on('notification:show', (event) => {
      const { level, message, ttlMs } = event.payload;
      const options = { duration: ttlMs ?? DEFAULT_TTL_MS };

      switch (level) {
        case 'success':
          toast.success(message, options);
          break;
        case 'warning':
          toast.warning(message, options);
          break;
        case 'error':
          toast.error(message, options);
          break;
        default:
          toast(message, options);
      }
    });

    return unsubscribe;
  }, [events]);

  return <Toaster position="bottom-right" richColors closeButton />;
}
