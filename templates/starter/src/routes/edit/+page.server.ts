import { makeDocEditorPageLoad } from '@iammaxim/docgen/server';
import { registry } from '$lib/docgen-registry';
import { dev } from '$app/environment';

export const prerender = false;
export const load = () => makeDocEditorPageLoad({ registry, dev })([]);
