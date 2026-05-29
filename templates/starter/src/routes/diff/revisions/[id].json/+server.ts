import { makeDiffRevisionEndpoint } from '@iammaxim/docgen/server';
import { registry, config } from '$lib/docgen-registry';
import { dev } from '$app/environment';

export const prerender = true;
const ep = makeDiffRevisionEndpoint({ registry, docsDir: config.docsDir, dev });
export const GET = ep.GET;
export const entries = ep.entries;
