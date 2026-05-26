import { json, error, type RequestHandler } from '@sveltejs/kit';
import type { Registry } from '../registry.ts';
import { makeDocDiffServer, type DocDiffServer, type MakeDocDiffServerOptions } from '../diff/git-diff.server.ts';
import { makeEditorServer, type EditorServer, type MakeEditorServerOptions } from '../editor/source.server.ts';
import { makeDocEditorPageLoad } from '../editor/page-load.server.ts';
import type { DocEditorSaveRequest } from '../editor/types.ts';

export { makeDocDiffServer, makeEditorServer, makeDocEditorPageLoad };
export type { DocDiffServer, MakeDocDiffServerOptions, EditorServer, MakeEditorServerOptions };

export { makeRootLayoutLoad, type RootLayoutLoadOptions } from '../loaders/server.ts';

export type ServerOpts = {
  registry: Registry;
  docsDir: string;
  repoRoot?: string;
  /** Pass dev=true to enable editor in this endpoint. Defaults to false (refused). */
  dev?: boolean;
};

export const makeSearchIndexEndpoint = (registry: Registry): RequestHandler =>
  () => json(registry.listSearchDocuments());

export const makeDiffTimelineEndpoint = (opts: ServerOpts): RequestHandler => {
  const srv = makeDocDiffServer({ registry: opts.registry, docsDir: opts.docsDir, repoRoot: opts.repoRoot, dev: opts.dev });
  return async () => json(await srv.loadDocDiffTimelineReport());
};

export const makeDiffRevisionEndpoint = (opts: ServerOpts) => {
  const srv = makeDocDiffServer({ registry: opts.registry, docsDir: opts.docsDir, repoRoot: opts.repoRoot, dev: opts.dev });
  const handler: RequestHandler = async ({ params }) => {
    const id = params.id as string;
    const revision = await srv.loadDocDiffRevision(id);
    if (!revision) {
      error(404, `Documentation diff revision not found: ${id}`);
    }
    return json(revision);
  };
  const entries = async () => {
    const report = await srv.loadDocDiffTimelineReport();
    return report.timeline.map((point) => ({ id: point.id }));
  };
  return { GET: handler, entries };
};

export const makeEditorSourceEndpoint = (opts: ServerOpts) => {
  const srv = makeEditorServer({ registry: opts.registry, docsDir: opts.docsDir, repoRoot: opts.repoRoot });
  const dev = opts.dev ?? false;

  const GET: RequestHandler = async ({ url }) => {
    try {
      srv.assertEditorDevMode(dev);
      return json(await srv.loadDocEditorSource(srv.slugFromQuery(url.searchParams.get('slug'))));
    } catch (err) {
      const response = srv.sourceErrorResponse(err);
      return json(response.body, { status: response.status });
    }
  };

  const PUT: RequestHandler = async ({ request }) => {
    try {
      srv.assertEditorDevMode(dev);
      const payload = (await request.json()) as DocEditorSaveRequest;
      return json(
        await srv.saveDocEditorSource(
          srv.slugFromQuery(payload.slug),
          payload.source,
          payload.diskHash
        )
      );
    } catch (err) {
      const response = srv.sourceErrorResponse(err);
      return json(response.body, { status: response.status });
    }
  };

  return { GET, PUT };
};
