type PathsConfig = { baseUrl: string; ignore: string[] };

export type DocCanonical = {
  id: string;
  slug: string[];
  treeSlug: string[];
  path: string;
};

export type DocPaths = {
  DOC_URL_PREFIX: string;
  isDocPathIgnored: (relativeFromDocsRoot: string) => boolean;
  docRelToCanonical: (relNoExt: string) => DocCanonical;
};

export const createPaths = (cfg: PathsConfig): DocPaths => {
  const DOC_URL_PREFIX = cfg.baseUrl;

  const isDocPathIgnored = (relativeFromDocsRoot: string): boolean => {
    const norm = relativeFromDocsRoot.replace(/\\/g, '/').replace(/^\/+/, '');
    for (const rule of cfg.ignore) {
      const r = rule.replace(/\\/g, '/').replace(/^\/+/, '');
      if (!r) continue;
      if (r.endsWith('/**')) {
        const prefix = r.slice(0, -3).replace(/\/+$/, '');
        if (norm === prefix || norm.startsWith(`${prefix}/`)) return true;
      } else if (norm === r || norm.startsWith(`${r}/`)) return true;
    }
    return false;
  };

  const docRelToCanonical = (relNoExt: string): DocCanonical => {
    const norm = relNoExt.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
    if (norm === '' || norm === 'index') {
      return { id: 'index', slug: [], treeSlug: [], path: DOC_URL_PREFIX };
    }
    const parts = norm.split('/').filter(Boolean);
    const isFolderIndex = parts.length > 0 && parts[parts.length - 1] === 'index';
    const routeParts = isFolderIndex && parts.length > 1 ? parts.slice(0, -1) : parts;
    const id = routeParts.length ? routeParts.join('/') : 'index';
    const slug = routeParts;
    const path =
      slug.length === 0 ? DOC_URL_PREFIX : `${DOC_URL_PREFIX}/${slug.join('/')}`;
    return { id, slug, path, treeSlug: parts };
  };

  return { DOC_URL_PREFIX, isDocPathIgnored, docRelToCanonical };
};
