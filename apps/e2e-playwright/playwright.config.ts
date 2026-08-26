import { defineConfig, devices } from '@playwright/test';

const SHELL_URL = process.env.SHELL_URL ?? 'http://localhost:3000';

/**
 * These tests deliberately do **not** start the applications.
 *
 * A micro frontend platform's integration risk lives in composition — the wrong
 * remote URL, a stale container, a mismatched contract. Booting everything from
 * inside the test runner would hide exactly those failures behind a
 * known-good local setup. The suite runs against whatever is deployed, which is
 * also what makes it usable as a post-deploy smoke test.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  // Higher than Playwright's 5s default on purpose. An assertion here can be
  // waiting on a container fetched over the network, a framework bootstrapping,
  // and an API round trip — and against a dev server, on that route's first
  // compile as well. Five seconds makes the first run of a cold suite flaky.
  expect: { timeout: 15_000 },
  use: {
    baseURL: SHELL_URL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
