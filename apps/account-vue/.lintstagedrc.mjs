/**
 * lint-staged matches every staged file to the *closest* config file and runs
 * the task from that config's directory. That is what makes this work in a
 * monorepo where each application has its own flat ESLint config and its own
 * plugins: ESLint is invoked from here, so it resolves this application's
 * ESLint config and nothing else.
 *
 * Only the staged paths are passed — the hook never walks the tree.
 *
 * Single-file components are included: the Vue parser is wired up in this
 * application's ESLint config, so a .vue file is only linted correctly here.
 *
 * @type {import('lint-staged').Configuration}
 */
const config = {
  '*.{ts,tsx,vue}': 'eslint --max-warnings=0 --no-warn-ignored',
};

export default config;
