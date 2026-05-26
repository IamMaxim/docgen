import test from 'node:test';
import assert from 'node:assert/strict';

import { buildBlockDiff, splitMarkdownBlocks } from './block-diff';

test('splitMarkdownBlocks preserves fenced code and table blocks', () => {
	assert.deepEqual(
		splitMarkdownBlocks('# Title\n\nPara one.\n\n```rust\nfn main() {}\n```\n\n| A | B |\n| - | - |\n| 1 | 2 |\n'),
		['# Title', 'Para one.', '```rust\nfn main() {}\n```', '| A | B |\n| - | - |\n| 1 | 2 |']
	);
});

test('buildBlockDiff returns full file stream with added and removed paragraph blocks', () => {
	const blocks = buildBlockDiff(
		'# Title\n\nSame paragraph.\n\nOld paragraph.\n\nTail paragraph.\n',
		'# Title\n\nSame paragraph.\n\nNew paragraph.\n\nTail paragraph.\n'
	);

	assert.deepEqual(
		blocks.map((block) => ({ kind: block.kind, raw: block.raw })),
		[
			{ kind: 'context', raw: '# Title' },
			{ kind: 'context', raw: 'Same paragraph.' },
			{ kind: 'removed', raw: 'Old paragraph.' },
			{ kind: 'added', raw: 'New paragraph.' },
			{ kind: 'context', raw: 'Tail paragraph.' }
		]
	);
});

test('buildBlockDiff strips frontmatter and script blocks from rendered review content', () => {
	const blocks = buildBlockDiff(
		'---\ntitle: Old\n---\n\n<script>const hidden = true;</script>\n\nVisible old.',
		'---\ntitle: New\n---\n\n<script>const hidden = false;</script>\n\nVisible new.'
	);

	assert.deepEqual(
		blocks.map((block) => ({ kind: block.kind, raw: block.raw })),
		[
			{ kind: 'removed', raw: 'Visible old.' },
			{ kind: 'added', raw: 'Visible new.' }
		]
	);
});
