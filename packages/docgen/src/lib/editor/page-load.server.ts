import { error } from '@sveltejs/kit';
import type { Registry } from '../registry.ts';

export type MakeDocEditorPageLoadOptions = {
  registry: Registry;
  /** Pass `import.meta.env.DEV` (or equivalent) from the consumer. Default: allow. */
  dev?: boolean;
};

export const makeDocEditorPageLoad =
  (opts: MakeDocEditorPageLoadOptions) => (slug: string[]) => {
    if (opts.dev === false) {
      error(404, 'Documentation editor is only available during npm run dev');
    }

    const doc =
      opts.registry.findDocMeta(slug) ?? (!slug.length ? opts.registry.getDefaultDoc() : null);
    if (!doc) {
      error(404, `Document not found for "${slug.join('/') || 'index'}"`);
    }

    return {
      currentDoc: doc,
      slug,
      backlinks: opts.registry.getBacklinksForPath(doc.path),
      editor: {
        slug: slug.join('/'),
        docPath: doc.sourcePath,
        viewPath: doc.path
      }
    };
  };
