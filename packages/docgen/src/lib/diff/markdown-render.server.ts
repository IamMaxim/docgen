import { compile } from 'mdsvex';
import Katex from 'katex';
import rehypeSlug from 'rehype-slug';
import remarkMath from 'remark-math';
import { visit } from 'unist-util-visit';
import 'katex/contrib/mhchem';

import rehypeDocCallouts from '../remark/rehypeDocCallouts.js';
import rehypeDocsBase from '../remark/rehypeDocsBase.js';

const compileOptions = {
	extensions: ['.md', '.svx'],
	remarkPlugins: [remarkMath],
	rehypePlugins: [rehypeKatexForDiff, rehypeSlug, rehypeDocsBase, rehypeDocCallouts],
	smartypants: {
		dashes: 'oldschool',
		quotes: false
	}
} as unknown as Parameters<typeof compile>[1];

export async function renderMarkdownBlock(markdown: string): Promise<string> {
	const transformed = transformDocComponents(transformWikiLinks(markdown));
	const result = await compile(transformed, compileOptions);
	return normalizeCompiledHtml(result?.code?.trim() ?? '');
}

function normalizeCompiledHtml(html: string): string {
	return html.replace(/\{@html\s+`([\s\S]*?)`\}/g, (_match, rawHtml) =>
		String(rawHtml).replace(/\\`/g, '`').replace(/\\\$/g, '$')
	);
}

function rehypeKatexForDiff() {
	return (tree: unknown) => {
		visit(tree, 'element', (node: any) => {
			const className = node.properties?.className ?? [];
			if (!Array.isArray(className)) return;
			const displayMode = className.includes('math-display');
			if (!displayMode && !className.includes('math-inline')) return;

			const rendered = Katex.renderToString(textContent(node), { displayMode });
			node.children = [
				{
					type: 'text',
					value: `{@html \`${escapeTemplateLiteral(rendered)}\`}`
				}
			];
		});
	};
}

function textContent(node: any): string {
	if (!node) return '';
	if (node.type === 'text') return String(node.value ?? '');
	if (!Array.isArray(node.children)) return '';
	return node.children.map(textContent).join('');
}

function escapeTemplateLiteral(value: string): string {
	return value.replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function transformWikiLinks(markdown: string): string {
	return markdown.replace(/\[\[([^|\]]+?)(?:\|([^\]]+?))?\]\]/g, (_match, rawTarget, rawLabel) => {
		const target = String(rawTarget).trim();
		const label = String(rawLabel ?? rawTarget).trim();
		const href = wikiHref(target);
		return `[${label}](${href})`;
	});
}

function wikiHref(target: string): string {
	const [path, hash] = target.split('#');
	const normalized = path
		.trim()
		.replace(/^\/+/, '')
		.replace(/^docs\/?/i, '')
		.replace(/\.(md|svx)$/i, '');
	const href = normalized ? `/docs/${normalized}`.replace(/\/+/g, '/') : '/docs';
	return hash ? `${href}#${hash}` : href;
}

function transformDocComponents(markdown: string): string {
	return markdown
		.replace(/<RustRef\s+([^>]*?)\/>/g, (_match, attrs) => rustRefHtml(String(attrs)))
		.replace(/<Badge\s+([^>]*?)\/>/g, (_match, attrs) => badgeHtml(String(attrs)))
		.replace(/<SrcEmbed\s+([^>]*?)\/>/g, (_match, attrs) => srcEmbedHtml(String(attrs)));
}

function rustRefHtml(attrs: string): string {
	const ref = attrValue(attrs, 'ref') ?? 'unknown';
	const href = attrValue(attrs, 'href') ?? rustdocHref(attrs) ?? `/docs/dev/rust-linking#${slugify(ref)}`;
	const parts = escapeHtml(ref).split('::').join('::<wbr>');
	return `<a class="rust-ref rust-ref-link" href="${escapeHtml(href)}" title="Rust path (links to API documentation)"><span class="rust-ref__path">${parts}</span></a>`;
}

function badgeHtml(attrs: string): string {
	const label = attrValue(attrs, 'label') ?? '';
	const tone = attrValue(attrs, 'tone') ?? 'accent';
	return `<span class="badge badge--${escapeHtml(tone)}">${escapeHtml(label)}</span>`;
}

function srcEmbedHtml(attrs: string): string {
	const path = attrValue(attrs, 'path') ?? 'source';
	const href = attrValue(attrs, 'href');
	const label = escapeHtml(path);
	const body = href ? `<a href="${escapeHtml(href)}">${label}</a>` : `<span>${label}</span>`;
	return `<div class="src-embed"><div class="src-embed-header">${body}</div></div>`;
}

function attrValue(attrs: string, name: string): string | null {
	const quoted = attrs.match(new RegExp(`${name}=(?:"([^"]+)"|'([^']+)')`));
	return quoted?.[1] ?? quoted?.[2] ?? null;
}

function rustdocHref(attrs: string): string | null {
	const match = attrs.match(/href=\{rustdoc\((?:"([^"]+)"|'([^']+)')\)\}/);
	const path = match?.[1] ?? match?.[2];
	return path ? `/rustdoc/${path}` : null;
}

function slugify(value: string): string {
	return (
		value
			.replace(/::/g, '-')
			.replace(/[^a-zA-Z0-9_-]+/g, '-')
			.toLowerCase()
			.replace(/^-+|-+$/g, '') || 'ref'
	);
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
