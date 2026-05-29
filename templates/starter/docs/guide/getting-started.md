---
title: Getting started
order: 1
description: How to add and link documents.
---

# Getting started

## Add a document

Drop a `.md` or `.svx` file anywhere under `docs/`.
Its URL is derived from the path: `docs/foo/bar.md` → `/docs/foo/bar`.

Frontmatter is optional but useful:

```yaml
---
title: My page
order: 2
description: A short summary used by search and meta tags.
---
```

## Link between pages

Use plain Markdown links (`[label](/docs/foo)`) or wiki-style:

```md
See [[getting-started]] or [[advanced/topic|this topic]].
```

The link resolver matches by slug — folders are optional.

## Run

```sh
npm run dev      # local server
npm run build    # static export to build/
```

> TODO: write your first real document here.

Next: read about the [[structure|project structure]] or the [[configuration|configuration reference]].
