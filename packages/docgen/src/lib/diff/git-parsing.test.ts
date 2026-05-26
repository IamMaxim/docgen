import test from 'node:test';
import assert from 'node:assert/strict';

import { parseNameStatus, parseUntrackedDocs } from './git-parsing';

test('parseNameStatus parses added, modified, deleted, and renamed docs files', () => {
	assert.deepEqual(
		parseNameStatus(
			'A\tdocs/new.md\nM\tdocs/a.md\nD\tdocs/old.md\nR100\tdocs/from.md\tdocs/to.md\n'
		),
		[
			{ status: 'added', path: 'docs/new.md' },
			{ status: 'modified', path: 'docs/a.md' },
			{ status: 'deleted', path: 'docs/old.md' },
			{ status: 'renamed', oldPath: 'docs/from.md', path: 'docs/to.md' }
		]
	);
});

test('parseNameStatus maps one-sided docs renames to added or deleted files', () => {
	assert.deepEqual(
		parseNameStatus('R100\tdocs/from.md\toutside/from.md\nR100\toutside/to.md\tdocs/to.md\n'),
		[
			{ status: 'deleted', path: 'docs/from.md' },
			{ status: 'added', path: 'docs/to.md' }
		]
	);
});

test('parseUntrackedDocs keeps docs markdown and svx files', () => {
	assert.deepEqual(parseUntrackedDocs('docs/a.md\ndocs/b.svx\nclient/nope.md\n'), [
		'docs/a.md',
		'docs/b.svx'
	]);
});
