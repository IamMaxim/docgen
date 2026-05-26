import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// The full public surface in `./index.ts` re-exports Svelte components which
// tsx cannot load in node:test (no .svelte loader). Verify the sentinel by
// reading source — the dist build is exercised separately in Task 24.
describe('package', () => {
  it('source exports PACKAGE_NAME = "docgen"', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, 'index.ts'), 'utf8');
    assert.match(src, /export const PACKAGE_NAME = 'docgen';/);
  });
});
