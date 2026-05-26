import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import {
	createEditorPaths,
	hashSource,
	readHeadSource,
	saveSourceFile,
	validateRepoDocPath,
	type EditorPaths
} from './source-paths.server.ts';

function makePaths(opts: { isDocPathIgnored?: (rel: string) => boolean } = {}): EditorPaths {
	const root = mkdtempSync(join(tmpdir(), 'docgen-editor-'));
	const docsRoot = join(root, 'docs');
	mkdirSync(docsRoot, { recursive: true });
	return createEditorPaths({
		docsDir: docsRoot,
		repoRoot: root,
		isDocPathIgnored: opts.isDocPathIgnored ?? (() => false)
	});
}

test('validateRepoDocPath accepts markdown files under docs', () => {
	const paths = makePaths();
	const file = join(paths.docsRoot, 'overview.md');
	writeFileSync(file, '# Overview\n', 'utf8');

	const resolved = validateRepoDocPath(paths, 'docs/overview.md');

	assert.equal(resolved.repoRelativePath, 'docs/overview.md');
	assert.equal(resolved.absolutePath, resolve(file));
	assert.equal(resolved.extension, '.md');
});

test('validateRepoDocPath rejects traversal outside docs', () => {
	const paths = makePaths();
	writeFileSync(join(paths.repoRoot, 'outside.md'), '# Outside\n', 'utf8');

	assert.throws(
		() => validateRepoDocPath(paths, 'docs/../outside.md'),
		/Editor path must stay under docs/
	);
});

test('validateRepoDocPath rejects ignored docs directories', () => {
	const paths = makePaths({
		isDocPathIgnored: (rel) => rel === 'chatgpt' || rel.startsWith('chatgpt/')
	});
	const ignored = join(paths.docsRoot, 'chatgpt');
	mkdirSync(ignored, { recursive: true });
	writeFileSync(join(ignored, 'draft.md'), '# Draft\n', 'utf8');

	assert.throws(
		() => validateRepoDocPath(paths, 'docs/chatgpt/draft.md'),
		/Editor path is ignored by docs-site.config.json/
	);
});

test('validateRepoDocPath rejects unsupported extensions', () => {
	const paths = makePaths();
	writeFileSync(join(paths.docsRoot, 'data.txt'), 'plain\n', 'utf8');

	assert.throws(
		() => validateRepoDocPath(paths, 'docs/data.txt'),
		/Editor path must be a Markdown or SVX file/
	);
});

test('validateRepoDocPath rejects symlinks that escape docs', () => {
	const paths = makePaths();
	const outside = join(paths.repoRoot, 'outside.md');
	writeFileSync(outside, '# Outside\n', 'utf8');
	symlinkSync(outside, join(paths.docsRoot, 'escape.md'));

	assert.throws(
		() => validateRepoDocPath(paths, 'docs/escape.md'),
		/Editor path realpath must stay under docs/
	);
});

test('saveSourceFile rejects stale disk hashes', () => {
	const paths = makePaths();
	const file = join(paths.docsRoot, 'overview.md');
	writeFileSync(file, '# Old\n', 'utf8');
	const resolved = validateRepoDocPath(paths, 'docs/overview.md');
	const staleHash = hashSource('# Earlier\n');

	assert.throws(() => saveSourceFile(resolved, '# New\n', staleHash), /Source changed on disk/);
	assert.equal(readFileSync(file, 'utf8'), '# Old\n');
});

test('saveSourceFile writes when disk hash matches', () => {
	const paths = makePaths();
	const file = join(paths.docsRoot, 'overview.md');
	writeFileSync(file, '# Old\n', 'utf8');
	const resolved = validateRepoDocPath(paths, 'docs/overview.md');

	const result = saveSourceFile(resolved, '# New\n', hashSource('# Old\n'));

	assert.equal(readFileSync(file, 'utf8'), '# New\n');
	assert.equal(result.source, '# New\n');
	assert.equal(result.diskHash, hashSource('# New\n'));
});

test('readHeadSource returns empty string for a path absent from HEAD', () => {
	const head = readHeadSource(
		'docs/__absent_docgen_editor_test__.md',
		resolve(process.cwd(), '..')
	);

	assert.equal(head, '');
});
