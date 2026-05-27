#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distLinkGraph = resolve(__dirname, '../dist/cli/link-graph.mjs');
const srcLinkGraph = resolve(__dirname, '../src/lib/cli/link-graph.mjs');

const target = existsSync(distLinkGraph) ? distLinkGraph : srcLinkGraph;
const { runLinkGraph } = await import(target);

const [, , command, ...args] = process.argv;

switch (command) {
	case 'link-graph':
		await runLinkGraph(args);
		break;
	default:
		console.error('Usage: docgen link-graph [--config <path>] [--out <path>]');
		process.exit(1);
}
