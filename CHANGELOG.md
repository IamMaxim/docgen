# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This file covers both packages in the monorepo:

- [`@iammaxim/docgen`](packages/docgen)
- [`@iammaxim/create-docgen`](packages/create-docgen)

## [Unreleased]

## [0.1.1] - 2026-05-27

### Fixed

#### `@iammaxim/docgen`

- `docgen` CLI binary: fixed wrong file extension when resolving the built
  link-graph entry. `bin/cli.mjs` looked for `dist/cli/link-graph.js`, but
  `svelte-package` emits `.mjs`, so the CLI always fell back to the
  unpublished `src/` path and failed with `ERR_MODULE_NOT_FOUND` when
  installed from npm.

## [0.1.0] - 2026-05-26

Initial public release.

### Added

#### `@iammaxim/docgen`

- SvelteKit library exposing a Markdown / [MDsveX](https://mdsvex.pngwn.io) wiki:
  components, loaders, and the mdsvex pipeline.
- Sidebar file tree generated from `docs/`, full-text search bound to ⌘K / Ctrl+K.
- Frontmatter, wiki-style `[[links]]`, autolinked headings, and callouts.
- KaTeX math and Mermaid diagrams (opt-in).
- Backlinks on every page and an opt-in graph view.
- Git-driven diff timeline for browsing how documents changed over time.
- In-browser editor with live preview, enabled in `npm run dev` only.
- Static export via `@sveltejs/adapter-static`.
- Subpath exports: `/server`, `/config`, `/mdsvex`, `/vite`, `/styles`.
- `docgen` CLI binary.

#### `@iammaxim/create-docgen`

- `npm create @iammaxim/docgen@latest <dir>` scaffolder.
- Two bundled templates:
  - `minimal` — bare scaffolding (configs + empty `docs/`).
  - `starter` — minimal plus sample documents and a richer homepage.

[Unreleased]: https://github.com/iammaxim/docgen/compare/v0.1.0...HEAD
[0.1.1]: https://github.com/iammaxim/docgen/releases/tag/v0.1.1
[0.1.0]: https://github.com/iammaxim/docgen/releases/tag/v0.1.0
