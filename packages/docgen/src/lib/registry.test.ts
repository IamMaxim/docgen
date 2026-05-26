import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRegistry } from './registry.ts';

const baseConfig = {
  siteTitle: 'T',
  docsDir: '../docs',
  baseUrl: '/docs',
  ignore: ['drafts'],
  sectionLabels: { dev: 'Developers', 'game-design': 'Game design' },
  features: { diff: false, editor: false, search: true, graph: true }
};

const stubComponent = (() => null) as never;

// Mimics Vite's import.meta.glob({ eager: true }) output.
const modules = {
  '../../../docs/index.md': { default: stubComponent, metadata: { title: 'Home', order: 1 } },
  '../../../docs/dev/index.md': { default: stubComponent, metadata: { title: 'Dev', order: 2 } },
  '../../../docs/dev/server.md': { default: stubComponent, metadata: { title: 'Server', order: 3 } },
  '../../../docs/drafts/secret.md': { default: stubComponent, metadata: { title: 'Secret', order: 4 } }
};
const raw = {
  '../../../docs/index.md': '# Home\nSee [[dev/server]].',
  '../../../docs/dev/index.md': '# Dev',
  '../../../docs/dev/server.md': '# Server',
  '../../../docs/drafts/secret.md': '# Secret'
};

describe('createRegistry', () => {
  it('excludes ignored paths', () => {
    const reg = createRegistry({ modules, raw, config: baseConfig });
    assert.equal(reg.listDocs().length, 3);
    assert.ok(!reg.listDocs().some((d) => d.id.includes('drafts')));
  });

  it('finds doc by slug', () => {
    const reg = createRegistry({ modules, raw, config: baseConfig });
    const doc = reg.findDocMeta(['dev', 'server']);
    assert.ok(doc);
    assert.equal(doc!.title, 'Server');
  });

  it('returns default doc for empty slug', () => {
    const reg = createRegistry({ modules, raw, config: baseConfig });
    assert.equal(reg.getDefaultDoc()?.id, 'index');
  });

  it('builds tree with sectionLabels', () => {
    const reg = createRegistry({ modules, raw, config: baseConfig });
    const tree = reg.buildDocTree();
    const devNode = tree.find((n) => n.id === 'dev');
    assert.ok(devNode);
    assert.equal(devNode!.label, 'Dev'); // label from index doc title
  });

  it('extracts backlinks from wikilinks', () => {
    const reg = createRegistry({ modules, raw, config: baseConfig });
    const bl = reg.getBacklinksForPath('/docs/dev/server');
    assert.equal(bl.length, 1);
    assert.equal(bl[0].id, 'index');
  });

  it('search docs include text and headings', () => {
    const reg = createRegistry({ modules, raw, config: baseConfig });
    const search = reg.listSearchDocuments();
    assert.ok(search.find((d) => d.title === 'Home'));
  });

  it('builds doc graph nodes and edges from wikilinks', () => {
    const reg = createRegistry({ modules, raw, config: baseConfig });
    const graph = reg.listDocGraph();
    assert.equal(graph.nodes.length, 3);
    assert.ok(
      graph.edges.find((e) => e.source === 'index' && e.target === 'dev/server'),
      'expected edge index → dev/server'
    );
  });

  it('listPrerenderDocSlugs omits root', () => {
    const reg = createRegistry({ modules, raw, config: baseConfig });
    const slugs = reg.listPrerenderDocSlugs();
    assert.ok(!slugs.find((s) => s.slug === ''));
    assert.ok(slugs.find((s) => s.slug === 'dev/server'));
  });
});
