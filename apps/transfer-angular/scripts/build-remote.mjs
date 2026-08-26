import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Builds the federated container, and retries once if it comes out hollow.
 *
 * There is an intermittent race in the Vite Module Federation plugin's
 * interaction with Angular's compiler: perhaps one run in four, the whole
 * application graph is dropped and the exposed module emits as an empty chunk —
 * while the build still exits 0. It is upstream of this repository and cannot be
 * fixed from here.
 *
 * `verify-remote-entry.mjs` detects it reliably, which makes a bounded retry
 * safe: a hollow build is a *known, verified* condition, not an unexplained
 * failure being papered over. The retry is announced, and a second hollow build
 * fails for real rather than being retried forever.
 */
const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_ATTEMPTS = 2;

function run(command, args) {
  return spawnSync(command, args, { cwd: appDir, stdio: 'inherit', shell: process.platform === 'win32' });
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  // A partial `dist` from a failed attempt would let the verifier pass on
  // leftovers from the previous one.
  rmSync(resolve(appDir, 'dist'), { recursive: true, force: true });

  const build = run('vite', ['build']);
  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }

  const verify = run('node', ['scripts/verify-remote-entry.mjs']);
  if (verify.status === 0) {
    process.exit(0);
  }

  if (attempt < MAX_ATTEMPTS) {
    console.warn(`\n⟳ Hollow federated build detected — retrying (${attempt}/${MAX_ATTEMPTS - 1}).\n`);
  }
}

console.error('\n✗ The federated build was hollow twice. This is not the known transient race.\n');
process.exit(1);
