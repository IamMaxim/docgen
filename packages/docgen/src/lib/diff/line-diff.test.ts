import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLineHunks } from './line-diff';

test('identical content returns no hunks', () => {
	assert.deepEqual(buildLineHunks('alpha\nbeta\ngamma', 'alpha\nbeta\ngamma'), []);
});

test('replacement marks context, removed, added, context with line numbers', () => {
	assert.deepEqual(buildLineHunks('alpha\nbeta\ngamma', 'alpha\ndelta\ngamma'), [
		{
			oldStart: 1,
			oldLines: 3,
			newStart: 1,
			newLines: 3,
			lines: [
				{ kind: 'context', oldLine: 1, newLine: 1, text: 'alpha' },
				{ kind: 'removed', oldLine: 2, newLine: null, text: 'beta' },
				{ kind: 'added', oldLine: null, newLine: 2, text: 'delta' },
				{ kind: 'context', oldLine: 3, newLine: 3, text: 'gamma' }
			]
		}
	]);
});

test('distant edits split into separate hunks when contextLines is one', () => {
	assert.deepEqual(buildLineHunks('a\nb\nc\nd\ne\nf\ng', 'a\nB\nc\nd\ne\nF\ng', 1), [
		{
			oldStart: 1,
			oldLines: 3,
			newStart: 1,
			newLines: 3,
			lines: [
				{ kind: 'context', oldLine: 1, newLine: 1, text: 'a' },
				{ kind: 'removed', oldLine: 2, newLine: null, text: 'b' },
				{ kind: 'added', oldLine: null, newLine: 2, text: 'B' },
				{ kind: 'context', oldLine: 3, newLine: 3, text: 'c' }
			]
		},
		{
			oldStart: 5,
			oldLines: 3,
			newStart: 5,
			newLines: 3,
			lines: [
				{ kind: 'context', oldLine: 5, newLine: 5, text: 'e' },
				{ kind: 'removed', oldLine: 6, newLine: null, text: 'f' },
				{ kind: 'added', oldLine: null, newLine: 6, text: 'F' },
				{ kind: 'context', oldLine: 7, newLine: 7, text: 'g' }
			]
		}
	]);
});
