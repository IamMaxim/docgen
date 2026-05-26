import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { dirname, extname, relative, resolve, sep } from 'node:path';

export type EditorPaths = {
  repoRoot: string;
  docsRoot: string;
  isDocPathIgnored: (rel: string) => boolean;
};

export type ResolvedDocSourcePath = {
  repoRoot: string;
  docsRoot: string;
  repoRelativePath: string;
  absolutePath: string;
  extension: '.md' | '.svx';
};

export class DocEditorSourceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'DocEditorSourceError';
    this.status = status;
  }
}

export const createEditorPaths = (opts: {
  docsDir: string;
  repoRoot?: string;
  isDocPathIgnored?: (rel: string) => boolean;
}): EditorPaths => {
  const docsRoot = resolve(process.cwd(), opts.docsDir);
  const repoRoot = opts.repoRoot ? resolve(opts.repoRoot) : dirname(docsRoot);
  return {
    docsRoot,
    repoRoot,
    isDocPathIgnored: opts.isDocPathIgnored ?? (() => false)
  };
};

export function hashSource(source: string): string {
  return createHash('sha256').update(source, 'utf8').digest('hex');
}

export function validateRepoDocPath(
  paths: EditorPaths,
  repoRelativePath: string
): ResolvedDocSourcePath {
  const normalized = repoRelativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized.startsWith('docs/')) {
    throw new DocEditorSourceError(400, 'Editor path must be under docs');
  }

  const relativeFromDocs = normalized.slice('docs/'.length);
  if (!relativeFromDocs || paths.isDocPathIgnored(relativeFromDocs)) {
    throw new DocEditorSourceError(403, 'Editor path is ignored by docs-site.config.json');
  }

  const extension = extname(normalized);
  if (extension !== '.md' && extension !== '.svx') {
    throw new DocEditorSourceError(400, 'Editor path must be a Markdown or SVX file');
  }

  const absolutePath = resolve(paths.repoRoot, normalized);
  const relativeToDocs = relative(paths.docsRoot, absolutePath);
  if (
    relativeToDocs === '' ||
    relativeToDocs.startsWith('..') ||
    relativeToDocs.includes(`..${sep}`)
  ) {
    throw new DocEditorSourceError(403, 'Editor path must stay under docs');
  }

  if (!existsSync(absolutePath)) {
    throw new DocEditorSourceError(404, 'Editor path does not exist');
  }

  const stat = lstatSync(absolutePath);
  if (!stat.isFile() && !stat.isSymbolicLink()) {
    throw new DocEditorSourceError(400, 'Editor path must be a file');
  }

  const docsRootReal = realpathSync(paths.docsRoot);
  const realPath = realpathSync(absolutePath);
  const realRelative = relative(docsRootReal, realPath);
  if (realRelative === '' || realRelative.startsWith('..') || realRelative.includes(`..${sep}`)) {
    throw new DocEditorSourceError(403, 'Editor path realpath must stay under docs');
  }

  if (!statSync(realPath).isFile()) {
    throw new DocEditorSourceError(400, 'Editor path realpath must be a file');
  }

  return {
    repoRoot: paths.repoRoot,
    docsRoot: paths.docsRoot,
    repoRelativePath: normalized,
    absolutePath,
    extension
  };
}

export function readSourceFile(path: ResolvedDocSourcePath): string {
  return readFileSync(path.absolutePath, 'utf8');
}

export function readHeadSource(repoRelativePath: string, repoRoot: string): string {
  try {
    return execFileSync('git', ['show', `HEAD:${repoRelativePath}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch {
    return '';
  }
}

export function saveSourceFile(
  path: ResolvedDocSourcePath,
  source: string,
  expectedDiskHash: string
): { source: string; diskHash: string; savedAt: string } {
  const current = readSourceFile(path);
  const currentHash = hashSource(current);
  if (currentHash !== expectedDiskHash) {
    throw new DocEditorSourceError(409, 'Source changed on disk');
  }

  writeFileSync(path.absolutePath, source, 'utf8');
  return {
    source,
    diskHash: hashSource(source),
    savedAt: new Date().toISOString()
  };
}
