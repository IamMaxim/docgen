import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { defaultDocGlob } from './registry.ts';

describe('defaultDocGlob', () => {
  it('returns positive globs plus ignore negations', () => {
    const globs = defaultDocGlob({
      docsRelativeFromCallSite: '../../../docs',
      ignore: ['drafts', 'private']
    });
    assert.ok(globs.includes('../../../docs/**/*.md'));
    assert.ok(globs.includes('../../../docs/**/*.svx'));
    assert.ok(globs.includes('!../../../docs/drafts/**'));
    assert.ok(globs.includes('!../../../docs/private/**'));
  });
});
