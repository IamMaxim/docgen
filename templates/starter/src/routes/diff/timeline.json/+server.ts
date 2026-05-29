import { makeDiffTimelineEndpoint } from '@iammaxim/docgen/server';
import { registry, config } from '$lib/docgen-registry';
import { dev } from '$app/environment';

export const prerender = true;
export const GET = makeDiffTimelineEndpoint({ registry, docsDir: config.docsDir, dev });
