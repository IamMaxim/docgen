import test from 'node:test';
import assert from 'node:assert/strict';

import { buildFileTree } from './file-tree';
import type { DocDiffFile } from './types';

const file = (path: string, status: DocDiffFile['status'] = 'modified'): DocDiffFile => ({
	path,
	status,
	addedLines: 1,
	removedLines: 2,
	hunks: []
});

test('buildFileTree groups changed files by docs path segments', () => {
	assert.deepEqual(buildFileTree([file('docs/dev/client.svx'), file('docs/game-design/world.md')]), [
		{
			id: 'docs/dev',
			label: 'dev',
			type: 'group',
			children: [
				{
					id: 'docs/dev/client.svx',
					label: 'client.svx',
					type: 'file',
					path: 'docs/dev/client.svx',
					status: 'modified',
					addedLines: 1,
					removedLines: 2
				}
			]
		},
		{
			id: 'docs/game-design',
			label: 'game-design',
			type: 'group',
			children: [
				{
					id: 'docs/game-design/world.md',
					label: 'world.md',
					type: 'file',
					path: 'docs/game-design/world.md',
					status: 'modified',
					addedLines: 1,
					removedLines: 2
				}
			]
		}
	]);
});
