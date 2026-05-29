import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const { docsDir } = JSON.parse(readFileSync(path.resolve(dir, 'docs-site.config.json'), 'utf8'));

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		// Allow Vite to serve attachments/images that live in the docs directory,
		// which may sit outside the app root (e.g. "../docs" in a monorepo).
		fs: { allow: [path.resolve(dir, docsDir)] }
	}
});
