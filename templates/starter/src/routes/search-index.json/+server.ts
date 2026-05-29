import { makeSearchIndexEndpoint } from '@iammaxim/docgen/server';
import { registry } from '$lib/docgen-registry';

export const prerender = true;
export const GET = makeSearchIndexEndpoint(registry);
