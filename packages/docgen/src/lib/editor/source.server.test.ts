import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import type { Registry } from '../registry.ts';
import { DocEditorSourceError, makeEditorServer } from './source.server.ts';

function stubRegistry(overrides: Partial<Registry> = {}): Registry {
  const noop = () => undefined;
  return {
    listDocs: () => [],
    findDocMeta: () => undefined,
    getDocComponent: () => null,
    getEntryByPath: () => undefined,
    getDefaultDoc: () => undefined,
    getBacklinksForPath: () => [],
    getBacklinksForSlug: () => [],
    listSearchDocuments: () => [],
    listDocGraph: () => ({ nodes: [], edges: [] }),
    buildDocTree: () => [],
    listPrerenderDocSlugs: () => [],
    paths: {
      DOC_URL_PREFIX: '/docs',
      isDocPathIgnored: () => false,
      docRelToCanonical: (relNoExt: string) => ({
        id: relNoExt || 'index',
        slug: relNoExt ? relNoExt.split('/') : [],
        treeSlug: relNoExt ? relNoExt.split('/') : [],
        path: relNoExt ? `/docs/${relNoExt}` : '/docs'
      })
    },
    config: {
      siteTitle: 'test',
      docsDir: 'docs',
      baseUrl: '/docs',
      ignore: [],
      sectionLabels: {},
      features: { diff: false, editor: true, search: false, graph: false }
    },
    ...overrides
  } as Registry;
}

function makeServer() {
  const root = mkdtempSync(join(tmpdir(), 'docgen-editor-srv-'));
  mkdirSync(join(root, 'docs'), { recursive: true });
  return makeEditorServer({
    registry: stubRegistry(),
    docsDir: join(root, 'docs'),
    repoRoot: root
  });
}

test('slug helpers normalize empty and nested route values', () => {
  const server = makeServer();
  assert.deepEqual(server.slugFromParam(undefined), []);
  assert.deepEqual(server.slugFromParam(''), []);
  assert.deepEqual(server.slugFromParam('overview/world-and-players'), [
    'overview',
    'world-and-players'
  ]);
  assert.deepEqual(server.slugFromQuery(null), []);
  assert.deepEqual(server.slugFromQuery('dev/client'), ['dev', 'client']);
  assert.equal(server.slugToQuery(['dev', 'client']), 'dev/client');
});

test('sourceErrorResponse preserves editor status codes', () => {
  const server = makeServer();
  assert.deepEqual(
    server.sourceErrorResponse(new DocEditorSourceError(409, 'Source changed on disk')),
    {
      status: 409,
      body: { error: 'Source changed on disk' }
    }
  );
});

test('sourceErrorResponse converts unknown errors to 500 responses', () => {
  const server = makeServer();
  assert.deepEqual(server.sourceErrorResponse(new Error('Unexpected')), {
    status: 500,
    body: { error: 'Unexpected' }
  });
  assert.deepEqual(server.sourceErrorResponse('plain failure'), {
    status: 500,
    body: { error: 'plain failure' }
  });
});

test('assertEditorDevMode throws DocEditorSourceError outside dev mode', () => {
  const server = makeServer();
  assert.throws(() => server.assertEditorDevMode(false), DocEditorSourceError);
  assert.doesNotThrow(() => server.assertEditorDevMode(true));
});
