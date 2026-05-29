import { makeDocEditorPageLoad, makeEditorServer } from '@iammaxim/docgen/server';
import { registry, config } from '$lib/docgen-registry';
import { dev } from '$app/environment';

export const prerender = false;
const editor = makeEditorServer({ registry, docsDir: config.docsDir });
const loader = makeDocEditorPageLoad({ registry, dev });
export const load = ({ params }: { params: { slug?: string } }) =>
	loader(editor.slugFromParam(params.slug));
