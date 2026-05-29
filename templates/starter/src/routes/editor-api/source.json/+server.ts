import { makeEditorSourceEndpoint } from '@iammaxim/docgen/server';
import { registry, config } from '$lib/docgen-registry';
import { dev } from '$app/environment';

export const prerender = false;
const ep = makeEditorSourceEndpoint({ registry, docsDir: config.docsDir, dev });
export const GET = ep.GET;
export const PUT = ep.PUT;
