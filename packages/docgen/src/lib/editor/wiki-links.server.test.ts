import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import createWikiLinks from '../remark/wikiLinks.js';

type Tree = { type: string; children: any[] };

test('createWikiLinks: resolves a wikilink target', () => {
  const dir = mkdtempSync(join(tmpdir(), 'wikilinks-'));
  const docsDir = join(dir, 'docs');
  mkdirSync(docsDir, { recursive: true });
  writeFileSync(join(docsDir, 'index.md'), '# Home\n');
  writeFileSync(join(docsDir, 'target.md'), '# Target\n');

  const transformer = createWikiLinks({ docsDir, ignore: [] });
  const tree: Tree = {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          { type: 'linkReference', label: 'target', identifier: 'target', children: [] }
        ]
      }
    ]
  };
  transformer(tree, { path: join(docsDir, 'index.md') });
  const link = tree.children[0].children[0];
  assert.equal(link.type, 'link');
  assert.equal(link.url, '/docs/target');
});

test('createWikiLinks: persists link-graph.json when linkGraphOutput set', () => {
  const dir = mkdtempSync(join(tmpdir(), 'wikilinks-lg-'));
  const docsDir = join(dir, 'docs');
  mkdirSync(docsDir, { recursive: true });
  writeFileSync(join(docsDir, 'index.md'), '# Home\n');
  writeFileSync(join(docsDir, 'b.md'), '# B\n');
  const outPath = join(dir, 'link-graph.json');

  const transformer = createWikiLinks({ docsDir, ignore: [], linkGraphOutput: outPath });
  const tree: Tree = {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'linkReference', label: 'b', identifier: 'b', children: [] }]
      }
    ]
  };
  transformer(tree, { path: join(docsDir, 'index.md') });
  assert.equal(existsSync(outPath), true);
  const parsed = JSON.parse(readFileSync(outPath, 'utf8'));
  assert.deepEqual(parsed['/docs'].outgoing, ['/docs/b']);
});

test('createWikiLinks: does not persist link-graph when source path unknown', () => {
  const dir = mkdtempSync(join(tmpdir(), 'wikilinks-guard-'));
  const docsDir = join(dir, 'docs');
  mkdirSync(docsDir, { recursive: true });
  writeFileSync(join(docsDir, 'target.md'), '# T\n');
  const outPath = join(dir, 'link-graph.json');

  const transformer = createWikiLinks({ docsDir, ignore: [], linkGraphOutput: outPath });
  const tree: Tree = {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'linkReference', label: 'target', identifier: 'target', children: [] }]
      }
    ]
  };
  // file has no /docs/ marker => currentDocPath is null => no persistence
  transformer(tree, { path: '/elsewhere/random.md' });
  assert.equal(existsSync(outPath), false);
});
