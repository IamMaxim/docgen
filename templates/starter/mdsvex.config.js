import { fileURLToPath } from 'node:url';
import { buildMdsvexConfig } from '@iammaxim/docgen/mdsvex';
import siteConfig from './docs-site.config.json' with { type: 'json' };

const docLayout = fileURLToPath(
	new URL('./node_modules/@iammaxim/docgen/dist/components/DocShell.svelte', import.meta.url)
);

export default buildMdsvexConfig({
	layout: docLayout,
	docsDir: fileURLToPath(new URL(`./${siteConfig.docsDir}`, import.meta.url)),
	ignore: siteConfig.ignore ?? [],
	baseUrl: siteConfig.baseUrl ?? '/docs',
	linkGraphOutput: fileURLToPath(new URL('./src/lib/link-graph.json', import.meta.url))
});
