import { expect, test } from '@playwright/test';

import { signIn, USERS } from './fixtures';

/**
 * Authorisation is checked in three places, and this suite covers all three:
 * the shell's navigation, the remote's own guard, and — the one that matters —
 * the API.
 */
test.describe('RBAC', () => {
  test('a STAFF user is not offered the transfer section', async ({ page }) => {
    await signIn(page, USERS.staff);

    await expect(page.getByRole('link', { name: 'Accounts' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Transfer' })).toHaveCount(0);
  });

  test('a STAFF user typing the transfer URL is refused', async ({ page }) => {
    await signIn(page, USERS.staff);
    await page.goto('/banking/transfer');

    await expect(page.getByText('Not available for your role')).toBeVisible();
  });

  test('the API refuses a transfer regardless of what the UI showed', async ({ page }) => {
    await signIn(page, USERS.staff);

    // Hiding a button is a courtesy to the user; this is the control. The
    // request is made exactly as a browser console would make it.
    const status = await page.evaluate(async () => {
      const login = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: 'staff@bank.test', password: 'Password123!' }),
      });
      const { accessToken } = (await login.json()) as { accessToken: string };

      const response = await fetch('http://localhost:4000/transfers', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          sourceAccountId: 'anything',
          beneficiaryId: 'anything',
          amountMinor: 100,
          idempotencyKey: crypto.randomUUID(),
        }),
      });

      return response.status;
    });

    expect(status).toBe(403);
  });

  test('an unauthenticated visitor is sent to the login screen', async ({ page }) => {
    await page.goto('/banking/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });
});
