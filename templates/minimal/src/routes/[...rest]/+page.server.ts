import { makeDocPageEntries, makeDocPageLoad } from '@iammaxim/docgen';
import { registry } from '$lib/docgen-registry';
import type { EntryGenerator, PageServerLoad } from './$types';

export const prerender = true;

// Root catch-all so docs work under any configured `baseUrl` (not just /docs).
export const entries: EntryGenerator = makeDocPageEntries(registry);
export const load: PageServerLoad = makeDocPageLoad(registry);
