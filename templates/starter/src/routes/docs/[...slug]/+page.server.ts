import { makeDocsSlugEntries, makeDocsSlugLoad } from '@iammaxim/docgen';
import { registry } from '$lib/docgen-registry';
import type { EntryGenerator, PageServerLoad } from './$types';

export const prerender = true;

// makeDocsSlugEntries already returns `{ slug: 'a/b' }[]` — the exact shape
// SvelteKit's EntryGenerator expects, so it can be used directly.
export const entries: EntryGenerator = makeDocsSlugEntries(registry);

export const load: PageServerLoad = makeDocsSlugLoad(registry);
