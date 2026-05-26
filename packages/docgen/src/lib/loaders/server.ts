import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname, isAbsolute } from 'node:path';
import type { Registry } from '../registry.ts';

export type RootLayoutLoadOptions = {
  /** Path to consumer repo root containing .git/; defaults to dirname(resolved docsDir). */
  repoRoot?: string;
};

export const makeRootLayoutLoad = (registry: Registry, opts: RootLayoutLoadOptions = {}) => {
  const resolveRepoRoot = (): string => {
    if (opts.repoRoot) {
      return isAbsolute(opts.repoRoot) ? opts.repoRoot : resolve(process.cwd(), opts.repoRoot);
    }
    const docsRoot = isAbsolute(registry.config.docsDir)
      ? registry.config.docsDir
      : resolve(process.cwd(), registry.config.docsDir);
    return dirname(docsRoot);
  };

  const readGit = (repoRoot: string, command: string): string | null => {
    try {
      return execSync(command, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: repoRoot
      }).trim();
    } catch {
      return null;
    }
  };

  const getCommitInfo = (repoRoot: string) => {
    if (!existsSync(resolve(repoRoot, '.git'))) return null;
    const hash = readGit(repoRoot, 'git rev-parse HEAD');
    if (!hash) return null;
    return {
      hash,
      shortHash: readGit(repoRoot, 'git rev-parse --short HEAD') ?? hash.slice(0, 8),
      message: readGit(repoRoot, 'git log -1 --pretty=%s'),
      author: readGit(repoRoot, 'git log -1 --pretty=%an'),
      date: readGit(repoRoot, "git log -1 --date=iso-strict --pretty='%cd'")?.replace(/'/g, '') ?? null
    };
  };

  return async () => {
    const repoRoot = resolveRepoRoot();
    const docs = registry.listDocs();
    const tree = registry.buildDocTree();
    const searchDocs = registry.listSearchDocuments();
    const calloutCount = searchDocs.reduce((sum, d) => sum + d.callouts.length, 0);
    return {
      tree,
      stats: { totalDocs: docs.length, totalCallouts: calloutCount },
      commit: getCommitInfo(repoRoot),
      buildTimestamp: new Date().toISOString()
    };
  };
};
