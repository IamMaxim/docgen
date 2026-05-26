import remarkMath from 'remark-math';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeKatexSvelte from 'rehype-katex-svelte';
import rehypeSlug from 'rehype-slug';
import rehypeDocCalloutsImpl from '../remark/rehypeDocCallouts.js';
import rehypeDocsBaseImpl from '../remark/rehypeDocsBase.js';
import createWikiLinks from '../remark/wikiLinks.js';
import escapeWikilinkPipesFactory from '../remark/escapeWikilinkPipes.js';
import 'katex/contrib/mhchem';

export const escapeWikilinkPipes = escapeWikilinkPipesFactory;
export { createWikiLinks };
export const rehypeDocCallouts = rehypeDocCalloutsImpl;
export const rehypeDocsBase = rehypeDocsBaseImpl;

export type BuildMdsvexOptions = {
	/** Absolute path to a Svelte file used as mdsvex layout (wraps every doc). */
	layout: string;
	/** Docs source root — passed to wikiLinks for path resolution. */
	docsDir: string;
	/** First-level dirs to ignore — passed to wikiLinks. */
	ignore: string[];
	/** URL prefix for resolved wiki links. Default '/docs'. */
	baseUrl?: string;
	/** If set, wikiLinks persists link-graph.json here on each transform (build-time only). */
	linkGraphOutput?: string;
	extraRemarkPlugins?: unknown[];
	extraRehypePlugins?: unknown[];
};

export const buildMdsvexConfig = (opts: BuildMdsvexOptions) => ({
	extensions: ['.svx', '.md'],
	remarkPlugins: [
		remarkMath,
		() =>
			createWikiLinks({
				docsDir: opts.docsDir,
				ignore: opts.ignore,
				baseUrl: opts.baseUrl ?? '/docs',
				linkGraphOutput: opts.linkGraphOutput
			}),
		...(opts.extraRemarkPlugins ?? [])
	],
	rehypePlugins: [
		rehypeKatexSvelte,
		rehypeSlug,
		[
			rehypeAutolinkHeadings,
			{ behavior: 'wrap', properties: { className: ['heading-anchor'] } }
		],
		rehypeDocsBaseImpl,
		rehypeDocCalloutsImpl,
		...(opts.extraRehypePlugins ?? [])
	],
	layout: { _: opts.layout },
	smartypants: { dashes: 'oldschool', quotes: false }
});
