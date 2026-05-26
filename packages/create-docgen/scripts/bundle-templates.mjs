// Copy ../../templates/* into ./templates before publishing,
// so the published tarball is self-contained.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = resolve(__dirname, '..', '..', '..', 'templates');
const dest = resolve(__dirname, '..', 'templates');

if (!existsSync(source)) {
	console.error(`bundle-templates: source not found at ${source}`);
	process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(source, dest, { recursive: true });
console.log(`bundle-templates: copied templates -> ${dest}`);
