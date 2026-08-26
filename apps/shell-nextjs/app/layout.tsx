import type { Metadata } from 'next';

import { readRuntimeConfig } from '@/lib/config/runtime-config';
import { AuthProvider } from '@/providers/auth-provider';
import { ConfigProvider } from '@/providers/config-provider';
import { PlatformProvider } from '@/providers/platform-provider';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Northwind Bank',
    template: '%s · Northwind Bank',
  },
  description: 'Enterprise banking platform composed from independently deployed micro frontends.',
  // A banking session has no business appearing in a search index.
  robots: { index: false, follow: false },
};

/**
 * Rendered per request rather than prerendered.
 *
 * This is what makes the remote registry genuinely *runtime* configuration: the
 * environment is read on each request, so changing `TRANSFER_REMOTE_ENTRY` and
 * restarting repoints the route without rebuilding the shell. A prerendered
 * layout would bake today's URLs into the HTML and quietly turn the registry
 * back into a build-time constant.
 */
export const dynamic = 'force-dynamic';

/**
 * The root layout is a Server Component and stays one: it reads configuration,
 * renders the document, and hands both to the client providers. The client
 * boundary begins inside them, which is as late as the architecture allows
 * given that federation is a runtime, browser-only mechanism.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const config = readRuntimeConfig();

  return (
    <html lang="en">
      {/*
        Browser extensions (password managers, ColorZilla, and friends) mutate
        <body> before React hydrates, which reads as a mismatch React cannot
        patch. Suppressing here covers that one element only; it does not hide
        mismatches in anything rendered inside it.
      */}
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <ConfigProvider config={config}>
          <PlatformProvider>
            <AuthProvider>{children}</AuthProvider>
          </PlatformProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
