'use client';

import type { AuthenticatedUser, LoginRequest, Permission } from '@banking/contracts';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { sessionStore } from '@/lib/auth/session-store';
import { useRuntimeConfig } from '@/providers/config-provider';

type SessionStatus = 'restoring' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: SessionStatus;
  user: AuthenticatedUser | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Owns the session for the whole platform.
 *
 * On first paint it tries to rebuild the session from the httpOnly refresh
 * cookie. Until that resolves the status is `restoring` — rendering a login
 * screen in the meantime would flash a logged-out UI at a user who is in fact
 * still signed in, on every single reload.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('restoring');
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { apiBaseUrl } = useRuntimeConfig();

  useEffect(() => {
    let cancelled = false;

    // Configured before the first call, so nothing in the store ever has to
    // guess at the API's location.
    sessionStore.configure(apiBaseUrl);

    void sessionStore.restore().then((restored) => {
      if (cancelled) return;
      setUser(restored);
      setStatus(restored ? 'authenticated' : 'anonymous');
    });

    // Keeps the UI in step with a session the store drops on its own — an
    // expired refresh token, for instance, discovered by a background call.
    const unsubscribe = sessionStore.subscribe((next) => {
      setUser(next);
      setStatus(next ? 'authenticated' : 'anonymous');
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [apiBaseUrl]);

  useEffect(() => {
    if (status === 'anonymous' && pathname !== '/login') {
      router.replace('/login');
    }
  }, [status, pathname, router]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      await sessionStore.login(credentials);
      router.replace('/banking/dashboard');
    },
    [router],
  );

  const logout = useCallback(async () => {
    await sessionStore.logout();
    router.replace('/login');
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login,
      logout,
      hasPermission: (permission) => user?.permissions.includes(permission) ?? false,
    }),
    [status, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return value;
}
