# @iammaxim/docgen

A reusable SvelteKit wiki: mdsvex reader, sidebar + search, diff timeline, and a dev-only editor.

Most users should scaffold a site with [`@iammaxim/create-docgen`](https://www.npmjs.com/package/@iammaxim/create-docgen):

```sh
npm create @iammaxim/docgen@latest my-docs
```

This package is the library that the generated site depends on.

## Manual install

```sh
npm install @iammaxim/docgen
```

Peer deps: `@sveltejs/kit ^2.48`, `svelte ^5.43`, `mdsvex ^0.12`, `vite ^7`.

## Subpaths

```ts
import { createRegistry, DocsSlugPage } from '@iammaxim/docgen';
import { makeRootLayoutLoad } from '@iammaxim/docgen/server';
import { defineConfig, validateConfig } from '@iammaxim/docgen/config';
import { buildMdsvexConfig } from '@iammaxim/docgen/mdsvex';
import { docPreviewDevServer } from '@iammaxim/docgen/vite';
import '@iammaxim/docgen/styles';
```

See the [master README](https://github.com/iammaxim/docgen#readme) for a higher-level overview, and the [`templates/`](https://github.com/iammaxim/docgen/tree/master/templates) folder for working scaffolds.

## License

MIT
