import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type PluginOption } from 'vite';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEditorPaths, docPreviewDevServer } from '@iammaxim/docgen/vite';
import { validateConfig } from '@iammaxim/docgen/config';

const dir = path.dirname(fileURLToPath(import.meta.url));
const config = validateConfig(
	JSON.parse(readFileSync(path.resolve(dir, 'docs-site.config.json'), 'utf8'))
);
const ignoreSet = new Set(config.ignore);

const editorPaths = createEditorPaths({
	docsDir: config.docsDir,
	isDocPathIgnored: (rel) => ignoreSet.has(rel.split('/')[0])
});

const rawBase = process.env.BASE_PATH ?? '';
const base =
	rawBase === '' || rawBase === '/' ? '' : rawBase.startsWith('/') ? rawBase : `/${rawBase}`;

export default defineConfig({
	plugins: [
		// Dev-only middleware backing the editor's live preview. Mounted in the
		// same top-level namespace as the editor source endpoint (/editor-api/*).
		docPreviewDevServer({
			editorPaths,
			base,
			route: `${base}/editor-api/preview.json`
		}) as PluginOption,
		sveltekit()
	],
	server: {
		// Allow Vite to serve attachments/images that live in the docs directory,
		// which may sit outside the app root (e.g. "../docs" in a monorepo).
		fs: { allow: [path.resolve(dir, config.docsDir)] }
	}
});
