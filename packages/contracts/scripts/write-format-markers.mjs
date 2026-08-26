import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The package is `"type": "module"`, so Node would read `dist/cjs/*.js` as ESM
 * and fail on the first `require`. A nested package.json in each output folder
 * pins the interpretation per format — the standard way to ship dual builds
 * without renaming every emitted file to `.cjs`/`.mjs`.
 */
const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

await Promise.all([
  writeFile(resolve(dist, 'cjs/package.json'), `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`),
  writeFile(resolve(dist, 'esm/package.json'), `${JSON.stringify({ type: 'module' }, null, 2)}\n`),
]);
