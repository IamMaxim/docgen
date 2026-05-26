import test from 'node:test';
import assert from 'node:assert/strict';

import { summarizeTimelinePoint } from './payloads';
import type { DocDiffTimelinePoint } from './types';

const fullPoint: DocDiffTimelinePoint = {
	id: 'abc123',
	kind: 'commit',
	hash: 'abc123',
	shortHash: 'abc123',
	subject: 'docs',
	author: 'author',
	date: '2026-05-13T00:00:00.000Z',
	baseRef: 'abc122',
	headRef: 'abc123',
	files: [
		{
			path: 'docs/a.md',
			status: 'modified',
			addedLines: 1,
			removedLines: 1,
			hunks: [
				{
					oldStart: 1,
					oldLines: 1,
					newStart: 1,
					newLines: 1,
					lines: [{ kind: 'added', oldLine: null, newLine: 1, text: 'new' }]
				}
			],
			blocks: [
				{
					id: 'block',
					kind: 'added',
					raw: 'new',
					html: '<p>new</p>',
					oldIndex: null,
					newIndex: 1
				}
			]
		}
	],
	fileTree: [
		{
			id: 'docs',
			label: 'docs',
			type: 'group',
			children: [
				{
					id: 'docs/a.md',
					label: 'a.md',
					type: 'file',
					path: 'docs/a.md',
					status: 'modified',
					addedLines: 1,
					removedLines: 1
				}
			]
		}
	],
	totalAddedLines: 1,
	totalRemovedLines: 1,
	warnings: []
};

test('summarizeTimelinePoint strips heavy hunks and rendered blocks', () => {
	const summary = summarizeTimelinePoint(fullPoint);

	assert.equal(summary.files.length, 1);
	assert.deepEqual(summary.files[0].hunks, []);
	assert.equal(summary.files[0].blocks, undefined);
	assert.equal(summary.fileTree[0].type, 'group');
});
