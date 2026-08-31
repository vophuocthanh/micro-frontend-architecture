/**
 * Parses every JSON file handed to it and exits non-zero on the first one that
 * does not parse. Used by the root lint-staged config as a pre-commit guard: a
 * malformed manifest or tsconfig breaks `pnpm install` and every build after
 * it, long before a linter would see the file.
 *
 * Two dialects are in play, so the parser is picked per file:
 *
 *   - `tsconfig*.json` is JSONC. Comments and trailing commas are legal there
 *     and this repo uses them, so these go through TypeScript's own config
 *     reader — the same parser `tsc` uses, which is the only definition of
 *     "valid" that matters for these files.
 *   - Everything else (`package.json`, `turbo.json`, …) is strict RFC 8259
 *     JSON, because that is all the tools reading those files accept.
 *
 * Usage: node scripts/validate-json.mjs <file>...
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

import ts from 'typescript';

/** tsconfig.json, tsconfig.app.json, tsconfig.cjs.json, … */
const isTsconfig = (file) => /^tsconfig(\..+)?\.json$/.test(basename(file));

/** @returns {string | null} the parse error, or `null` when the file is valid. */
function validate(file) {
  const text = readFileSync(file, 'utf8');

  if (!isTsconfig(file)) {
    try {
      JSON.parse(text);
      return null;
    } catch (error) {
      return error.message;
    }
  }

  const { error } = ts.parseConfigFileTextToJson(file, text);
  return error ? ts.flattenDiagnosticMessageText(error.messageText, ' ') : null;
}

let failed = false;

for (const file of process.argv.slice(2)) {
  const error = validate(file);
  if (error) {
    console.error(`✖ ${file}: ${error}`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
