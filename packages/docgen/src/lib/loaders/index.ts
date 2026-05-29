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

/**
 * Load a doc by its full URL path for a `baseUrl`-agnostic root catch-all route
 * (`src/routes/[...rest]/+page`). Unlike `makeDocsSlugLoad`, this resolves
 * against `doc.path` (which already includes `config.baseUrl`), so the route
 * works for any configured `baseUrl` without a hardcoded `/docs` folder.
 */
export const makeDocPageLoad = (registry: Registry) =>
  async ({ params }: { params: { rest?: string } }) => {
    const rest = (params.rest ?? '').replace(/^\/+|\/+$/g, '');
    const path = rest ? `/${rest}` : registry.config.baseUrl;
    const doc = registry.getEntryByPath(path);
    if (!doc) throw error(404, `Document not found: ${path || '/'}`);
    return {
      currentDoc: doc,
      slug: doc.slug,
      backlinks: registry.getBacklinksForPath(doc.path)
    };
  };

/** Prerender entries for the root catch-all route — one `rest` per doc, including the index. */
export const makeDocPageEntries = (registry: Registry) => () =>
  registry.listDocs().map((doc) => ({ rest: doc.path.replace(/^\/+/, '') }));

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
