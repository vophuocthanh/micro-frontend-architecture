'use client';

import { Landmark, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShellApiError } from '@/lib/auth/api-client';
import { useAuth } from '@/providers/auth-provider';

const DEMO_ACCOUNTS = [
  { email: 'customer@bank.test', role: 'Customer', note: 'can transfer' },
  { email: 'staff@bank.test', role: 'Staff', note: 'no transfer permission' },
  { email: 'admin@bank.test', role: 'Admin', note: 'full access' },
] as const;

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
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="bg-primary text-primary-foreground grid size-11 place-items-center rounded-xl">
            <Landmark className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Northwind Bank</h1>
            <p className="text-muted-foreground text-sm">Sign in to your accounts</p>
          </div>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-muted/40 gap-0 py-4">
          <CardHeader className="px-4 pb-3">
            <CardTitle className="text-xs font-medium">Demo accounts</CardTitle>
            <CardDescription className="text-xs">
              All use the password <span className="font-mono">Password123!</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 px-4">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => setEmail(account.email)}
                className="hover:bg-background flex w-full items-baseline justify-between gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors"
              >
                <span className="font-mono">{account.email}</span>
                <span className="text-muted-foreground shrink-0">{account.note}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
