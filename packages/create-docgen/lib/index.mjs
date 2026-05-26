import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import prompts from 'prompts';
import { bold, cyan, dim, green, yellow } from 'kolorist';
import { copyTemplate } from './copy.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Templates resolution: published layout has them under packages/create-docgen/templates/
// (vendored by scripts/bundle-templates.mjs). Dev layout has them at the monorepo root.
export const resolveTemplatesRoot = () => {
	const bundled = resolve(__dirname, '..', 'templates');
	if (existsSync(bundled)) return bundled;
	const dev = resolve(__dirname, '..', '..', '..', 'templates');
	if (existsSync(dev)) return dev;
	throw new Error('Could not locate templates directory.');
};

const cancel = () => {
	const err = new Error('cancelled');
	err.code = 'CANCELLED';
	throw err;
};

const parseArgs = (argv) => {
	const args = { positional: [], flags: {} };
	for (const arg of argv) {
		if (arg.startsWith('--')) {
			const [k, v] = arg.slice(2).split('=');
			args.flags[k] = v ?? true;
		} else {
			args.positional.push(arg);
		}
	}
	return args;
};

export const listTemplates = (root) => {
	return readdirSync(root, { withFileTypes: true })
		.filter((e) => e.isDirectory())
		.map((e) => {
			const manifest = JSON.parse(readFileSync(join(root, e.name, 'template.json'), 'utf8'));
			return { name: e.name, description: manifest.description ?? '', manifest };
		});
};

const detectPackageManager = () => {
	const ua = process.env.npm_config_user_agent ?? '';
	if (ua.startsWith('pnpm')) return 'pnpm';
	if (ua.startsWith('yarn')) return 'yarn';
	if (ua.startsWith('bun')) return 'bun';
	return 'npm';
};

const ensureEmptyDir = (target) => {
	if (!existsSync(target)) return;
	const entries = readdirSync(target);
	if (entries.length === 0) return;
	throw new Error(
		`Directory ${target} is not empty. Refusing to overwrite. Use a new directory.`
	);
};

const printHeader = () => {
	console.log();
	console.log(bold(cyan('  create-docgen')) + dim('  •  scaffold a docgen wiki'));
	console.log();
};

const printNextSteps = ({ target, packageManager, installed, gitInitialized }) => {
	const cwd = process.cwd();
	const relTarget = relative(cwd, target) || '.';
	console.log();
	console.log(green('  Done.') + ' Next steps:');
	console.log();
	if (relTarget !== '.') console.log('    ' + cyan(`cd ${relTarget}`));
	if (!installed) console.log('    ' + cyan(`${packageManager} install`));
	const run = packageManager === 'npm' ? 'npm run' : packageManager;
	console.log('    ' + cyan(`${run} dev`));
	console.log();
	if (!gitInitialized) console.log(dim('  (skipped: git init)'));
	console.log(dim('  Docs live in ./docs/ — drop .md or .svx files and reload.'));
	console.log();
};

const isValidProjectName = (name) =>
	/^[a-z0-9][a-z0-9-_.]*$/i.test(name) && !name.startsWith('.');

export const main = async (argv) => {
	const args = parseArgs(argv);
	printHeader();

	const TEMPLATES_ROOT = resolveTemplatesRoot();
	const templates = listTemplates(TEMPLATES_ROOT);
	if (templates.length === 0) {
		throw new Error('No templates found.');
	}

	const initialDir = args.positional[0];

	const responses = await prompts(
		[
			{
				type: initialDir ? null : 'text',
				name: 'projectDir',
				message: 'Project directory',
				initial: 'my-docs-site',
				validate: (v) =>
					!v.trim()
						? 'Please enter a directory name'
						: !isValidProjectName(v.trim())
							? 'Use letters, numbers, dashes, dots, underscores'
							: true
			},
			{
				type: templates.length > 1 ? 'select' : null,
				name: 'template',
				message: 'Template',
				choices: templates.map((t) => ({
					title: t.name,
					description: t.description,
					value: t.name
				})),
				initial: 0
			},
			{
				type: 'text',
				name: 'title',
				message: 'Site title',
				initial: (prev, values) => values.projectDir ?? initialDir ?? 'My docs'
			},
			{
				type: 'text',
				name: 'description',
				message: 'Site description',
				initial: 'A wiki built with @iammaxim/docgen.'
			},
			{
				type: 'multiselect',
				name: 'features',
				message: 'Add features (space to toggle)',
				instructions: false,
				choices: [
					{ title: 'Prettier', value: 'prettier', selected: true },
					{ title: 'ESLint', value: 'eslint', selected: false },
					{ title: 'Sample Mermaid diagram', value: 'mermaid', selected: false },
					{ title: 'Sample KaTeX math', value: 'katex', selected: false },
					{ title: 'GitHub Pages workflow', value: 'githubPages', selected: false }
				]
			},
			{ type: 'confirm', name: 'gitInit', message: 'Initialize git repository?', initial: true },
			{ type: 'confirm', name: 'install', message: 'Install dependencies now?', initial: true }
		],
		{ onCancel: cancel }
	);

	const projectDir = initialDir ?? responses.projectDir;
	const templateName = responses.template ?? templates[0].name;
	const template = templates.find((t) => t.name === templateName);

	const target = resolve(process.cwd(), projectDir);
	ensureEmptyDir(target);
	mkdirSync(target, { recursive: true });

	const tokens = {
		title: responses.title,
		description: responses.description,
		projectName: projectDir.toLowerCase().replace(/[^a-z0-9-]/g, '-')
	};

	const enabledFeatures = new Set(responses.features ?? []);

	console.log(dim(`\n  Scaffolding ${cyan(projectDir)} using ${cyan(templateName)}...`));

	copyTemplate({
		templateDir: join(TEMPLATES_ROOT, templateName),
		target,
		tokens,
		manifest: template.manifest,
		enabledFeatures
	});

	const packageManager = detectPackageManager();
	let installed = false;
	if (responses.install) {
		console.log(dim(`  Running ${packageManager} install...`));
		const result = spawnSync(packageManager, ['install'], { cwd: target, stdio: 'inherit' });
		if (result.status !== 0) {
			console.log(yellow('  install failed — you can retry manually.'));
		} else {
			installed = true;
		}
	}

	let gitInitialized = false;
	if (responses.gitInit) {
		const result = spawnSync('git', ['init', '-q'], { cwd: target, stdio: 'ignore' });
		if (result.status === 0) {
			spawnSync('git', ['add', '.'], { cwd: target, stdio: 'ignore' });
			spawnSync('git', ['commit', '-q', '-m', 'Initial commit from create-docgen'], {
				cwd: target,
				stdio: 'ignore'
			});
			gitInitialized = true;
		}
	}

	printNextSteps({ target, packageManager, installed, gitInitialized });
};
