import type { ComponentType } from 'svelte';
import { createPaths, type DocPaths } from './paths.ts';
import type { DocsSiteConfig } from './config.ts';

export type RawDocModule = { default: ComponentType; metadata?: Record<string, unknown> };
export type DocModuleMap = Record<string, RawDocModule>;
export type DocRawMap = Record<string, string>;

export type DocMeta = {
  id: string;
  /** Route segments for `/docs/[...slug]` (trailing `index` omitted). */
  slug: string[];
  /** Full path segments under `docs/` including `index` — for nav tree placement only. */
  treeSlug: string[];
  /** Repo-relative source path including extension, such as `docs/dev/client.svx`. */
  sourcePath: string;
  path: string;
  title: string;
  description?: string;
  order: number;
  meta: Record<string, unknown>;
};

export type DocTreeNode = {
  id: string;
  label: string;
  type: 'group' | 'doc';
  path?: string;
  order: number;
  children?: DocTreeNode[];
};

export type DocHeading = { depth: number; label: string; anchor: string };
export type DocCallout = { kind: 'todo' | 'open-question' | 'discussion'; text: string };

export type SearchDocument = {
  id: string;
  path: string;
  title: string;
  description?: string;
  section: string;
  order: number;
  text: string;
  headings: DocHeading[];
  callouts: DocCallout[];
  rustRefs: string[];
};

export type DocGraphNode = {
  id: string;
  path: string;
  title: string;
  description?: string;
  section: string;
};
export type DocGraphEdge = { source: string; target: string };
export type DocGraph = { nodes: DocGraphNode[]; edges: DocGraphEdge[] };

export type LinkGraphFile = Record<string, { outgoing?: string[] }>;

export type Registry = {
  listDocs: () => DocMeta[];
  findDocMeta: (slug: string[]) => DocMeta | undefined;
  getDocComponent: (slug: string[]) => ComponentType | null;
  getEntryByPath: (path: string) => DocMeta | undefined;
  getDefaultDoc: () => DocMeta | undefined;
  getBacklinksForPath: (path: string) => DocMeta[];
  getBacklinksForSlug: (slug: string[]) => DocMeta[];
  listSearchDocuments: () => SearchDocument[];
  listDocGraph: () => DocGraph;
  buildDocTree: () => DocTreeNode[];
  listPrerenderDocSlugs: () => { slug: string }[];
  paths: DocPaths;
  config: DocsSiteConfig;
};

export type CreateRegistryOptions = {
  modules: DocModuleMap;
  raw: DocRawMap;
  config: DocsSiteConfig;
  linkGraph?: LinkGraphFile;
};

// ---------- Pure helpers (module-level, do not depend on registry state) ----------

const titleCase = (value: string) =>
  value
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

/** Strip query and normalize module path to repo `docs/` relative path with extension. */
const normalizeModuleKey = (modulePath: string) => {
  const withoutQuery = modulePath.replace(/\?.*$/, '');
  const marker = '/docs/';
  const idx = withoutQuery.indexOf(marker);
  const tail = idx >= 0 ? withoutQuery.slice(idx + marker.length) : withoutQuery;
  return tail.replace(/\\/g, '/');
};

const slugToId = (slug: string[]) => (slug.length ? slug.join('/') : 'index');

const stripFrontmatter = (raw: string) =>
  raw.startsWith('---') ? raw.replace(/^---[\s\S]*?---\s*/, '') : raw;

const stripForSearch = (raw: string) =>
  stripFrontmatter(raw)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_`|:-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const slugifyHeading = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const cleanInline = (value: string) =>
  value
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const extractHeadings = (raw: string): DocHeading[] => {
  const headings: DocHeading[] = [];
  const body = stripFrontmatter(raw);
  const used = new Map<string, number>();
  for (const match of body.matchAll(/^(#{2,4})\s+(.+)$/gm)) {
    const depth = match[1].length;
    const label = cleanInline(match[2]);
    if (!label) continue;
    const baseAnchor = slugifyHeading(label) || 'section';
    const count = used.get(baseAnchor) ?? 0;
    used.set(baseAnchor, count + 1);
    const anchor = count === 0 ? baseAnchor : `${baseAnchor}-${count}`;
    headings.push({ depth, label, anchor });
  }
  return headings;
};

const extractCallouts = (raw: string): DocCallout[] => {
  const callouts: DocCallout[] = [];
  const body = stripFrontmatter(raw);
  const pattern = /^>\s*(?:\*\*)?(TODO|OPEN QUESTION|DISCUSSION):(?:\*\*)?\s*(.+)$/gim;
  for (const match of body.matchAll(pattern)) {
    const rawKind = match[1].toLowerCase();
    const kind =
      rawKind === 'todo' ? 'todo' : rawKind === 'discussion' ? 'discussion' : 'open-question';
    callouts.push({ kind, text: cleanInline(match[2]) });
  }
  return callouts;
};

const extractRustRefs = (raw: string): string[] => {
  const refs = new Set<string>();
  for (const match of raw.matchAll(/<RustRef\s+[^>]*ref=(?:"([^"]+)"|'([^']+)')/g)) {
    const ref = (match[1] ?? match[2] ?? '').trim();
    if (ref) refs.add(ref);
  }
  return [...refs].sort();
};

const stripHashAndQuery = (value: string) => value.split('#')[0]?.split('?')[0] ?? value;

// ---------- Factory ----------

export const createRegistry = (opts: CreateRegistryOptions): Registry => {
  const paths = createPaths({ baseUrl: opts.config.baseUrl, ignore: opts.config.ignore });
  const { docRelToCanonical, DOC_URL_PREFIX, isDocPathIgnored } = paths;

  const normalizePath = (path: string) =>
    path === '/' || path === DOC_URL_PREFIX
      ? DOC_URL_PREFIX
      : path.replace(/\/+$/, '') || DOC_URL_PREFIX;

  const docPathFromMarkdownHref = (href: string): string | null => {
    const clean = stripHashAndQuery(href.trim());
    if (!clean) return null;
    if (clean === DOC_URL_PREFIX || clean.startsWith(`${DOC_URL_PREFIX}/`)) {
      return normalizePath(clean);
    }
    return null;
  };

  const resolveWikiTarget = (targetRaw: string, lookup: Map<string, string>): string | null => {
    const target = stripHashAndQuery(targetRaw.split('|')[0]?.trim() ?? '');
    if (!target) return null;
    const withoutDocs = target.replace(/^\/?docs\/?/i, '');
    const candidates = [
      target,
      target.replace(/^\/+/, ''),
      `/${target.replace(/^\/+/, '')}`,
      withoutDocs,
      `/${withoutDocs}`,
      `${DOC_URL_PREFIX}/${withoutDocs}`.replace(/\/+/g, '/')
    ];
    for (const candidate of candidates) {
      const resolved = lookup.get(candidate);
      if (resolved) return resolved;
    }
    return null;
  };

  const extractInternalDocLinks = (
    rawBody: string,
    lookup: Map<string, string>,
    sourcePath: string
  ): string[] => {
    const targets = new Set<string>();
    const body = stripFrontmatter(rawBody);

    for (const match of body.matchAll(/\[\[([^|\]]+?)(?:\|[^\]]+?)?\]\]/g)) {
      const target = resolveWikiTarget(match[1], lookup);
      if (target && target !== sourcePath) targets.add(target);
    }

    const mdLinkRe = new RegExp(
      `\\[[^\\]]+\\]\\((${DOC_URL_PREFIX.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')}/[^)#?\\s]+|${DOC_URL_PREFIX.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')})(?:[#?][^)]*)?\\)`,
      'g'
    );
    for (const match of body.matchAll(mdLinkRe)) {
      const target = docPathFromMarkdownHref(match[1]);
      if (target && target !== sourcePath && lookup.has(target)) targets.add(target);
    }

    return [...targets].sort();
  };

  const sectionForDoc = (doc: DocMeta): string => {
    const first = doc.slug[0];
    if (!first) return opts.config.defaultSection ?? 'Getting started';
    return opts.config.sectionLabels[first] ?? titleCase(first);
  };

  // ---- Build doc list & maps ----

  const docs: DocMeta[] = [];
  const componentMap = new Map<string, ComponentType>();
  const rawById = new Map<string, string>();

  for (const [path, module] of Object.entries(opts.modules)) {
    const relativeWithExt = normalizeModuleKey(path);
    if (isDocPathIgnored(relativeWithExt)) continue;

    const relNoExt = relativeWithExt.replace(/\.(md|svx)$/i, '');
    const { id, slug, treeSlug, path: pathName } = docRelToCanonical(relNoExt);

    const meta = module.metadata ?? {};
    const order = typeof meta.order === 'number' ? meta.order : Number(meta.order ?? 100);
    const title =
      (typeof meta.title === 'string' && meta.title.trim().length > 0
        ? meta.title.trim()
        : slug.length
          ? titleCase(slug[slug.length - 1])
          : opts.config.siteTitle) ?? opts.config.siteTitle;
    const description = typeof meta.description === 'string' ? meta.description : undefined;

    const entry: DocMeta = {
      id,
      slug,
      treeSlug,
      sourcePath: `docs/${relativeWithExt}`,
      path: pathName,
      title,
      description,
      order,
      meta
    };

    docs.push(entry);
    componentMap.set(id, module.default);
  }

  for (const [path, rawText] of Object.entries(opts.raw)) {
    const relativeWithExt = normalizeModuleKey(path);
    if (isDocPathIgnored(relativeWithExt)) continue;

    const relNoExt = relativeWithExt.replace(/\.(md|svx)$/i, '');
    const { id } = docRelToCanonical(relNoExt);
    rawById.set(id, rawText);
  }

  docs.sort((a, b) => {
    if (a.order === b.order) {
      return a.path.localeCompare(b.path);
    }
    return a.order - b.order;
  });

  const docMap = new Map(docs.map((doc) => [doc.id, doc]));

  // ---- Backlinks (seeded from linkGraph file if provided) ----

  const rawLinkGraph: LinkGraphFile =
    opts.linkGraph && typeof opts.linkGraph === 'object' ? opts.linkGraph : {};

  const docByPath = () => new Map(docs.map((doc) => [doc.path, doc]));

  const backlinksByPath = new Map<string, DocMeta[]>();
  for (const doc of docs) {
    backlinksByPath.set(doc.path, []);
  }

  for (const [sourcePathRaw, entry] of Object.entries(rawLinkGraph)) {
    const sourcePath = normalizePath(sourcePathRaw);
    const outgoing = entry?.outgoing ?? [];
    if (!outgoing.length) continue;

    const sourceDoc = docs.find((doc) => doc.path === sourcePath);
    if (!sourceDoc) continue;

    for (const targetPathRaw of outgoing) {
      const targetPath = normalizePath(targetPathRaw);
      const targetDoc = docs.find((doc) => doc.path === targetPath);
      if (!targetDoc) continue;

      const bucket = backlinksByPath.get(targetDoc.path);
      if (!bucket) continue;

      if (!bucket.some((d) => d.id === sourceDoc.id)) {
        bucket.push(sourceDoc);
      }
    }
  }

  // If no link graph was provided, derive backlinks from raw wikilinks/markdown links.
  if (!opts.linkGraph) {
    const lookup = (() => {
      const map = new Map<string, string>();
      for (const doc of docs) {
        map.set(doc.id, doc.path);
        map.set(doc.path, doc.path);
        map.set(doc.path.replace(/^\/+/, ''), doc.path);
        if (doc.slug.length) {
          const slug = doc.slug.join('/');
          map.set(slug, doc.path);
          map.set(`/${slug}`, doc.path);
          map.set(`${DOC_URL_PREFIX}/${slug}`, doc.path);
        } else {
          map.set('index', doc.path);
          map.set(DOC_URL_PREFIX, doc.path);
        }
        const leaf = doc.slug[doc.slug.length - 1];
        if (leaf && !map.has(leaf)) {
          map.set(leaf, doc.path);
        }
      }
      return map;
    })();

    for (const doc of docs) {
      const rawText = rawById.get(doc.id) ?? '';
      for (const targetPath of extractInternalDocLinks(rawText, lookup, doc.path)) {
        const bucket = backlinksByPath.get(targetPath);
        if (!bucket) continue;
        if (!bucket.some((d) => d.id === doc.id)) {
          bucket.push(doc);
        }
      }
    }
  }

  for (const group of backlinksByPath.values()) {
    group.sort((a, b) => {
      if (a.order === b.order) return a.title.localeCompare(b.title);
      return a.order - b.order;
    });
  }

  const getBacklinksForPath = (path: string): DocMeta[] => {
    const normalized = normalizePath(path);
    return backlinksByPath.get(normalized) ?? [];
  };

  const getBacklinksForSlug = (slug: string[]): DocMeta[] => {
    const id = slugToId(slug);
    const meta = docMap.get(id);
    if (!meta) return [];
    return getBacklinksForPath(meta.path);
  };

  // ---- Doc graph ----

  let cachedDocGraph: DocGraph | null = null;

  const targetLookup = () => {
    const map = new Map<string, string>();
    for (const doc of docs) {
      map.set(doc.id, doc.path);
      map.set(doc.path, doc.path);
      map.set(doc.path.replace(/^\/+/, ''), doc.path);
      if (doc.slug.length) {
        const slug = doc.slug.join('/');
        map.set(slug, doc.path);
        map.set(`/${slug}`, doc.path);
        map.set(`${DOC_URL_PREFIX}/${slug}`, doc.path);
      } else {
        map.set('index', doc.path);
        map.set(DOC_URL_PREFIX, doc.path);
      }
      const leaf = doc.slug[doc.slug.length - 1];
      if (leaf && !map.has(leaf)) {
        map.set(leaf, doc.path);
      }
    }
    return map;
  };

  const listDocGraph = (): DocGraph => {
    if (cachedDocGraph) return cachedDocGraph;

    const pathToDoc = docByPath();
    const lookup = targetLookup();
    const edgesByKey = new Map<string, DocGraphEdge>();

    for (const doc of docs) {
      const rawText = rawById.get(doc.id) ?? '';
      for (const targetPath of extractInternalDocLinks(rawText, lookup, doc.path)) {
        const targetDoc = pathToDoc.get(targetPath);
        if (!targetDoc) continue;
        const key = `${doc.id}->${targetDoc.id}`;
        edgesByKey.set(key, { source: doc.id, target: targetDoc.id });
      }
    }

    cachedDocGraph = {
      nodes: docs.map((doc) => ({
        id: doc.id,
        path: doc.path,
        title: doc.title,
        description: doc.description,
        section: sectionForDoc(doc)
      })),
      edges: [...edgesByKey.values()].sort((a, b) => {
        if (a.source === b.source) return a.target.localeCompare(b.target);
        return a.source.localeCompare(b.source);
      })
    };

    return cachedDocGraph;
  };

  // ---- Search ----

  let cachedSearchDocs: SearchDocument[] | null = null;

  const listSearchDocuments = (): SearchDocument[] => {
    if (cachedSearchDocs) return cachedSearchDocs;
    cachedSearchDocs = docs.map((doc) => {
      const rawText = rawById.get(doc.id) ?? '';
      return {
        id: doc.id,
        path: doc.path,
        title: doc.title,
        description: doc.description,
        section: sectionForDoc(doc),
        order: doc.order,
        text: stripForSearch(rawText),
        headings: extractHeadings(rawText),
        callouts: extractCallouts(rawText),
        rustRefs: extractRustRefs(rawText)
      };
    });
    return cachedSearchDocs;
  };

  // ---- Tree ----

  const ensureGroup = (
    target: DocTreeNode[],
    segment: string,
    pathPrefix: string[],
    fallbackOrder: number
  ): DocTreeNode => {
    const id = pathPrefix.join('/') || segment;
    const existing = target.find((node) => node.type === 'group' && node.id === id);

    const indexDoc = docMap.get(id);

    const groupOrder = indexDoc ? indexDoc.order : fallbackOrder;

    if (existing) {
      if (indexDoc) {
        existing.order = groupOrder;
        const trimmed = indexDoc.title.trim();
        if (trimmed.length > 0) {
          existing.label = trimmed;
        }
        existing.path = indexDoc.path;
      } else if (existing.order === 10000) {
        existing.order = groupOrder;
      }
      return existing;
    }

    let label: string = titleCase(segment);
    if (indexDoc !== undefined) {
      const trimmed = indexDoc.title.trim();
      if (trimmed.length > 0) {
        label = trimmed;
      }
    }

    const group: DocTreeNode = {
      id,
      label,
      type: 'group',
      path: indexDoc ? indexDoc.path : undefined,
      order: groupOrder,
      children: []
    };
    target.push(group);
    return group;
  };

  const sortNodes = (nodes: DocTreeNode[]): DocTreeNode[] =>
    nodes
      .map((node) =>
        node.type === 'group' && node.children
          ? { ...node, children: sortNodes(node.children) }
          : node
      )
      .sort((a, b) => {
        if (a.order === b.order) return a.label.localeCompare(b.label);
        return a.order - b.order;
      });

  let cachedTree: DocTreeNode[] | null = null;

  const buildDocTree = (): DocTreeNode[] => {
    if (cachedTree) return cachedTree;
    const tree: DocTreeNode[] = [];

    for (const doc of docs) {
      const isIndexFile =
        doc.treeSlug.length > 0 && doc.treeSlug[doc.treeSlug.length - 1] === 'index';
      if (isIndexFile) {
        continue;
      }

      if (!doc.slug.length) {
        tree.push({
          id: doc.id,
          label: doc.title,
          type: 'doc',
          path: doc.path,
          order: doc.order
        });
        continue;
      }

      let cursor = tree;
      const { slug } = doc;
      const parentSegments = slug.slice(0, -1);

      if (parentSegments.length) {
        const trail: string[] = [];
        for (const segment of parentSegments) {
          trail.push(segment);
          const group = ensureGroup(cursor, segment, [...trail], doc.order);
          cursor = group.children ?? (group.children = []);
        }
      }

      cursor.push({
        id: doc.id,
        label: doc.title,
        type: 'doc',
        path: doc.path,
        order: doc.order
      });
    }

    for (const doc of docs) {
      const isIndexFile =
        doc.treeSlug.length > 0 && doc.treeSlug[doc.treeSlug.length - 1] === 'index';
      if (!isIndexFile) {
        continue;
      }

      if (doc.slug.length === 0) {
        continue;
      }

      const parentSegments = doc.treeSlug.slice(0, -1);
      if (!parentSegments.length) {
        continue;
      }

      let cursor = tree;
      const trail: string[] = [];
      for (let i = 0; i < parentSegments.length; i++) {
        const segment = parentSegments[i];
        trail.push(segment);
        const isLastSegment = i === parentSegments.length - 1;
        const fallbackOrder = isLastSegment ? doc.order : 10000;
        const group = ensureGroup(cursor, segment, [...trail], fallbackOrder);
        cursor = group.children ?? (group.children = []);
      }
    }

    cachedTree = sortNodes(tree);
    return cachedTree;
  };

  // ---- Simple lookups ----

  const listDocs = () => docs;

  const findDocMeta = (slug: string[]) => {
    const id = slugToId(slug);
    return docMap.get(id);
  };

  const getDocComponent = (slug: string[]): ComponentType | null => {
    const id = slugToId(slug);
    return componentMap.get(id) ?? null;
  };

  const getEntryByPath = (path: string) => {
    const normalized =
      path === '/' || path === DOC_URL_PREFIX ? DOC_URL_PREFIX : path.replace(/\/+$/, '');
    return docs.find((doc) => doc.path === normalized);
  };

  const getDefaultDoc = () => docMap.get('index') ?? docs[0];

  const listPrerenderDocSlugs = (): { slug: string }[] => {
    const out: { slug: string }[] = [];
    for (const doc of docs) {
      if (doc.slug.length > 0) {
        out.push({ slug: doc.slug.join('/') });
      }
    }
    return out;
  };

  return {
    listDocs,
    findDocMeta,
    getDocComponent,
    getEntryByPath,
    getDefaultDoc,
    getBacklinksForPath,
    getBacklinksForSlug,
    listSearchDocuments,
    listDocGraph,
    buildDocTree,
    listPrerenderDocSlugs,
    paths,
    config: opts.config
  };
};


// ---------- Glob helper ----------

export const defaultDocGlob = (opts: {
  docsRelativeFromCallSite: string;
  ignore: string[];
}): string[] => {
  const base = opts.docsRelativeFromCallSite.replace(/\/+$/, '');
  return [
    `${base}/**/*.md`,
    `${base}/**/*.svx`,
    ...opts.ignore.map((dir) => `!${base}/${dir.replace(/\/+$/, '')}/**`)
  ];
};
