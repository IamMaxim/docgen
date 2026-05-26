// Link-graph CLI: scans a docs directory and writes a link-graph.json.
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_OUTPUT_REL = './src/lib/link-graph.json';
const DEFAULT_CONFIG = './docs-site.config.json';

const WIKI_LINK = /\[\[([^|\]]+?)(?:\|[^\]]+?)?\]\]/g;
const MARKDOWN_LINK = /!?\[[^\]]*?\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function parseArgs(argv) {
	const args = { config: DEFAULT_CONFIG, out: DEFAULT_OUTPUT_REL };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--config') args.config = argv[++i];
		else if (a === '--out') args.out = argv[++i];
		else if (a === '--help' || a === '-h') {
			console.log('Usage: docgen link-graph [--config <path>] [--out <path>]');
			process.exit(0);
		}
	}
	return args;
}

function makeIsIgnored(ignoreRules) {
	return function isDocPathIgnored(relativeFromDocsRoot) {
		const norm = String(relativeFromDocsRoot).replace(/\\/g, '/').replace(/^\/+/, '');
		for (const rule of ignoreRules) {
			const r = String(rule).replace(/\\/g, '/').replace(/^\/+/, '');
			if (!r) continue;
			if (r.endsWith('/**')) {
				const prefix = r.slice(0, -3).replace(/\/+$/, '');
				if (norm === prefix || norm.startsWith(`${prefix}/`)) return true;
			} else if (norm === r || norm.startsWith(`${r}/`)) {
				return true;
			}
		}
		return false;
	};
}

function makeDocRelToCanonical(DOC_URL_PREFIX) {
	return function docRelToCanonical(relNoExt) {
		const norm = relNoExt.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
		if (norm === '' || norm === 'index') {
			return { id: 'index', path: DOC_URL_PREFIX };
		}
		const parts = norm.split('/').filter(Boolean);
		const isFolderIndex = parts.length > 0 && parts[parts.length - 1] === 'index';
		const routeParts = isFolderIndex && parts.length > 1 ? parts.slice(0, -1) : parts;
		const id = routeParts.length ? routeParts.join('/') : 'index';
		const pathName =
			routeParts.length === 0 ? DOC_URL_PREFIX : `${DOC_URL_PREFIX}/${routeParts.join('/')}`;
		return { id, path: pathName };
	};
}

function* walkDocs(dir, isDocPathIgnored, basePath = '') {
	let entries;
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return;
	}

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		const relPath = basePath ? `${basePath}/${entry.name}` : entry.name;
		if (isDocPathIgnored(relPath)) continue;

		if (entry.isDirectory()) {
			yield* walkDocs(fullPath, isDocPathIgnored, relPath);
		} else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.svx'))) {
			yield { fullPath, relPath };
		}
	}
}

function buildPathMap(files, docRelToCanonical) {
	const map = new Map();
	for (const file of files) {
		const relNoExt = file.relPath.replace(/\.(md|svx)$/i, '');
		const fileNameNoExt = path.basename(relNoExt);
		const { id, path: pathName } = docRelToCanonical(relNoExt);

		map.set(id, pathName);
		map.set(pathName, pathName);
		map.set(pathName.replace(/^\/+/, ''), pathName);
		map.set(relNoExt, pathName);
		map.set(`/${relNoExt}`, pathName);

		if (!map.has(fileNameNoExt)) {
			map.set(fileNameNoExt, pathName);
		}

		if (fileNameNoExt === 'index') {
			const dirName = path.dirname(relNoExt).replace(/^\.$/, '');
			if (dirName) {
				map.set(dirName, pathName);
				const lastSegment = dirName.split('/').filter(Boolean).at(-1);
				if (lastSegment && !map.has(lastSegment)) {
					map.set(lastSegment, pathName);
				}
			}
		}
	}
	return map;
}

function stripHashAndQuery(value) {
	return value.split('#')[0]?.split('?')[0] ?? value;
}

function makeNormalizeDocHref(DOC_URL_PREFIX) {
	return function normalizeDocHref(value) {
		const clean = stripHashAndQuery(value.trim()).replace(/\/+$/, '') || DOC_URL_PREFIX;
		if (clean === DOC_URL_PREFIX || clean.startsWith(`${DOC_URL_PREFIX}/`)) return clean;
		return null;
	};
}

function slugify(value) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9/]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/\/+/g, '/');
}

function makeResolveTarget(pathMap, normalizeDocHref) {
	return function resolveTarget(targetRaw) {
		const trimmed = stripHashAndQuery(targetRaw.trim());
		if (!trimmed) return null;

		const directDocHref = normalizeDocHref(trimmed);
		if (directDocHref) {
			return (
				pathMap.get(directDocHref) ?? pathMap.get(directDocHref.replace(/^\/+/, '')) ?? null
			);
		}

		const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
		const withoutSlash = trimmed.replace(/^\/+/, '');
		const candidates = [
			trimmed,
			withSlash,
			withoutSlash,
			trimmed.replace(/^docs\/?/i, ''),
			`docs/${withoutSlash.replace(/^docs\/?/i, '')}`,
			slugify(trimmed)
		];

		for (const candidate of candidates) {
			const canonical = pathMap.get(candidate);
			if (canonical) return canonical;
		}
		return null;
	};
}

function collectOutgoingLinks(source, resolveTarget) {
	const outgoing = new Set();
	const raw = fs.readFileSync(source.fullPath, 'utf8');

	for (const match of raw.matchAll(WIKI_LINK)) {
		const target = resolveTarget(match[1] ?? '');
		if (target && target !== source.pathName) outgoing.add(target);
	}

	for (const match of raw.matchAll(MARKDOWN_LINK)) {
		const targetRaw = match[1] ?? '';
		if (/^[a-z][a-z0-9+.-]*:/i.test(targetRaw) || targetRaw.startsWith('#')) continue;
		const target = resolveTarget(targetRaw);
		if (target && target !== source.pathName) outgoing.add(target);
	}

	return Array.from(outgoing).sort();
}

export async function runLinkGraph(argv) {
	const args = parseArgs(argv);
	const cwd = process.cwd();
	const configPath = path.resolve(cwd, args.config);
	const outputPath = path.resolve(cwd, args.out);

	if (!fs.existsSync(configPath)) {
		console.error(`docgen link-graph: config not found at ${configPath}`);
		process.exit(1);
	}

	const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
	const docsDir = path.resolve(path.dirname(configPath), config.docsDir);
	const DOC_URL_PREFIX = config.baseUrl ?? '/docs';
	const ignore = Array.isArray(config.ignore) ? config.ignore : [];

	console.log(`docgen link-graph: config=${configPath}`);
	console.log(`docgen link-graph: docsDir=${docsDir}`);
	console.log(`docgen link-graph: out=${outputPath}`);

	const isDocPathIgnored = makeIsIgnored(ignore);
	const docRelToCanonical = makeDocRelToCanonical(DOC_URL_PREFIX);
	const normalizeDocHref = makeNormalizeDocHref(DOC_URL_PREFIX);

	const files = Array.from(walkDocs(docsDir, isDocPathIgnored)).map((file) => ({
		...file,
		pathName: docRelToCanonical(file.relPath.replace(/\.(md|svx)$/i, '')).path
	}));
	const pathMap = buildPathMap(files, docRelToCanonical);
	const resolveTarget = makeResolveTarget(pathMap, normalizeDocHref);
	const payload = {};

	for (const file of files) {
		const outgoing = collectOutgoingLinks(file, resolveTarget);
		if (outgoing.length > 0) {
			payload[file.pathName] = { outgoing };
		}
	}

	const next = `${JSON.stringify(payload, null, 2)}\n`;
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	try {
		if (fs.readFileSync(outputPath, 'utf8') === next) {
			console.log(`docgen link-graph: ${Object.keys(payload).length} docs unchanged`);
			return;
		}
	} catch {
		// missing
	}
	fs.writeFileSync(outputPath, next, 'utf8');
	console.log(
		`docgen link-graph: wrote ${Object.keys(payload).length} docs to ${path.relative(cwd, outputPath)}`
	);
}
