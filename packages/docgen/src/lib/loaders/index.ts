import { error } from '@sveltejs/kit';
import type { Registry } from '../registry.ts';

export const makeDocsIndexLoad = (registry: Registry) => async () => {
  const doc = registry.findDocMeta([]) ?? registry.getDefaultDoc();
  if (!doc) throw error(404, 'No wiki index document (docs/index.md)');
  return {
    currentDoc: doc,
    slug: [] as string[],
    backlinks: registry.getBacklinksForPath(doc.path)
  };
};

export const makeDocsSlugLoad = (registry: Registry) =>
  async ({ params }: { params: { slug?: string } }) => {
    const slug =
      !params.slug ? [] : params.slug.split('/').filter(Boolean);
    const doc =
      registry.findDocMeta(slug) ?? (!slug.length ? registry.getDefaultDoc() : null);
    if (!doc) throw error(404, `Document not found for "${slug.join('/') || 'index'}"`);
    return {
      currentDoc: doc,
      slug,
      backlinks: registry.getBacklinksForPath(doc.path)
    };
  };

export const makeDocsSlugEntries = (registry: Registry) => () =>
  registry.listPrerenderDocSlugs();

export const makeHomeLoad = (registry: Registry) => async () => ({
  homeDocs: registry.listSearchDocuments().map((doc) => ({
    id: doc.id,
    path: doc.path,
    title: doc.title,
    description: doc.description,
    section: doc.section,
    order: doc.order,
    callouts: doc.callouts
  })),
  graph: registry.listDocGraph()
});
