export type DocsSiteConfig = {
  siteTitle: string;
  /** Optional one-line site description, surfaced on the home page and in meta tags. */
  description?: string;
  docsDir: string;
  baseUrl: string;
  ignore: string[];
  sectionLabels: Record<string, string>;
  defaultSection?: string;
  features: {
    diff: boolean;
    editor: boolean;
    search: boolean;
    graph: boolean;
  };
  embedAllowlist?: string[];
  diff?: {
    head?: string;
    limit?: number;
    base?: string;
  };
};

export const defineConfig = (config: DocsSiteConfig): DocsSiteConfig => config;

const DEFAULTS = {
  baseUrl: '/docs',
  ignore: [] as string[],
  diff: { limit: 50 }
};

export const validateConfig = (raw: unknown): DocsSiteConfig => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('docs-site config must be an object');
  }
  const obj = raw as Record<string, unknown>;
  if (typeof obj.siteTitle !== 'string' || obj.siteTitle.trim() === '') {
    throw new Error('docs-site config: siteTitle is required (non-empty string)');
  }
  if (typeof obj.docsDir !== 'string' || obj.docsDir.trim() === '') {
    throw new Error('docs-site config: docsDir is required (relative path string)');
  }
  if (!obj.features || typeof obj.features !== 'object') {
    throw new Error('docs-site config: features is required');
  }
  const features = obj.features as Record<string, unknown>;
  const baseUrl = (obj.baseUrl as string | undefined) ?? DEFAULTS.baseUrl;
  if (typeof baseUrl !== 'string' || !baseUrl.startsWith('/')) {
    throw new Error('docs-site config: baseUrl must start with "/"');
  }
  return {
    siteTitle: obj.siteTitle,
    description: typeof obj.description === 'string' ? obj.description : undefined,
    docsDir: obj.docsDir,
    baseUrl,
    ignore: Array.isArray(obj.ignore) ? (obj.ignore as string[]) : DEFAULTS.ignore,
    sectionLabels: (obj.sectionLabels as Record<string, string> | undefined) ?? {},
    defaultSection: obj.defaultSection as string | undefined,
    features: {
      diff: !!features.diff,
      editor: !!features.editor,
      search: features.search !== false,
      graph: !!features.graph
    },
    embedAllowlist: obj.embedAllowlist as string[] | undefined,
    diff: {
      ...DEFAULTS.diff,
      ...((obj.diff as { head?: string; limit?: number; base?: string } | undefined) ?? {})
    }
  };
};
