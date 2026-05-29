// @ts-nocheck
import { visit } from 'unist-util-visit';

// A URL we should leave untouched: absolute (`/foo`), protocol-qualified
// (`https:`, `data:`, `mailto:`), protocol-relative (`//cdn`), or in-page (`#x`).
const isExternalOrAbsolute = (url) =>
	typeof url !== 'string' ||
	url.length === 0 ||
	/^[a-z][a-z0-9+.-]*:/i.test(url) ||
	url.startsWith('//') ||
	url.startsWith('/') ||
	url.startsWith('#');

// Vite treats a bare specifier (`assets/x.png`) as a package import, so make
// sure relative specifiers are explicitly relative.
const toSpecifier = (url) => (url.startsWith('.') ? url : `./${url}`);

const escapeAttr = (value) =>
	String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');

/**
 * Rewrite relative image paths in docs so Vite bundles them as assets — which
 * makes them resolve in both `npm run dev` and the static build (with content
 * hashing), instead of becoming dead `<img src="./x.png">` links resolved
 * against the page URL.
 *
 * Each `![alt](./x.png)` with a relative URL becomes
 * `<img src={__docimg_N} alt="…" />` plus an injected
 * `import __docimg_N from './x.png';`. The import is appended to the doc's
 * existing instance `<script>` if present, otherwise a new one is added; mdsvex
 * hoists it into the compiled component, and Vite resolves the path relative to
 * the source `.md`/`.svx` file.
 */
export default function remarkDocImages() {
	return (tree) => {
		/** @type {{ id: string; specifier: string }[]} */
		const imports = [];
		let counter = 0;

		visit(tree, 'image', (node, index, parent) => {
			if (!parent || index === null || index === undefined) return;
			if (isExternalOrAbsolute(node.url)) return;

			const id = `__docimg_${counter++}`;
			imports.push({ id, specifier: toSpecifier(node.url) });

			const attrs = [`src={${id}}`, `alt="${escapeAttr(node.alt ?? '')}"`];
			if (node.title) attrs.push(`title="${escapeAttr(node.title)}"`);

			parent.children[index] = { type: 'html', value: `<img ${attrs.join(' ')} />` };
		});

		if (!imports.length) return;

		const importLines = imports
			.map(({ id, specifier }) => `\timport ${id} from ${JSON.stringify(specifier)};`)
			.join('\n');

		// Reuse an existing instance <script> (not `context="module"`) so we don't
		// create a second instance script, which Svelte rejects.
		const existing = tree.children.find(
			(child) =>
				child.type === 'html' &&
				typeof child.value === 'string' &&
				/<script(?![^>]*context\s*=)[^>]*>/.test(child.value)
		);

		if (existing) {
			existing.value = existing.value.replace(
				/<script(?![^>]*context\s*=)([^>]*)>/,
				(match) => `${match}\n${importLines}`
			);
		} else {
			tree.children.unshift({ type: 'html', value: `<script>\n${importLines}\n</script>` });
		}
	};
}
