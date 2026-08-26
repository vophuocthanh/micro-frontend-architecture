import { readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Fails the build when the federated container is present but hollow.
 *
 * Module Federation can emit an empty chunk for an exposed module — a slow
 * compile that trips the plugin's parse timeout is enough — and the build still
 * reports success. The symptom surfaces much later and much further away: the
 * shell fetches the container, finds no `mount()` and shows `invalid-contract`.
 *
 * Ten lines here turn that into a red build in the repository that caused it.
 */
const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const assetsDir = join(distDir, 'assets');

/** Below this a chunk cannot contain a real application, only a stub. */
const MIN_EXPOSED_BYTES = 64;
const MIN_TOTAL_BYTES = 50_000;

const problems = [];

const remoteEntry = await stat(join(distDir, 'remoteEntry.js')).catch(() => null);
if (!remoteEntry) {
  problems.push('remoteEntry.js was not emitted');
}

const assets = await readdir(assetsDir).catch(() => []);

const mountChunk = assets.find((file) => /^mount-.*\.js$/.test(file));
if (!mountChunk) {
  problems.push('no chunk for the exposed "./mount" module');
} else {
  const { size } = await stat(join(assetsDir, mountChunk));
  if (size < MIN_EXPOSED_BYTES) {
    problems.push(`${mountChunk} is ${size} bytes — the exposed module compiled to nothing`);
  }
}

let totalBytes = 0;
for (const file of assets.filter((name) => name.endsWith('.js'))) {
  totalBytes += (await stat(join(assetsDir, file))).size;
}
if (totalBytes < MIN_TOTAL_BYTES) {
  problems.push(`total JS is ${totalBytes} bytes — the framework was not bundled`);
}

if (problems.length > 0) {
  console.error('\n✗ Federated build is not usable:');
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error('\nSee docs/architecture/module-federation.md\n');
  process.exit(1);
}

console.info(`✓ remote entry verified (${mountChunk}, ${Math.round(totalBytes / 1024)} kB of JS)`);
