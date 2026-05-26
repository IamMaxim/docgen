import { makeHomeLoad } from '@iammaxim/docgen';
import { registry } from '$lib/docgen-registry';
import type { PageServerLoad } from './$types';

export const prerender = true;
export const load: PageServerLoad = makeHomeLoad(registry);
