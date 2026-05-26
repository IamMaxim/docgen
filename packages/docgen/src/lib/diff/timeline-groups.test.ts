import test from 'node:test';
import assert from 'node:assert/strict';

import { bucketLabel, formatDate, groupTimeline, ymd } from './timeline-groups';
import type { DocDiffTimelinePoint } from './types';

const point = (overrides: Partial<DocDiffTimelinePoint> = {}): DocDiffTimelinePoint => ({
	id: 'p',
	kind: 'commit',
	hash: 'abc',
	shortHash: 'abc',
	subject: 's',
	author: null,
	date: null,
	baseRef: '',
	headRef: '',
	files: [],
	fileTree: [],
	totalAddedLines: 0,
	totalRemovedLines: 0,
	warnings: [],
	...overrides
});

test('ymd formats year-month-day with zero padding', () => {
	assert.equal(ymd(new Date(2026, 0, 5)), '2026-01-05');
	assert.equal(ymd(new Date(2026, 11, 31)), '2026-12-31');
});

test('formatDate returns empty string for null/invalid', () => {
	assert.equal(formatDate(null), '');
	assert.equal(formatDate('not-a-date'), '');
});

test('formatDate parses ISO strings', () => {
	const result = formatDate('2026-03-15T12:00:00Z');
	assert.match(result, /^2026-03-(14|15)$/); // timezone-dependent but YYYY-MM-DD format
});

test('bucketLabel returns Working tree for worktree kind', () => {
	const now = new Date(2026, 4, 15);
	assert.equal(bucketLabel(point({ kind: 'worktree' }), now), 'Working tree');
});

test('bucketLabel Today / Yesterday / Earlier', () => {
	const now = new Date(2026, 4, 15, 12, 0, 0);
	const today = new Date(2026, 4, 15, 8, 0, 0).toISOString();
	const yesterday = new Date(2026, 4, 14, 8, 0, 0).toISOString();
	const earlier = new Date(2026, 4, 1, 8, 0, 0).toISOString();
	assert.equal(bucketLabel(point({ date: today }), now), 'Today');
	assert.equal(bucketLabel(point({ date: yesterday }), now), 'Yesterday');
	assert.equal(bucketLabel(point({ date: earlier }), now), 'Earlier');
});

test('groupTimeline preserves order and groups by bucket label', () => {
	const now = new Date(2026, 4, 15, 12, 0, 0);
	const today = new Date(2026, 4, 15, 8, 0, 0).toISOString();
	const earlier = new Date(2026, 4, 1, 8, 0, 0).toISOString();
	const buckets = groupTimeline(
		[
			point({ id: 'wt', kind: 'worktree' }),
			point({ id: 'a', date: today }),
			point({ id: 'b', date: today }),
			point({ id: 'c', date: earlier })
		],
		now
	);
	assert.deepEqual(
		buckets.map((b) => [b.label, b.points.map((p) => p.id)]),
		[
			['Working tree', ['wt']],
			['Today', ['a', 'b']],
			['Earlier', ['c']]
		]
	);
});
