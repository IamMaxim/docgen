// @ts-nocheck
import { visit } from 'unist-util-visit';

function appBaseFromEnv() {
	const rawBase = process.env.BASE_PATH ?? '';
	if (rawBase === '' || rawBase === '/') return '';
	return rawBase.startsWith('/') ? rawBase : `/${rawBase}`;
}

/** Prefix `href` values that start with `/docs` for `kit.paths.base`. */
export default function rehypeDocsBase() {
	const appBase = appBaseFromEnv();
	return (tree) => {
		visit(tree, 'element', (node) => {
			if (node.tagName !== 'a') return;
			const href = node.properties?.href;
			if (typeof href !== 'string' || !href.startsWith('/docs')) return;
			if (appBase && href.startsWith(appBase)) return;
			node.properties.href = `${appBase}${href}`;
		});
	};
}
