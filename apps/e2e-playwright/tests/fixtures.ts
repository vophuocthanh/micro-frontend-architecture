import type { Page } from '@playwright/test';

export const DEMO_PASSWORD = 'Password123!';

export const USERS = {
  customer: 'customer@bank.test',
  staff: 'staff@bank.test',
  admin: 'admin@bank.test',
} as const;

/** Signs in through the shell — the only login screen on the platform. */
export async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/banking/**');
}

/** The formatted total the Dashboard renders, e.g. `$33,098.75`. */
export async function readTotalAssets(page: Page): Promise<string> {
  // Queried by accessible name rather than by tag: the panel is a labelled
  // region, and which element carries that role is the component library's
  // business, not the test's.
  const panel = page.getByRole('region', { name: 'Total assets' });
  await panel.getByText('Across all accounts').waitFor();
  return panel.locator('text=/^\\$/').first().innerText();
}

export function toNumber(formatted: string): number {
  return Number(formatted.replace(/[^0-9.]/g, ''));
}
