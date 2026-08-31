/**
 * Root config — the fallback for staged files that live outside an application.
 *
 * Each app under `apps/` carries its own `.lintstagedrc.mjs`, and lint-staged
 * matches every staged file to the *closest* config rather than merging them,
 * so nothing staged inside an app ever reaches this file. This one still has to
 * exist: without a config at the root, a commit that touches only root-level
 * files exits with "No valid configuration found" and fails for no reason.
 *
 * @type {import('lint-staged').Configuration}
 */
const config = {
  /**
   * A malformed manifest, lockfile-adjacent config or tsconfig breaks
   * `pnpm install` and every build after it, long before a linter would see the
   * file. Parsing is per-file and takes milliseconds, which is the whole point
   * of running it here rather than in CI.
   *
   * The script picks the parser per file: strict JSON for manifests, JSONC for
   * `tsconfig*.json`, which is allowed comments and trailing commas.
   */
  '*.json': 'node scripts/validate-json.mjs',
};

export default config;
