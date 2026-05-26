import test from 'node:test';
import assert from 'node:assert/strict';

import { collectStats, flattenTree, groupBlockRuns } from './tree';
import type { DocDiffBlock, DocDiffFileTreeNode } from './types';

const fileNode = (
	path: string,
	addedLines = 1,
	removedLines = 1
): DocDiffFileTreeNode => ({
	id: path,
	label: path.split('/').pop() ?? path,
	type: 'file',
	path,
	status: 'modified',
	addedLines,
	removedLines
});

const groupNode = (id: string, children: DocDiffFileTreeNode[]): DocDiffFileTreeNode => ({
	id,
	label: id.split('/').pop() ?? id,
	type: 'group',
	children
});

test('collectStats sums files/added/removed recursively', () => {
	const tree = groupNode('a', [
		fileNode('a/x.md', 2, 1),
		groupNode('a/b', [fileNode('a/b/y.md', 4, 3), fileNode('a/b/z.md', 1, 0)])
	]);
	assert.deepEqual(collectStats(tree), { files: 3, added: 7, removed: 4 });
});

test('flattenTree emits file rows when no groups', () => {
	const rows = flattenTree([fileNode('x.md'), fileNode('y.md')], 0, new Set());
	assert.equal(rows.length, 2);
	assert.equal(rows[0].rowType, 'file');
	assert.equal(rows[0].depth, 0);
});

test('flattenTree expands groups when not collapsed and aggregates stats', () => {
	const rows = flattenTree(
		[groupNode('a', [fileNode('a/x.md', 3, 2), fileNode('a/y.md', 1, 1)])],
		0,
		new Set()
	);
	assert.equal(rows.length, 3);
	const group = rows[0];
	assert.equal(group.rowType, 'group');
	if (group.rowType !== 'group') return;
	assert.equal(group.fileCount, 2);
	assert.equal(group.addedLines, 4);
	assert.equal(group.removedLines, 3);
	assert.equal(group.collapsed, false);
	assert.equal(rows[1].depth, 1);
});

test('flattenTree hides children of collapsed group', () => {
	const collapsed = new Set(['a']);
	const rows = flattenTree(
		[groupNode('a', [fileNode('a/x.md'), fileNode('a/y.md')])],
		0,
		collapsed
	);
	assert.equal(rows.length, 1);
	if (rows[0].rowType !== 'group') return assert.fail('expected group row');
	assert.equal(rows[0].collapsed, true);
});

const block = (id: string, kind: DocDiffBlock['kind']): DocDiffBlock => ({
	id,
	kind,
	raw: '',
	html: '',
	oldIndex: null,
	newIndex: null
});

test('groupBlockRuns merges consecutive same-kind blocks', () => {
	const runs = groupBlockRuns([
		block('1', 'context'),
		block('2', 'added'),
		block('3', 'added'),
		block('4', 'context'),
		block('5', 'removed')
	]);
	assert.equal(runs.length, 4);
	assert.equal(runs[0].kind, 'context');
	assert.equal(runs[1].kind, 'added');
	assert.equal(runs[1].blocks.length, 2);
	assert.equal(runs[2].kind, 'context');
	assert.equal(runs[3].kind, 'removed');
});

test('groupBlockRuns returns empty for empty input', () => {
	assert.deepEqual(groupBlockRuns([]), []);
});
