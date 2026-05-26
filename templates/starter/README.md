# {{title}}

{{description}}

Built with [@iammaxim/docgen](https://github.com/iammaxim/docgen).

## Develop

```sh
npm install
npm run dev
```

Open <http://localhost:5173>.

## Write docs

Add Markdown (`.md`) or MDsveX (`.svx`) files under `docs/`.
They appear in the sidebar and at `/docs/<slug>` automatically.

Wiki-style `[[links]]` resolve to other documents.

## Build

```sh
npm run build
```

Static output lands in `build/`.
Deploy anywhere that serves static files (GitHub Pages, Netlify, S3, etc.).
