import type { Registry, DocMeta } from '../registry.ts';
import type { DocEditorSaveResponse, DocEditorSourcePayload } from './types.ts';
import {
  DocEditorSourceError,
  createEditorPaths,
  hashSource,
  readHeadSource,
  readSourceFile,
  saveSourceFile,
  validateRepoDocPath,
  type EditorPaths,
  type ResolvedDocSourcePath
} from './source-paths.server.ts';

export { DocEditorSourceError };
export type { EditorPaths, ResolvedDocSourcePath };

export type EditorServer = {
  paths: EditorPaths;
  slugFromParam: (value: string | undefined) => string[];
  slugFromQuery: (value: string | null) => string[];
  slugToQuery: (slug: string[]) => string;
  assertEditorDevMode: (isDev: boolean) => void;
  resolveDocEditorSource: (slug: string[]) => Promise<ResolvedDocSourcePath>;
  loadDocEditorSource: (slug: string[]) => Promise<DocEditorSourcePayload>;
  saveDocEditorSource: (
    slug: string[],
    source: string,
    diskHash: string
  ) => Promise<DocEditorSaveResponse>;
  sourceErrorResponse: (err: unknown) => { status: number; body: { error: string } };
};

export type MakeEditorServerOptions = {
  registry: Registry;
  docsDir: string;
  repoRoot?: string;
};

export const makeEditorServer = (opts: MakeEditorServerOptions): EditorServer => {
  const paths = createEditorPaths({
    docsDir: opts.docsDir,
    repoRoot: opts.repoRoot,
    isDocPathIgnored: opts.registry.paths.isDocPathIgnored
  });

  const slugFromParam = (value: string | undefined): string[] =>
    value === undefined || value === '' ? [] : value.split('/').filter(Boolean);

  const slugFromQuery = (value: string | null): string[] =>
    value === null || value === '' ? [] : value.split('/').filter(Boolean);

  const slugToQuery = (slug: string[]): string => slug.join('/');

  const assertEditorDevMode = (isDev: boolean): void => {
    if (!isDev) {
      throw new DocEditorSourceError(
        404,
        'Documentation editor is only available during npm run dev'
      );
    }
  };

  const findEditorDoc = (slug: string[]): DocMeta | null =>
    opts.registry.findDocMeta(slug) ?? (!slug.length ? (opts.registry.getDefaultDoc() ?? null) : null);

  const resolveDocEditorSource = async (slug: string[]): Promise<ResolvedDocSourcePath> => {
    const doc = findEditorDoc(slug);
    if (!doc) {
      throw new DocEditorSourceError(404, `Document not found for "${slug.join('/') || 'index'}"`);
    }
    return validateRepoDocPath(paths, doc.sourcePath);
  };

  const loadDocEditorSource = async (slug: string[]): Promise<DocEditorSourcePayload> => {
    const doc = findEditorDoc(slug);
    if (!doc) {
      throw new DocEditorSourceError(404, `Document not found for "${slug.join('/') || 'index'}"`);
    }
    const resolved = validateRepoDocPath(paths, doc.sourcePath);
    const source = readSourceFile(resolved);
    return {
      doc,
      docPath: resolved.repoRelativePath,
      viewPath: doc.path,
      source,
      headSource: readHeadSource(resolved.repoRelativePath, resolved.repoRoot),
      diskHash: hashSource(source)
    };
  };

  const saveDocEditorSource = async (
    slug: string[],
    source: string,
    diskHash: string
  ): Promise<DocEditorSaveResponse> => {
    const resolved = await resolveDocEditorSource(slug);
    const saved = saveSourceFile(resolved, source, diskHash);
    return {
      docPath: resolved.repoRelativePath,
      source: saved.source,
      diskHash: saved.diskHash,
      savedAt: saved.savedAt
    };
  };

  const sourceErrorResponse = (
    errorValue: unknown
  ): { status: number; body: { error: string } } => {
    if (errorValue instanceof DocEditorSourceError) {
      return { status: errorValue.status, body: { error: errorValue.message } };
    }
    if (errorValue instanceof Error) {
      return { status: 500, body: { error: errorValue.message } };
    }
    return { status: 500, body: { error: String(errorValue) } };
  };

  return {
    paths,
    slugFromParam,
    slugFromQuery,
    slugToQuery,
    assertEditorDevMode,
    resolveDocEditorSource,
    loadDocEditorSource,
    saveDocEditorSource,
    sourceErrorResponse
  };
};
