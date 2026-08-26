'use client';

import { MainNav } from '@/components/navigation/main-nav';
import { useAuth } from '@/providers/auth-provider';

/**
 * The one piece of chrome every micro frontend renders beneath. Owning it in
 * the shell is what makes three independently deployed applications look like
 * one product.
 */
export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-base font-bold tracking-tight text-slate-900">Northwind Bank</span>
          <MainNav />
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <span className="text-right text-sm leading-tight">
              <span className="block font-semibold text-slate-900">{user.fullName}</span>
              <span className="block text-xs text-slate-500">{user.role}</span>
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
