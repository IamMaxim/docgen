import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';
import {
  PREVIEW_PUBLIC_PREFIX,
  PREVIEW_RESOLVED_PREFIX,
  previewBrowserUrl
} from '../editor/preview-url.ts';
import { validateRepoDocPath, type EditorPaths } from '../editor/source-paths.server.ts';

type PreviewEntry = {
  source: string;
  extension: '.md' | '.svx';
  revision: number;
};

const readRequestBody = async (req: IncomingMessage) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
};

const jsonResponse = (res: ServerResponse, status: number, body: Record<string, unknown>) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
};

export type DocPreviewDevServerOptions = {
  editorPaths: EditorPaths;
  base?: string;
  route?: string;
};

export function docPreviewDevServer(options: DocPreviewDevServerOptions): Plugin {
  const base = options.base ?? '';
  const route = options.route ?? `${base}/docs/editor-api/preview.json`;
  const previewStore = new Map<string, PreviewEntry>();
  const normalizePreviewDocPath = (docPath: string) =>
    validateRepoDocPath(options.editorPaths, docPath).repoRelativePath;

  return {
    name: 'docgen-doc-preview-dev-server',
    apply: 'serve',
    resolveId(id) {
      const withoutQuery = id.split('?')[0] ?? id;
      if (!withoutQuery.startsWith(PREVIEW_PUBLIC_PREFIX)) return null;
      return `\0${withoutQuery}`;
    },
    load(id) {
      const withoutQuery = id.split('?')[0] ?? id;
      if (!withoutQuery.startsWith(PREVIEW_RESOLVED_PREFIX)) return null;
      const key = decodeURIComponent(withoutQuery.slice(PREVIEW_RESOLVED_PREFIX.length));
      const entry = previewStore.get(key);
      if (!entry) {
        return '# Preview source expired\n';
      }
      return entry.source;
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
        if (pathname !== route) {
          next();
          return;
        }

        if (req.method !== 'POST') {
          jsonResponse(res, 405, { error: 'Method not allowed' });
          return;
        }

        try {
          const body = JSON.parse(await readRequestBody(req)) as {
            docPath?: unknown;
            source?: unknown;
          };
          if (typeof body.docPath !== 'string' || typeof body.source !== 'string') {
            jsonResponse(res, 400, { error: 'Preview request requires docPath and source' });
            return;
          }

          const key = normalizePreviewDocPath(body.docPath);
          const extension = key.endsWith('.md') ? '.md' : '.svx';
          const previous = previewStore.get(key);
          const revision = (previous?.revision ?? 0) + 1;
          previewStore.set(key, { source: body.source, extension, revision });

          const moduleId = `${PREVIEW_PUBLIC_PREFIX}${key}`;
          const resolvedId = `${PREVIEW_RESOLVED_PREFIX}${key}`;
          const modules = [
            server.moduleGraph.getModuleById(moduleId),
            server.moduleGraph.getModuleById(resolvedId)
          ].filter((module): module is NonNullable<typeof module> => module !== undefined);
          for (const module of modules) {
            server.moduleGraph.invalidateModule(module);
          }

          jsonResponse(res, 200, {
            moduleUrl: previewBrowserUrl(base, key, revision),
            revision
          });
        } catch (error) {
          jsonResponse(res, 500, {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      });
    }
  };
}
