---
title: Project structure
order: 2
---

# Project structure

```
.
├── docs/                # your content (this folder)
│   ├── index.md
│   └── getting-started.md
├── src/
│   ├── lib/docgen-registry.ts   # registry wired from import.meta.glob
│   └── routes/                  # SvelteKit routes (don't usually need to edit)
├── docs-site.config.json        # site title, feature toggles
├── mdsvex.config.js             # markdown pipeline (from @iammaxim/docgen)
└── svelte.config.js / vite.config.ts
```

Almost everything you'll edit lives in `docs/` and `docs-site.config.json`.
