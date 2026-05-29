import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { copyTemplate, replaceTokens, renameDotfile } from '../lib/copy.mjs';
import { listTemplates, resolveTemplatesRoot } from '../lib/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const mkTmp = () => mkdtempSync(join(tmpdir(), 'create-docgen-'));

test('replaceTokens substitutes {{x}} but leaves unknown tokens', () => {
	assert.equal(replaceTokens('Hello {{name}}!', { name: 'World' }), 'Hello World!');
	assert.equal(replaceTokens('keep {{unknown}}', {}), 'keep {{unknown}}');
});

test('renameDotfile maps known underscore-dotfiles', () => {
	assert.equal(renameDotfile('_gitignore'), '.gitignore');
	assert.equal(renameDotfile('_npmrc'), '.npmrc');
	assert.equal(renameDotfile('package.json'), 'package.json');
});

test('templates manifests are well-formed', () => {
	const root = resolveTemplatesRoot();
	const templates = listTemplates(root);
	assert.ok(templates.length >= 1);
	for (const t of templates) {
		assert.equal(typeof t.name, 'string');
		assert.equal(typeof t.description, 'string');
	}
});

test('copyTemplate scaffolds minimal template with token substitution', () => {
	const root = resolveTemplatesRoot();
	const templateDir = join(root, 'minimal');
	const manifest = JSON.parse(readFileSync(join(templateDir, 'template.json'), 'utf8'));
	const target = mkTmp();

	copyTemplate({
		templateDir,
		target,
		tokens: { title: 'My Site', description: 'Hello.', projectName: 'my-site' },
		manifest,
		enabledFeatures: new Set(['prettier'])
	});

	// Core files
	assert.ok(existsSync(join(target, 'package.json')));
	assert.ok(existsSync(join(target, 'svelte.config.js')));
	assert.ok(existsSync(join(target, 'src/routes/+layout.svelte')));

	// Dotfile rename
	assert.ok(existsSync(join(target, '.gitignore')), '_gitignore -> .gitignore');
	assert.ok(!existsSync(join(target, '_gitignore')));

	// Token substitution
	const config = JSON.parse(readFileSync(join(target, 'docs-site.config.json'), 'utf8'));
	assert.equal(config.siteTitle, 'My Site');
	assert.equal(config.description, 'Hello.');
	const appHtml = readFileSync(join(target, 'src/app.html'), 'utf8');
	assert.ok(appHtml.includes('<title>My Site</title>'));
	assert.ok(appHtml.includes('Hello.'));

	// Project name lands in package.json
	const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
	assert.equal(pkg.name, 'my-site');
	assert.equal(pkg.dependencies['@iammaxim/docgen'], '^0.1.4');

	// Prettier enabled -> .prettierrc copied
	assert.ok(existsSync(join(target, '.prettierrc')), 'prettier feature copies .prettierrc');

	// ESLint NOT enabled -> eslint.config.js not copied
	assert.ok(!existsSync(join(target, 'eslint.config.js')), 'eslint not enabled');

	// Mermaid sample NOT included (feature off)
	assert.ok(!existsSync(join(target, 'docs/mermaid-example.md')));

	// template.json never copied
	assert.ok(!existsSync(join(target, 'template.json')));

	rmSync(target, { recursive: true });
});

test('copyTemplate includes feature files and merges devDeps when feature enabled', () => {
	const root = resolveTemplatesRoot();
	const templateDir = join(root, 'minimal');
	const manifest = JSON.parse(readFileSync(join(templateDir, 'template.json'), 'utf8'));
	const target = mkTmp();

	copyTemplate({
		templateDir,
		target,
		tokens: { title: 'T', description: 'D', projectName: 'p' },
		manifest,
		enabledFeatures: new Set(['eslint', 'mermaid'])
	});

	assert.ok(existsSync(join(target, 'eslint.config.js')));
	assert.ok(existsSync(join(target, 'docs/mermaid-example.md')));

	const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
	assert.ok(pkg.devDependencies.eslint, 'eslint merged into devDependencies');
	assert.ok(pkg.devDependencies.mermaid, 'mermaid merged into devDependencies');
	assert.match(pkg.scripts.lint, /eslint/, 'lint script overridden by eslint feature');

	rmSync(target, { recursive: true });
});

test('starter template scaffolds with sample docs', () => {
	const root = resolveTemplatesRoot();
	const templateDir = join(root, 'starter');
	const manifest = JSON.parse(readFileSync(join(templateDir, 'template.json'), 'utf8'));
	const target = mkTmp();

	copyTemplate({
		templateDir,
		target,
		tokens: { title: 'S', description: 'D', projectName: 's' },
		manifest,
		enabledFeatures: new Set()
	});

	const docs = readdirSync(join(target, 'docs'));
	assert.ok(docs.includes('index.md'));
	assert.ok(docs.includes('getting-started.md'));
	assert.ok(docs.includes('structure.md'));

	rmSync(target, { recursive: true });
});
