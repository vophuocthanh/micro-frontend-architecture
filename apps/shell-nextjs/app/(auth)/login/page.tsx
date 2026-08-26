'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';

import { ShellApiError } from '@/lib/auth/api-client';
import { useAuth } from '@/providers/auth-provider';

/**
 * The single login screen for the platform.
 *
 * No micro frontend authenticates on its own: they receive a session through
 * the mount contract. Three login forms would mean three places to get session
 * fixation, token storage and logout wrong.
 */
export default function LoginPage() {
  const { login, status } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('customer@bank.test');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/banking/dashboard');
    }
  }, [status, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
    } catch (caught) {
      setError(
        caught instanceof ShellApiError && caught.statusCode === 429
          ? 'Too many attempts. Please wait a minute and try again.'
          : 'Incorrect email or password.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-xl font-bold tracking-tight text-slate-900">
          Northwind Bank
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500">Sign in to your accounts</p>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
          className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-blue-600"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-blue-600"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:bg-blue-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          Demo accounts: customer@bank.test · staff@bank.test · admin@bank.test — password
          Password123!
        </p>
      </div>
    </div>
  );
}
