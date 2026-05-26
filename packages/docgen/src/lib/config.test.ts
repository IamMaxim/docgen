import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { defineConfig, validateConfig } from "./config.ts";

describe("validateConfig", () => {
  it("accepts a full valid config", () => {
    const cfg = validateConfig({
      siteTitle: "My Wiki",
      docsDir: "../docs",
      baseUrl: "/docs",
      ignore: ["drafts"],
      sectionLabels: { dev: "Developers" },
      features: { diff: true, editor: true, search: true, graph: true },
    });
    assert.equal(cfg.siteTitle, "My Wiki");
    assert.equal(cfg.baseUrl, "/docs");
    assert.deepEqual(cfg.ignore, ["drafts"]);
  });

  it("applies defaults for optional fields", () => {
    const cfg = validateConfig({
      siteTitle: "X",
      docsDir: "../docs",
      sectionLabels: {},
      features: { diff: false, editor: false, search: true, graph: false },
    });
    assert.equal(cfg.baseUrl, "/docs");
    assert.deepEqual(cfg.ignore, []);
    assert.equal(cfg.diff?.limit, 50);
  });

  it("rejects missing siteTitle", () => {
    assert.throws(() => validateConfig({}), /siteTitle/);
  });

  it("rejects non-absolute baseUrl", () => {
    assert.throws(
      () =>
        validateConfig({
          siteTitle: "X",
          docsDir: ".",
          baseUrl: "docs",
          sectionLabels: {},
          features: { diff: false, editor: false, search: false, graph: false },
        }),
      /baseUrl/,
    );
  });

  it("rejects missing docsDir", () => {
    assert.throws(
      () =>
        validateConfig({
          siteTitle: "X",
          features: { diff: false, editor: false, search: false, graph: false },
        }),
      /docsDir/,
    );
  });

  it("rejects missing features", () => {
    assert.throws(
      () =>
        validateConfig({
          siteTitle: "X",
          docsDir: ".",
        }),
      /features/,
    );
  });

  it("rejects non-object input", () => {
    assert.throws(() => validateConfig(null), /object/);
    assert.throws(() => validateConfig("not a config"), /object/);
    assert.throws(() => validateConfig(42), /object/);
  });

  it("merges diff defaults with partial input", () => {
    const cfg = validateConfig({
      siteTitle: "X",
      docsDir: ".",
      features: { diff: true, editor: false, search: false, graph: false },
      diff: { head: "master" },
    });
    assert.equal(cfg.diff?.head, "master");
    assert.equal(cfg.diff?.limit, 50);
  });

  it("defaults search to true when omitted", () => {
    const cfg = validateConfig({
      siteTitle: "X",
      docsDir: ".",
      features: { diff: false, editor: false, graph: false },
    });
    assert.equal(cfg.features.search, true);
  });

  it("preserves explicit search=false", () => {
    const cfg = validateConfig({
      siteTitle: "X",
      docsDir: ".",
      features: { diff: false, editor: false, search: false, graph: false },
    });
    assert.equal(cfg.features.search, false);
  });
});

describe("defineConfig", () => {
  it("is the identity function for static typing", () => {
    const cfg = defineConfig({
      siteTitle: "X",
      docsDir: ".",
      baseUrl: "/docs",
      ignore: [],
      sectionLabels: {},
      features: { diff: false, editor: false, search: false, graph: false },
    });
    assert.equal(cfg.siteTitle, "X");
  });
});
