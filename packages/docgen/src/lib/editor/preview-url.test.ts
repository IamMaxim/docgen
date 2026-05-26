import assert from "node:assert/strict";
import test from "node:test";
import { previewBrowserUrl } from "./preview-url";

test("previewBrowserUrl leaves import query injection to Vite dynamic import handling", () => {
  const url = previewBrowserUrl("", "docs/dev/client.svx", 96);

  assert.equal(
    url,
    "/@id/__x00__virtual:docgen-doc-preview/docs/dev/client.svx?rev=96",
  );
  assert.equal(url.includes("?import"), false);
  assert.equal(url.includes("&import"), false);
});
