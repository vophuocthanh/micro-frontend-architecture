/**
 * Conventional Commits, enforced on the commit message rather than on review.
 *
 * The scope is the package you touched. That is not decoration: in a monorepo
 * where six applications deploy independently, `git log --grep '(dashboard)'`
 * is how you answer "what shipped to this remote", and a release note generated
 * from unscoped commits tells you nothing about which application changed.
 *
 * @type {import('@commitlint/types').UserConfig}
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // One per workspace package, plus the cross-cutting concerns that do not
    // map to a directory. Keep this in step with CONTRIBUTING.md §6 and with
    // `pnpm-workspace.yaml` — a new package needs a scope here or every commit
    // touching it is rejected.
    'scope-enum': [
      2,
      'always',
      [
        // Applications
        'shell',
        'dashboard',
        'account',
        'transfer',
        'api',
        // Shared packages
        'contracts',
        'config',
        // Test suites
        'e2e',
        // Cross-cutting
        'adr',
        'docs',
        'deps',
        'ci',
        'repo',
        'release',
      ],
    ],

    // A warning, not an error. Most commits belong to one package and should say
    // so, but a change that genuinely spans the platform — a lockfile bump, a
    // repo-wide rename — reads worse with a scope invented to satisfy a linter.
    'scope-empty': [1, 'never'],

    // config-conventional makes these errors at 100 characters. A stack trace or
    // a URL pasted into the body is a legitimate reason to go over, and losing
    // the commit message to a hard failure over it helps nobody.
    'body-max-line-length': [1, 'always', 100],
    'footer-max-line-length': [1, 'always', 100],
  },
};
