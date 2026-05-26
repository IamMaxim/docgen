import test from 'node:test';
import assert from 'node:assert/strict';

import { baseRefForCommitParents, EMPTY_TREE_REF } from './git-refs';

test('baseRefForCommitParents uses empty tree for parentless commits', () => {
	assert.equal(baseRefForCommitParents('abc123', ''), EMPTY_TREE_REF);
});

test('baseRefForCommitParents uses first parent for normal and merge commits', () => {
	assert.equal(baseRefForCommitParents('abc123', 'parent1'), 'parent1');
	assert.equal(baseRefForCommitParents('abc123', 'parent1 parent2'), 'parent1');
});
