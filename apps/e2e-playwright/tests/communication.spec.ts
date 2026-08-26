import { expect, test } from '@playwright/test';

import { readTotalAssets, signIn, toNumber, USERS } from './fixtures';

/**
 * The event contract is the only channel between micro frontends. This is the
 * test that would fail if someone "simplified" it into a direct import.
 */
test('a transfer in the Angular remote refreshes the React remote', async ({ page }) => {
  await signIn(page, USERS.customer);

  const before = toNumber(await readTotalAssets(page));

  await page.getByRole('link', { name: 'Transfer' }).click();
  await page.getByText('Which account should the money come from?').waitFor();
  await page.locator('button').filter({ hasText: 'Everyday Checking' }).first().click();
  await page.locator('button').filter({ hasText: 'Jordan Lee' }).first().click();

  await page.locator('#transfer-amount').fill('25');
  await page.getByRole('button', { name: 'Continue' }).click();

  // The fee shown at review comes from the server, never from client-side
  // arithmetic — below $1,000 the policy makes it free.
  await expect(page.getByText('Total charged')).toBeVisible();
  await expect(page.locator('dl')).toContainText('$25.00');

  await page.getByRole('button', { name: 'Confirm transfer' }).click();
  await expect(page.getByText('Transfer sent')).toBeVisible();

  // The Angular remote asked the shell for a toast; it owns no global UI.
  // Asserted on the toast's own text rather than on its live-region wrapper,
  // which the toast library keeps mounted and hidden between notifications.
  await expect(page.getByText(/sent to Jordan Lee/)).toBeVisible();

  await page.getByRole('link', { name: 'Dashboard' }).click();
  const after = toNumber(await readTotalAssets(page));

  // Not a page reload: the Dashboard invalidated its own cache in response to
  // `transfer:completed`, having never heard of the Transfer application.
  expect(before - after).toBeCloseTo(25, 2);
});

test('an account selected in the Vue remote pre-fills the Angular wizard', async ({ page }) => {
  await signIn(page, USERS.customer);

  await page.getByRole('link', { name: 'Accounts' }).click();
  await page.locator('button').filter({ hasText: 'Rainy Day Savings' }).first().click();
  await expect(page).toHaveURL(/\/banking\/accounts\/.+/);

  await page.getByRole('link', { name: 'Transfer' }).click();
  await expect(page.getByText('Which account should the money come from?')).toBeVisible();
});
