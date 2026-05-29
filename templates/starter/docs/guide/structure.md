---
title: Project structure
order: 2
---

# Project structure

```
.
├── docs/                # your content (this folder)
│   ├── index.md
│   ├── guide/           # "Guide" section (see sectionLabels)
│   │   ├── getting-started.md
│   │   └── structure.md
│   └── reference/       # "Reference" section
│       └── configuration.md
├── src/
│   ├── lib/docgen-registry.ts   # registry wired from import.meta.glob
│   └── routes/                  # SvelteKit routes (don't usually need to edit)
├── docs-site.config.json        # site title, feature toggles, sectionLabels
├── mdsvex.config.js             # markdown pipeline (from @iammaxim/docgen)
└── svelte.config.js / vite.config.ts
```

Top-level folders under `docs/` become sections on the home page when listed in
`sectionLabels`. Almost everything you'll edit lives in `docs/` and `docs-site.config.json`.

See also: [[getting-started|Getting Started]] and the [[configuration|configuration reference]].
