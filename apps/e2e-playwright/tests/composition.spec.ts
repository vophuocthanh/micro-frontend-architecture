import { expect, test } from '@playwright/test';

import { readTotalAssets, signIn, USERS } from './fixtures';

/**
 * Proves the central claim of the architecture: three applications built with
 * three different frameworks, deployed separately, compose into one product at
 * runtime.
 */
test.describe('runtime composition', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, USERS.customer);
  });

  test('the React remote renders live data from the API', async ({ page }) => {
    await expect(page).toHaveURL(/\/banking\/dashboard$/);

    const total = await readTotalAssets(page);
    expect(total).toMatch(/^\$[\d,]+\.\d{2}$/);

    // The chart is drawn from the spending overview endpoint, so a full set of
    // month columns only exists if six months of real transactions came back.
    // Asserted through the chart's accessible caption rather than its markup:
    // that is the contract with a screen-reader user, and it survives the chart
    // being redrawn with different elements.
    const chart = page.getByRole('region', { name: 'Spending overview' }).locator('figure');
    await expect(chart).toBeVisible();
    await expect(chart.locator('figcaption li')).toHaveCount(6);
  });

  test('the Vue remote takes over the accounts section', async ({ page }) => {
    await page.getByRole('link', { name: 'Accounts' }).click();
    await expect(page).toHaveURL(/\/banking\/accounts$/);
    // Queried by accessible name: the card renders the nickname twice — once
    // visually and once for screen readers — so a text query is ambiguous.
    await expect(page.getByRole('button', { name: 'View Everyday Checking' })).toBeVisible();
  });

  test('the Angular remote takes over the transfer section', async ({ page }) => {
    await page.getByRole('link', { name: 'Transfer' }).click();
    await expect(page).toHaveURL(/\/banking\/transfer$/);
    await expect(page.getByText('Which account should the money come from?')).toBeVisible();
  });

  /**
   * The third leg of the platform's hand-offs — React into Vue. Together with
   * the two in `communication.spec.ts` (Vue into Angular, Angular back into
   * Vue) it closes the loop across all three frameworks, with no application
   * importing, or naming the URL of, any other.
   */
  test('an account picked in the React remote opens it in the Vue remote', async ({ page }) => {
    await page.getByRole('button', { name: /Everyday Checking/ }).click();

    await expect(page).toHaveURL(/\/banking\/accounts\/.+/);
    // Vue answered for a deep route the React application knows nothing about.
    await expect(page.getByText('Transaction history')).toBeVisible();
  });

  test('moving between remotes unmounts the previous one', async ({ page }) => {
    const vueAccountCard = page.getByRole('button', { name: 'View Everyday Checking' });

    await page.getByRole('link', { name: 'Accounts' }).click();
    await expect(vueAccountCard).toBeVisible();

    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByText('Across all accounts')).toBeVisible();
    // The Vue application's DOM must be gone, not merely hidden — a remote left
    // mounted keeps polling and keeps listening to platform events.
    await expect(vueAccountCard).toHaveCount(0);
  });
});

test.describe('routing owned by the shell, sub-routes owned by the remote', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, USERS.customer);
  });

  test('a deep link into the Vue remote survives a browser refresh', async ({ page }) => {
    await page.getByRole('link', { name: 'Accounts' }).click();
    await page.locator('button').filter({ hasText: 'Everyday Checking' }).first().click();

    await expect(page).toHaveURL(/\/banking\/accounts\/.+/);
    await expect(page.getByText('Transaction history')).toBeVisible();

    const deepLink = page.url();
    await page.reload();

    // Everything has to be rebuilt from the URL and the refresh cookie alone:
    // the session, the remote, and the remote's internal view.
    await expect(page).toHaveURL(deepLink);
    await expect(page.getByText('Transaction history')).toBeVisible();
  });

  test('the Angular Router drives its own sub-route through the shell', async ({ page }) => {
    await page.getByRole('link', { name: 'Transfer' }).click();
    await page.getByRole('link', { name: 'History' }).click();

    await expect(page).toHaveURL(/\/banking\/transfer\/history$/);
    await expect(page.getByText('Transfer history')).toBeVisible();

    // The back button must work across a boundary the shell owns and Angular
    // merely reads — the failure mode when two routers both write history.
    await page.goBack();
    await expect(page).toHaveURL(/\/banking\/transfer$/);
  });

  test('a URL no remote owns renders the platform 404', async ({ page }) => {
    await page.goto('/banking/nonexistent');
    await expect(page.getByText('Page not found')).toBeVisible();
    // The shell survives: navigation is still there and still works.
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByText('Across all accounts')).toBeVisible();
  });
});
