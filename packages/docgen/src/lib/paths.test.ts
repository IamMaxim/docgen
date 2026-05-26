import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPaths } from './paths.ts';

const cfg = { baseUrl: '/docs', ignore: ['harness', 'drafts/**'] };

describe('createPaths', () => {
  const paths = createPaths(cfg);

  it('isDocPathIgnored matches exact dir', () => {
    assert.equal(paths.isDocPathIgnored('harness/foo.md'), true);
  });

  it('isDocPathIgnored matches **', () => {
    assert.equal(paths.isDocPathIgnored('drafts/x/y.md'), true);
  });

  it('isDocPathIgnored rejects unrelated', () => {
    assert.equal(paths.isDocPathIgnored('dev/x.md'), false);
  });

  it('docRelToCanonical handles index', () => {
    assert.deepEqual(paths.docRelToCanonical('index'), {
      id: 'index',
      slug: [],
      treeSlug: [],
      path: '/docs'
    });
  });

  it('docRelToCanonical handles nested folder index', () => {
    assert.deepEqual(paths.docRelToCanonical('dev/index'), {
      id: 'dev',
      slug: ['dev'],
      treeSlug: ['dev', 'index'],
      path: '/docs/dev'
    });
  });

  it('docRelToCanonical handles deep file', () => {
    const r = paths.docRelToCanonical('dev/server/auth');
    assert.deepEqual(r.slug, ['dev', 'server', 'auth']);
    assert.equal(r.path, '/docs/dev/server/auth');
  });
});
