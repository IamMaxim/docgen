import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
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
	preprocess: [vitePreprocess(), mdsvex(mdsvexConfig)],
	extensions: ['.svelte', ...mdsvexConfig.extensions],
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			strict: false
		}),
		paths: { base }
	}
};

export default config;
