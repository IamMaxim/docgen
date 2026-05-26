# @iammaxim/create-docgen

Scaffold a new [`@iammaxim/docgen`](../docgen) wiki.

```sh
npm create @iammaxim/docgen@latest my-docs
# or
npm create @iammaxim/docgen   # prompts for the directory
```

You'll be asked for:

- **Project directory** — where to scaffold (skipped if passed as argument)
- **Template** — `minimal` (bare) or `starter` (with sample docs)
- **Site title** and **description**
- **Features** — Prettier, ESLint, sample Mermaid, sample KaTeX, GitHub Pages workflow
- Whether to **`git init`** and **install dependencies**

After scaffolding:

```sh
cd my-docs
npm run dev
```

Drop Markdown (`.md`) or MDsveX (`.svx`) files under `docs/` and reload.

## Templates

Templates live in this monorepo at [`templates/`](https://github.com/iammaxim/docgen/tree/master/templates).

- `minimal` — package.json, configs, src/routes, empty `docs/`. Nothing else.
- `starter` — `minimal` plus three sample docs and a richer homepage.
