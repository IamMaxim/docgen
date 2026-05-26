// Rewrites .ts import specifiers in dist/**/*.{js,mjs,d.ts,d.mts,svelte} to .js
// after svelte-package emits source-form imports.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'dist');

const RE = /(from\s+['"])(\.[^'"]+?)\.ts(['"])/g;
const RE_DYN = /(import\(['"])(\.[^'"]+?)\.ts(['"]\))/g;

// Test files leak into dist (svelte-package has no -input-exclude); strip them.
function isTestArtifact(name) {
	return /\.(test|spec)\.(d\.)?(m?[jt]s)$/.test(name);
}

function walk(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(full);
			continue;
		}
		if (isTestArtifact(entry.name)) {
			fs.unlinkSync(full);
			continue;
		}
		if (!/\.(js|mjs|svelte|d\.ts|d\.mts|d\.cts)$/.test(entry.name)) continue;
		const original = fs.readFileSync(full, 'utf8');
		const next = original.replace(RE, '$1$2.js$3').replace(RE_DYN, '$1$2.js$3');
		if (next !== original) fs.writeFileSync(full, next, 'utf8');
	}
}

walk(root);
console.log('fix-dist-extensions: done');
