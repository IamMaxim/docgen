import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import remarkDocImages from './remarkDocImages.js';

type Node = {
	type: string;
	value?: string;
	url?: string;
	alt?: string;
	title?: string;
	children: Node[];
};

const run = (tree: Node) => {
	(remarkDocImages as () => (tree: Node) => void)()(tree);
	return tree;
};

const root = (...children: Node[]): Node => ({ type: 'root', children });
const para = (...children: Node[]): Node => ({ type: 'paragraph', children });
const html = (value: string): Node => ({ type: 'html', value, children: [] });
const image = (url: string, alt = '', title?: string): Node => ({
	type: 'image',
	url,
	alt,
	title,
	children: []
});

describe('remarkDocImages', () => {
	it('rewrites a relative image into an <img> bound to an injected import', () => {
		const tree = run(root(para(image('./assets/badge.svg', 'Badge'))));

		const script = tree.children[0];
		assert.equal(script.type, 'html');
		assert.match(
			script.value ?? '',
			/<script>[\s\S]*import __docimg_0 from "\.\/assets\/badge\.svg";[\s\S]*<\/script>/
		);

		const img = tree.children[1].children[0];
		assert.equal(img.type, 'html');
		assert.match(img.value ?? '', /<img src=\{__docimg_0\} alt="Badge" \/>/);
	});

	it('prefixes bare relative specifiers with ./', () => {
		const tree = run(root(para(image('assets/x.png'))));
		assert.match(tree.children[0].value ?? '', /import __docimg_0 from "\.\/assets\/x\.png";/);
	});

	it('leaves absolute and external URLs untouched (no script injected)', () => {
		for (const url of ['/static/x.png', 'https://cdn/x.png', 'data:image/png;base64,AAAA', '//cdn/x.png']) {
			const tree = run(root(para(image(url))));
			assert.equal(tree.children.length, 1, `should not inject a script for ${url}`);
			assert.equal(tree.children[0].children[0].type, 'image', `should keep image node for ${url}`);
		}
	});

	it('appends imports to an existing instance <script> instead of adding a second one', () => {
		const tree = run(root(html('<script>\n\tlet x = 1;\n</script>'), para(image('./a.png'))));
		const scripts = tree.children.filter(
			(c) => c.type === 'html' && /<script(?![^>]*context)/.test(c.value ?? '')
		);
		assert.equal(scripts.length, 1);
		assert.match(scripts[0].value ?? '', /let x = 1;/);
		assert.match(scripts[0].value ?? '', /import __docimg_0 from "\.\/a\.png";/);
	});

	it('escapes quotes in alt text', () => {
		const tree = run(root(para(image('./a.png', 'a "quoted" alt'))));
		assert.match(tree.children[1].children[0].value ?? '', /alt="a &quot;quoted&quot; alt"/);
	});
});
