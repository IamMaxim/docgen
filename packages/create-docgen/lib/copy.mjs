import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const DOTFILE_PREFIXES = ['_gitignore', '_npmrc', '_prettierrc', '_prettierignore'];

const TEXT_EXTENSIONS = new Set([
	'.md',
	'.svx',
	'.svelte',
	'.ts',
	'.js',
	'.mjs',
	'.cjs',
	'.json',
	'.html',
	'.css',
	'.yml',
	'.yaml',
	'.txt',
	''
]);

export const renameDotfile = (name) => {
	for (const prefix of DOTFILE_PREFIXES) {
		if (name === prefix) return '.' + prefix.slice(1);
	}
	return name;
};

export const replaceTokens = (content, tokens) =>
	content.replace(/\{\{(\w+)\}\}/g, (m, key) =>
		Object.prototype.hasOwnProperty.call(tokens, key) ? String(tokens[key]) : m
	);

export const isTextFile = (path) => {
	const dot = path.lastIndexOf('.');
	const ext = dot < 0 ? '' : path.slice(dot).toLowerCase();
	return TEXT_EXTENSIONS.has(ext);
};

const walk = (root) => {
	const out = [];
	const stack = [''];
	while (stack.length) {
		const rel = stack.pop();
		const abs = join(root, rel);
		for (const entry of readdirSync(abs, { withFileTypes: true })) {
			const childRel = rel ? join(rel, entry.name) : entry.name;
			if (entry.isDirectory()) {
				stack.push(childRel);
			} else {
				out.push(childRel);
			}
		}
	}
	return out;
};

export const copyTemplate = ({ templateDir, target, tokens, manifest, enabledFeatures }) => {
	const disabledFiles = new Set();
	for (const [feature, spec] of Object.entries(manifest.features ?? {})) {
		for (const file of spec.files ?? []) {
			if (!enabledFeatures.has(feature)) disabledFiles.add(file);
		}
	}

	const sourceFiles = walk(templateDir).filter(
		(f) => f !== 'template.json' && !disabledFiles.has(f.replace(/\\/g, '/'))
	);

	for (const relPath of sourceFiles) {
		const src = join(templateDir, relPath);
		const segments = relPath.split(/[/\\]/);
		segments[segments.length - 1] = renameDotfile(segments[segments.length - 1]);
		const dest = join(target, ...segments);

		mkdirSync(dirname(dest), { recursive: true });

		if (isTextFile(src)) {
			const content = readFileSync(src, 'utf8');
			writeFileSync(dest, replaceTokens(content, tokens));
		} else {
			writeFileSync(dest, readFileSync(src));
		}
	}

	const pkgPath = join(target, 'package.json');
	if (existsSync(pkgPath)) {
		const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
		for (const feature of enabledFeatures) {
			const spec = manifest.features?.[feature];
			if (!spec) continue;
			if (spec.devDependencies) {
				pkg.devDependencies = { ...(pkg.devDependencies ?? {}), ...spec.devDependencies };
			}
			if (spec.dependencies) {
				pkg.dependencies = { ...(pkg.dependencies ?? {}), ...spec.dependencies };
			}
			if (spec.scripts) {
				pkg.scripts = { ...(pkg.scripts ?? {}), ...spec.scripts };
			}
		}
		writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
	}
};
