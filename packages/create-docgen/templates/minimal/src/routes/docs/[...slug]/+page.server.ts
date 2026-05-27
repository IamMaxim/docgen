import { makeDocsSlugEntries, makeDocsSlugLoad } from '@iammaxim/docgen';
import { registry } from '$lib/docgen-registry';
import type { EntryGenerator, PageServerLoad } from './$types';

export const prerender = true;
export const entries: EntryGenerator = () => {
	const slugs = makeDocsSlugEntries(registry)();
	return slugs.map((slug) => ({ slug: slug.join('/') }));
};

export const load: PageServerLoad = makeDocsSlugLoad(registry);
