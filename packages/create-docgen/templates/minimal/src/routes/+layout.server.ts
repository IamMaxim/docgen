import { makeRootLayoutLoad } from '@iammaxim/docgen/server';
import { registry } from '$lib/docgen-registry';
import type { LayoutServerLoad } from './$types';

export const prerender = true;

export const load: LayoutServerLoad = makeRootLayoutLoad(registry);
