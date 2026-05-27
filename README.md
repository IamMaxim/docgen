# docgen

A reusable [SvelteKit](https://kit.svelte.dev) wiki you can drop into any repo:
a Markdown / [MDsveX](https://mdsvex.pngwn.io) reader with sidebar tree, full-text search,
a git-driven **diff timeline**, and an optional in-browser editor for dev mode.

## Quick start

```sh
npm create @iammaxim/docgen@latest my-docs
cd my-docs
npm run dev
```

Drop `.md` or `.svx` files under `docs/` and reload.

## Features

- **Markdown + MDsveX.** Frontmatter, wiki-style `[[links]]`, autolinked headings, callouts.
- **Math + diagrams.** KaTeX for math, Mermaid for diagrams, both opt-in.
- **Sidebar + search.** File-tree sidebar generated from `docs/`. Full-text search bound to ⌘K / Ctrl+K.
- **Backlinks + graph.** Each page lists pages that link to it; opt-in graph view.
- **Diff timeline.** Browse how documents changed over time, straight from `git log`.
- **Dev editor.** In `npm run dev`, edit any doc in-place with live preview (off in production builds).
- **Static export.** Builds to a static site. Deploy on GitHub Pages, Netlify, S3, anywhere.

## Packages

| Package | What it is |
| --- | --- |
| [`@iammaxim/docgen`](packages/docgen) | The SvelteKit library — components, loaders, mdsvex pipeline. |
| [`@iammaxim/create-docgen`](packages/create-docgen) | Scaffolds a new site (`npm create @iammaxim/docgen`). |

Templates live in [`templates/`](templates):

- `minimal` — bare scaffolding (configs + empty `docs/`)
- `starter` — minimal plus sample documents and a richer homepage

## Development

```sh
git clone https://github.com/iammaxim/docgen.git
cd docgen
npm install
npm run build -w @iammaxim/docgen
npm test
```

Tests are plain `node --test` over TypeScript via `tsx`. No bundler in the loop.

See [`docs/PUBLISHING.md`](docs/PUBLISHING.md) for the release process.
