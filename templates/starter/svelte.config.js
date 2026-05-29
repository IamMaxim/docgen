import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { escapeWikilinkPipes } from '@iammaxim/docgen/mdsvex';
import mdsvexConfig from './mdsvex.config.js';

const rawBase = process.env.BASE_PATH ?? '';
const base =
	rawBase === '' || rawBase === '/'
		? ''
		: rawBase.startsWith('/')
			? rawBase
			: `/${rawBase}`;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess(), escapeWikilinkPipes(), mdsvex(mdsvexConfig)],
	extensions: ['.svelte', ...mdsvexConfig.extensions],
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			strict: false
		}),
		paths: { base },
		prerender: {
			// A brand-new site can have an empty diff timeline, leaving
			// /diff/revisions/[id].json with no entries to prerender. Warn
			// instead of failing the build in that case.
			handleUnseenRoutes: 'warn'
		}
	}
};

export default config;
