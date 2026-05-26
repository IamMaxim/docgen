import test from 'node:test';
import assert from 'node:assert/strict';

import { renderMarkdownBlock } from './markdown-render.server';

test('renderMarkdownBlock emits plain HTML for fenced Mermaid blocks', async () => {
	const html = await renderMarkdownBlock('```mermaid\nflowchart TD\n  A --> B\n```');

	assert.match(html, /<pre class="language-mermaid">/);
	assert.match(html, /<code class="language-mermaid">/);
	assert.doesNotMatch(html, /\{@html/);
});

test('renderMarkdownBlock preserves table HTML', async () => {
	const html = await renderMarkdownBlock('| A | B |\n| - | - |\n| 1 | 2 |');

	assert.match(html, /<table>/);
	assert.match(html, /<th>A<\/th>/);
	assert.match(html, /<td>1<\/td>/);
});
