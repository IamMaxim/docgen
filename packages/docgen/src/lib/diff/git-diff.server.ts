import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';

import type { Registry } from '../registry.ts';
import { buildBlockDiff } from './block-diff.ts';
import { buildFileTree } from './file-tree.ts';
import { buildLineHunks } from './line-diff.ts';
import { parseNameStatus, parseUntrackedDocs, type NameStatusEntry } from './git-parsing.ts';
import { baseRefForCommitParents } from './git-refs.ts';
import { renderMarkdownBlock } from './markdown-render.server.ts';
import type { DocDiffFile, DocDiffMode, DocDiffReport, DocDiffTimelinePoint } from './types.ts';

export type DocDiffServer = {
  loadDocDiffReport: () => Promise<DocDiffReport>;
  loadDocDiffTimelineReport: () => Promise<DocDiffReport>;
  loadDocDiffRevision: (id: string) => Promise<DocDiffTimelinePoint | null>;
};

export type MakeDocDiffServerOptions = {
  registry: Registry;
  /** Absolute or process.cwd()-relative path to the docs directory. */
  docsDir: string;
  /** Absolute path to the repo root. Defaults to `dirname(resolved docsDir)`. */
  repoRoot?: string;
  /** Whether to surface dev-mode worktree behavior. Defaults to `false`. */
  dev?: boolean;
};

export const makeDocDiffServer = (opts: MakeDocDiffServerOptions): DocDiffServer => {
  const docsRoot = isAbsolute(opts.docsDir) ? opts.docsDir : resolve(process.cwd(), opts.docsDir);
  const repoRoot = opts.repoRoot ? resolve(opts.repoRoot) : dirname(docsRoot);
  const repoRootRealPath = realpathSync(repoRoot);
  const docsPath = relative(repoRoot, docsRoot) || basename(docsRoot);
  const dev = opts.dev ?? false;

  async function loadDocDiffReport(): Promise<DocDiffReport> {
    return loadDocDiffTimelineReport();
  }

  async function loadDocDiffTimelineReport(): Promise<DocDiffReport> {
    try {
      const timeline = buildTimelineSummaries();
      return reportFromTimeline(dev ? 'dev-worktree' : 'build-history', timeline, []);
    } catch (error) {
      return emptyReport({
        mode: dev ? 'dev-worktree' : 'build-history',
        baseRef: dev ? 'HEAD' : rawBuildBaseRef(),
        headRef: dev ? 'worktree' : rawBuildHeadRef(),
        warnings: [`Failed to load documentation diff: ${errorMessage(error)}`]
      });
    }
  }

  async function loadDocDiffRevision(id: string): Promise<DocDiffTimelinePoint | null> {
    try {
      return await buildRevision(id);
    } catch (error) {
      throw new Error(`Failed to load documentation revision: ${errorMessage(error)}`);
    }
  }

  function buildTimelineSummaries(): DocDiffTimelinePoint[] {
    const timeline: DocDiffTimelinePoint[] = [];

    if (dev) {
      const trackedEntries = parseNameStatus(
        gitListOutput(['diff', '--name-status', 'HEAD', '--', docsPath])
      );
      const trackedStats = parseNumstat(
        gitListOutput(['diff', '--numstat', 'HEAD', '--', docsPath])
      );
      const untrackedEntries = parseUntrackedDocs(
        gitListOutput(['ls-files', '--others', '--exclude-standard', docsPath])
      ).map((path): NameStatusEntry => ({ status: 'added', path }));

      const untrackedStats = new Map(
        untrackedEntries.map((entry) => [
          entry.path,
          { addedLines: countTextLines(readWorktree(entry.path)), removedLines: 0 }
        ])
      );
      const entries = [...trackedEntries, ...untrackedEntries];
      if (entries.length > 0) {
        timeline.push(
          buildTimelineSummaryPoint({
            id: 'worktree',
            kind: 'worktree',
            hash: null,
            shortHash: 'worktree',
            subject: 'Uncommitted changes',
            author: null,
            date: null,
            baseRef: 'HEAD',
            headRef: 'worktree',
            entries,
            lineStats: mergeLineStats(trackedStats, untrackedStats)
          })
        );
      }
    }

    for (const commit of recentDocCommits()) {
      const baseRef = baseRefForCommitParents(commit.hash, commit.parents);
      const headRef = commit.hash;
      const entries = parseNameStatus(
        gitListOutput(['diff', '--name-status', baseRef, headRef, '--', docsPath])
      );
      if (entries.length === 0) continue;

      timeline.push(
        buildTimelineSummaryPoint({
          ...commit,
          id: commit.hash,
          kind: 'commit',
          baseRef,
          headRef,
          entries,
          lineStats: parseNumstat(
            gitListOutput(['diff', '--numstat', baseRef, headRef, '--', docsPath])
          )
        })
      );
    }

    return timeline;
  }

  async function buildRevision(id: string): Promise<DocDiffTimelinePoint | null> {
    if (dev && id === 'worktree') {
      const trackedEntries = parseNameStatus(
        gitListOutput(['diff', '--name-status', 'HEAD', '--', docsPath])
      );
      const untrackedEntries = parseUntrackedDocs(
        gitListOutput(['ls-files', '--others', '--exclude-standard', docsPath])
      ).map((path): NameStatusEntry => ({ status: 'added', path }));

      return buildTimelinePoint({
        id: 'worktree',
        kind: 'worktree',
        hash: null,
        shortHash: 'worktree',
        subject: 'Uncommitted changes',
        author: null,
        date: null,
        baseRef: 'HEAD',
        headRef: 'worktree',
        entries: [...trackedEntries, ...untrackedEntries],
        readOldText: (entry) =>
          entry.status === 'added' ? '' : gitShow('HEAD', entry.oldPath ?? entry.path),
        readNewText: (entry) => (entry.status === 'deleted' ? '' : readWorktree(entry.path))
      });
    }

    const commit = recentDocCommits().find((candidate) => candidate.hash === id);
    if (!commit) return null;

    const baseRef = baseRefForCommitParents(commit.hash, commit.parents);
    const headRef = commit.hash;
    const entries = parseNameStatus(
      gitListOutput(['diff', '--name-status', baseRef, headRef, '--', docsPath])
    );
    if (entries.length === 0) return null;

    return buildTimelinePoint({
      ...commit,
      id: commit.hash,
      kind: 'commit',
      baseRef,
      headRef,
      entries,
      readOldText: (entry) =>
        entry.status === 'added' ? '' : gitShow(baseRef, entry.oldPath ?? entry.path),
      readNewText: (entry) => (entry.status === 'deleted' ? '' : gitShow(headRef, entry.path))
    });
  }

  function buildTimelineSummaryPoint(options: {
    id: string;
    kind: DocDiffTimelinePoint['kind'];
    hash: string | null;
    shortHash: string;
    subject: string;
    author: string | null;
    date: string | null;
    baseRef: string;
    headRef: string;
    entries: NameStatusEntry[];
    lineStats: Map<string, { addedLines: number; removedLines: number }>;
  }): DocDiffTimelinePoint {
    const files = options.entries.map((entry): DocDiffFile => {
      const stats = options.lineStats.get(entry.path) ?? { addedLines: 0, removedLines: 0 };
      return {
        path: entry.path,
        oldPath: entry.oldPath,
        status: entry.status,
        addedLines: stats.addedLines,
        removedLines: stats.removedLines,
        hunks: []
      };
    });

    return {
      id: options.id,
      kind: options.kind,
      hash: options.hash,
      shortHash: options.shortHash,
      subject: options.subject,
      author: options.author,
      date: options.date,
      baseRef: options.baseRef,
      headRef: options.headRef,
      files,
      fileTree: buildFileTree(files),
      totalAddedLines: files.reduce((total, file) => total + file.addedLines, 0),
      totalRemovedLines: files.reduce((total, file) => total + file.removedLines, 0),
      warnings: []
    };
  }

  async function buildTimelinePoint(options: {
    id: string;
    kind: DocDiffTimelinePoint['kind'];
    hash: string | null;
    shortHash: string;
    subject: string;
    author: string | null;
    date: string | null;
    baseRef: string;
    headRef: string;
    entries: NameStatusEntry[];
    readOldText: (entry: NameStatusEntry) => string;
    readNewText: (entry: NameStatusEntry) => string;
  }): Promise<DocDiffTimelinePoint> {
    const files = (
      await Promise.all(
        options.entries.map(async (entry): Promise<DocDiffFile | null> => {
          const oldText = options.readOldText(entry);
          const newText = options.readNewText(entry);
          const hunks = buildLineHunks(oldText, newText);
          const blocks = await Promise.all(
            buildBlockDiff(oldText, newText).map(async (block) => ({
              ...block,
              html: await renderMarkdownBlock(block.raw)
            }))
          );

          if (hunks.length === 0 && blocks.every((block) => block.kind === 'context')) {
            return null;
          }

          const addedLines = countLines(hunks, 'added');
          const removedLines = countLines(hunks, 'removed');

          return {
            path: entry.path,
            oldPath: entry.oldPath,
            status: entry.status,
            addedLines,
            removedLines,
            hunks,
            blocks
          };
        })
      )
    ).filter((file): file is DocDiffFile => file !== null);

    return {
      id: options.id,
      kind: options.kind,
      hash: options.hash,
      shortHash: options.shortHash,
      subject: options.subject,
      author: options.author,
      date: options.date,
      baseRef: options.baseRef,
      headRef: options.headRef,
      files,
      fileTree: buildFileTree(files),
      totalAddedLines: files.reduce((total, file) => total + file.addedLines, 0),
      totalRemovedLines: files.reduce((total, file) => total + file.removedLines, 0),
      warnings: []
    };
  }

  function reportFromTimeline(
    mode: DocDiffMode,
    timeline: DocDiffTimelinePoint[],
    warnings: string[]
  ): DocDiffReport {
    const selectedPoint = timeline[0] ?? null;
    const selectedFile = selectedPoint?.files[0] ?? null;
    return {
      mode,
      baseRef: selectedPoint?.baseRef ?? (dev ? 'HEAD' : buildBaseRef()),
      headRef: selectedPoint?.headRef ?? (dev ? 'worktree' : buildHeadRef()),
      generatedAt: new Date().toISOString(),
      timeline,
      selectedPointId: selectedPoint?.id ?? null,
      selectedFilePath: selectedFile?.path ?? null,
      files: selectedPoint?.files ?? [],
      totalAddedLines: selectedPoint?.totalAddedLines ?? 0,
      totalRemovedLines: selectedPoint?.totalRemovedLines ?? 0,
      warnings
    };
  }

  function countLines(hunks: DocDiffFile['hunks'], kind: 'added' | 'removed'): number {
    return hunks.reduce(
      (total, hunk) => total + hunk.lines.filter((line) => line.kind === kind).length,
      0
    );
  }

  function gitListOutput(args: string[]): string {
    return execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
  }

  function gitShow(ref: string, path: string): string {
    return execFileSync('git', ['show', `${ref}:${path}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
  }

  function parseNumstat(
    output: string
  ): Map<string, { addedLines: number; removedLines: number }> {
    const stats = new Map<string, { addedLines: number; removedLines: number }>();
    if (!output) return stats;

    for (const line of output.split('\n')) {
      const [addedRaw, removedRaw, pathRaw] = line.split('\t');
      if (!pathRaw) continue;
      const addedLines = parseNumstatCount(addedRaw);
      const removedLines = parseNumstatCount(removedRaw);
      stats.set(normalizeNumstatPath(pathRaw), { addedLines, removedLines });
    }

    return stats;
  }

  function parseNumstatCount(value: string): number {
    if (value === '-') return 0;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function normalizeNumstatPath(path: string): string {
    return path.replace(/^\{(.+?) => (.+?)\}(.*)$/, (_match, _oldPrefix, newPrefix, suffix) => {
      return `${newPrefix}${suffix}`;
    });
  }

  function mergeLineStats(
    first: Map<string, { addedLines: number; removedLines: number }>,
    second: Map<string, { addedLines: number; removedLines: number }>
  ): Map<string, { addedLines: number; removedLines: number }> {
    return new Map([...first, ...second]);
  }

  function countTextLines(text: string): number {
    if (!text) return 0;
    return text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;
  }

  type CommitRow = {
    hash: string;
    shortHash: string;
    parents: string;
    author: string | null;
    date: string | null;
    subject: string;
  };

  function recentDocCommits(): CommitRow[] {
    const limit = diffLimit();
    const output = gitListOutput([
      'log',
      `--max-count=${limit}`,
      '--format=%H%x1f%h%x1f%P%x1f%an%x1f%aI%x1f%s',
      buildHeadRef(),
      '--',
      docsPath
    ]);
    if (!output) return [];
    return output.split('\n').flatMap((line): CommitRow[] => {
      const [hash, shortHash, parents, author, date, subject] = line.split('\x1f');
      if (!hash || !shortHash) return [];
      return [
        {
          hash,
          shortHash,
          parents: parents ?? '',
          author: author || null,
          date: date || null,
          subject: subject || ''
        }
      ];
    });
  }

  function diffLimit(): number {
    const parsed = Number.parseInt(
      process.env.DOC_DIFF_LIMIT ?? String(opts.registry.config.diff?.limit ?? 50),
      10
    );
    if (!Number.isFinite(parsed) || parsed < 1) return 50;
    return Math.min(parsed, 200);
  }

  function readWorktree(path: string): string {
    const resolvedPath = resolve(repoRoot, path);

    if (!isInsideDirectory(repoRoot, resolvedPath)) {
      throw new Error(`Refusing to read path outside repository: ${path}`);
    }

    const pathStat = lstatOrNull(resolvedPath);
    if (!pathStat) return '';

    if (pathStat.isSymbolicLink()) {
      throw new Error(`Refusing to read symlink path: ${path}`);
    }

    if (!isInsideDirectory(repoRootRealPath, realpathSync(resolvedPath))) {
      throw new Error(`Refusing to read path outside repository: ${path}`);
    }

    return readFileSync(resolvedPath, 'utf8');
  }

  function isInsideDirectory(root: string, path: string): boolean {
    const relativePath = relative(root, path);
    return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath);
  }

  function buildBaseRef(): string {
    const explicitBase = normalizeGitRef(
      process.env.DOC_DIFF_BASE ?? opts.registry.config.diff?.base
    );
    if (explicitBase) return validateGitRef('DOC_DIFF_BASE', explicitBase);

    for (const [name, ref] of [
      ['CI_MERGE_REQUEST_DIFF_BASE_SHA', process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA],
      ['CI_COMMIT_BEFORE_SHA', process.env.CI_COMMIT_BEFORE_SHA]
    ] as const) {
      const candidate = normalizeGitRef(ref);
      if (candidate && isUsableGitRef(candidate)) {
        return validateGitRef(name, candidate);
      }
    }

    return 'HEAD~1';
  }

  function buildHeadRef(): string {
    return validateGitRef('DOC_DIFF_HEAD', rawBuildHeadRef());
  }

  function rawBuildBaseRef(): string {
    return (
      process.env.DOC_DIFF_BASE ??
      opts.registry.config.diff?.base ??
      process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA ??
      process.env.CI_COMMIT_BEFORE_SHA ??
      'HEAD~1'
    );
  }

  function rawBuildHeadRef(): string {
    return process.env.DOC_DIFF_HEAD ?? opts.registry.config.diff?.head ?? 'HEAD';
  }

  function validateGitRef(name: string, ref: string): string {
    if (ref.startsWith('-')) {
      throw new Error(`${name} must not start with '-'`);
    }
    return ref;
  }

  function normalizeGitRef(ref: string | undefined): string | null {
    const trimmed = ref?.trim();
    if (!trimmed || /^0+$/.test(trimmed)) return null;
    return trimmed;
  }

  function isUsableGitRef(ref: string): boolean {
    if (ref.startsWith('-')) return false;

    try {
      gitListOutput(['rev-parse', '--verify', `${ref}^{commit}`]);
      return true;
    } catch {
      return false;
    }
  }

  function lstatOrNull(path: string) {
    try {
      return lstatSync(path);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  function emptyReport(options: {
    mode: DocDiffMode;
    baseRef: string;
    headRef: string;
    warnings: string[];
  }): DocDiffReport {
    return {
      mode: options.mode,
      baseRef: options.baseRef,
      headRef: options.headRef,
      generatedAt: new Date().toISOString(),
      timeline: [],
      selectedPointId: null,
      selectedFilePath: null,
      files: [],
      totalAddedLines: 0,
      totalRemovedLines: 0,
      warnings: options.warnings
    };
  }

  function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  return { loadDocDiffReport, loadDocDiffTimelineReport, loadDocDiffRevision };
};
