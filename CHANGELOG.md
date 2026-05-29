# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This file covers both packages in the monorepo:

- [`@iammaxim/docgen`](packages/docgen)
- [`@iammaxim/create-docgen`](packages/create-docgen)

## [Unreleased]

## [0.1.3] - 2026-05-29

### Fixed

#### `@iammaxim/create-docgen`

Both bundled templates (`minimal` and `starter`) were unusable: the sidebar
tree rendered empty, the home page crashed, search returned 404, and
`vite build` failed during prerender. All four issues are fixed.

- Sidebar tree was always empty because the layout passed `tree={...}` to
  `DocTree`, but the component's prop is `nodes`. It now passes
  `nodes`, plus `currentPath` and `linkBase` for active highlighting and
  base-path-correct links.
- Home page crashed on a literal `{{description}}` placeholder embedded in
  Svelte markup (where `{{ }}` is not a scaffolder token). The site
  description is now a config field and rendered as `{config.description}`.
- `/docs/[...slug]` entry generator called `.join('/')` on slug entries that
  were already strings, throwing during `vite build`. It now uses
  `makeDocsSlugEntries` directly.
- Added the missing `src/routes/search-index.json/+server.ts` endpoint, so
  ⌘K / Ctrl+K search works (previously every query failed with a 404).
- Templates now depend on `@iammaxim/docgen` `^0.1.3`.

#### `@iammaxim/docgen`

- Re-exported the `DocModuleMap`, `DocRawMap`, and `RawDocModule` types from
  the package root. The generated `docgen-registry.ts` imports them, so
  consumers' `svelte-check` failed with "has no exported member".
- `SearchModal`: `open` is now `$bindable` and `onClose` is optional. The
  modal closes itself, so consumers can use `bind:open` standalone.
- `Topbar`: theme, full-width, and right-rail controls are now optional —
  each renders only when its handler is supplied — so a minimal consumer can
  show just the brand and search trigger.

### Added

#### `@iammaxim/docgen`

- Optional `description` field in the docs-site config, surfaced on the home
  page and available to consumers as `config.description`.

## [0.1.2] - 2026-05-27

### Fixed

#### `@iammaxim/docgen`

- `Topbar`: respect the SvelteKit `base` path on the diff and edit links so
  they resolve correctly when the site is served from a sub-path.

#### CI

- Corrected the repository URL casing required for npm provenance and fixed
  remaining release/CI failures.

## [0.1.1] - 2026-05-27

### Fixed

#### CI
- Fixed CI linting and test failures.

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

[Unreleased]: https://github.com/iammaxim/docgen/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/iammaxim/docgen/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/iammaxim/docgen/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/iammaxim/docgen/releases/tag/v0.1.1
[0.1.0]: https://github.com/iammaxim/docgen/releases/tag/v0.1.0
