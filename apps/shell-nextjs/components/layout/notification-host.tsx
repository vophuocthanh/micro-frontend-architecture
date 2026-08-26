'use client';

import { useEffect, useState } from 'react';

import { usePlatform } from '@/providers/platform-provider';

interface Toast {
  id: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

const DEFAULT_TTL_MS = 5_000;

const LEVEL_STYLES: Record<Toast['level'], string> = {
  info: 'border-slate-200 bg-white text-slate-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-900',
};

/**
 * The platform's only toast surface.
 *
 * Remotes ask for a notification by publishing `notification:show`; none of
 * them renders global UI itself. Three applications each floating their own
 * toast stack would overlap, disagree on placement, and give the user three
 * different-looking versions of the same product.
 */
export function NotificationHost() {
  const { events } = usePlatform();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();

    const unsubscribe = events.on('notification:show', (event) => {
      const toast: Toast = {
        id: event.meta.correlationId,
        level: event.payload.level,
        message: event.payload.message,
      };

      setToasts((current) => [...current, toast]);

      const timer = setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
        timers.delete(timer);
      }, event.payload.ttlMs ?? DEFAULT_TTL_MS);

      timers.add(timer);
    });

    return () => {
      unsubscribe();
      // Pending dismissals would otherwise call setState on an unmounted host.
      for (const timer of timers) clearTimeout(timer);
    };
  }, [events]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2"
    >
      {toasts.map((toast) => (
        <p
          key={toast.id}
          className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg ${LEVEL_STYLES[toast.level]}`}
        >
          {toast.message}
        </p>
      ))}
    </div>
  );
}
