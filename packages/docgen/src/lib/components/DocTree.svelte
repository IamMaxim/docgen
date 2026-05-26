<script lang="ts">
	import type { DocTreeNode } from '$lib/registry.ts';

	const LEFT_PAD = 0;
	const INDENT_STEP = 16;

	type TreeRow =
		| {
				kind: 'group';
				id: string;
				label: string;
				depth: number;
				expanded: boolean;
				hasChildren: boolean;
				path?: string;
		  }
		| { kind: 'doc'; id: string; label: string; depth: number; path: string };

	let {
		nodes = [],
		currentPath = '/',
		linkBase = ''
	}: { nodes: DocTreeNode[]; currentPath?: string; linkBase?: string } = $props();

	const normalize = (path?: string) => {
		if (!path) return '';
		const normalized = path === '/' ? '/' : path.replace(/\/+$/, '');
		// Encode each path segment, except the initial slash
		return normalized
			.split('/')
			.map((seg, idx) => (idx === 0 && seg === '' ? '' : encodeURIComponent(seg)))
			.join('/');
	};

	const collectGroupIds = (source: DocTreeNode[]): Set<string> => {
		const ids = new Set<string>();
		const stack = [...source];
		while (stack.length) {
			const node = stack.pop();
			if (!node) continue;
			if (node.type === 'group') {
				ids.add(node.id);
				if (node.children) {
					stack.push(...node.children);
				}
			}
		}
		return ids;
	};

	const depthSequence = (depth: number) => Array.from({ length: depth }, (_, idx) => idx);

	const findGroupTrail = (
		source: DocTreeNode[],
		targetPath: string,
		parents: string[] = []
	): string[] | null => {
		for (const node of source) {
			if (node.type === 'doc') {
				if (normalize(node.path) === targetPath) {
					return parents.length ? [...parents] : null;
				}
				continue;
			}

			if (!node.children?.length) continue;

			const result = findGroupTrail(node.children, targetPath, [...parents, node.id]);
			if (result) return result;
		}
		return null;
	};

	let knownGroups = collectGroupIds(nodes);
	let expandedGroups = $state(new Set(knownGroups));

	const flatten = (source: DocTreeNode[], expanded: ReadonlySet<string>, depth = 0): TreeRow[] =>
		source.flatMap((node) => {
			if (node.type === 'group') {
				const childNodes = node.children ?? [];
				const isExpanded = expanded.has(node.id);
				const header: TreeRow = {
					kind: 'group',
					id: node.id,
					label: node.label,
					depth,
					expanded: isExpanded,
					hasChildren: childNodes.length > 0,
					path: node.path
				};
				const children =
					isExpanded && childNodes.length ? flatten(childNodes, expanded, depth + 1) : [];
				return [header, ...children];
			}

			return [
				{
					kind: 'doc',
					id: node.id,
					label: node.label,
					path: node.path ?? '/',
					depth
				}
			];
		});

	const rows = $derived(flatten(nodes, expandedGroups));
	const activePath = $derived(currentPath);

	const indent = (depth: number) => `calc(${LEFT_PAD}px + ${depth} * ${INDENT_STEP}px)`;

	const toggleGroup = (id: string) => {
		const next = new Set(expandedGroups);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		expandedGroups = next;
	};

	$effect(() => {
		const currentGroups = collectGroupIds(nodes);
		const next = new Set(expandedGroups);
		let changed = false;

		for (const id of next) {
			if (!currentGroups.has(id)) {
				next.delete(id);
				changed = true;
			}
		}

		for (const id of currentGroups) {
			if (!knownGroups.has(id)) {
				next.add(id);
				changed = true;
			}
		}

		if (changed) {
			expandedGroups = next;
		}

		knownGroups = currentGroups;
	});

	$effect(() => {
		const trail = findGroupTrail(nodes, activePath);
		if (!trail?.length) return;
		const next = new Set(expandedGroups);
		let changed = false;
		for (const id of trail) {
			if (!next.has(id)) {
				next.add(id);
				changed = true;
			}
		}
		if (changed) {
			expandedGroups = next;
		}
	});
</script>

{#if rows.length}
	<div class="doc-tree">
		{#each rows as row (row.id + row.kind)}
			<div class="tree-row" data-kind={row.kind} style={`--indent:${indent(row.depth)};`}>
				{#if row.depth}
					<span class="indent-guides" aria-hidden="true">
						{#each depthSequence(row.depth) as _, idx}
							<span style={`left:${LEFT_PAD + idx * INDENT_STEP}px`}></span>
						{/each}
					</span>
				{/if}

				{#if row.kind === 'group'}
					<div
						class="group-container"
						class:active={row.path ? normalize(row.path) === activePath : false}
					>
						<button
							type="button"
							class="chevron-button"
							onclick={() => toggleGroup(row.id)}
							aria-expanded={row.hasChildren ? (row.expanded ? 'true' : 'false') : undefined}
							disabled={!row.hasChildren}
							aria-label={row.hasChildren ? (row.expanded ? 'Collapse' : 'Expand') : undefined}
						>
							<svg
								viewBox="0 0 12 12"
								role="presentation"
								aria-hidden="true"
								class="chevron"
								class:expanded={row.expanded && row.hasChildren}
							>
								<path d="M4 3l4 3-4 3" />
							</svg>
						</button>
						{#if row.path}
							<a href={`${linkBase}${normalize(row.path)}`} class="group-label">
								{row.label}
							</a>
						{:else}
							<button
								type="button"
								class="group-label group-label-button"
								onclick={() => toggleGroup(row.id)}
								disabled={!row.hasChildren}
							>
								{row.label}
							</button>
						{/if}
					</div>
				{:else}
					<div class="row-interactive" class:active={normalize(row.path) === activePath}>
						<span class="file-spacer"></span>
						<a href={`${linkBase}${normalize(row.path)}`} class="row-interactive-label">{row.label}</a>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.doc-tree {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.tree-row {
		position: relative;
		min-height: 26px;
	}

	.indent-guides {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.indent-guides span {
		position: absolute;
		top: 0px;
		bottom: 0px;
		margin-left: 8px;
		width: 1px;
		background: var(--hairline);
		opacity: 0.4;
	}

	.group-container {
		display: flex;
		align-items: center;
		width: 100%;
		min-height: 26px;
		padding-left: var(--indent);
		padding-right: 8px;
		box-sizing: border-box;
		border: 1px solid transparent;
		border-radius: var(--r-sm);
	}

	.group-container.active {
		background: var(--surface-hi);
		color: var(--text);
	}

	.chevron-button {
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		flex-shrink: 0;
		color: var(--text-mute);
	}

	.file-spacer {
		width: 16px;
		flex-shrink: 0;
	}

	.chevron-button:disabled {
		cursor: default;
		opacity: 0.65;
	}

	.group-label {
		flex: 1;
		color: var(--text-dim);
		/* min-height: 26px; */
		text-decoration: none;
		font-size: 13.5px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.group-label-button {
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
		width: 100%;
		color: inherit;
	}

	.group-label-button:disabled {
		cursor: default;
		opacity: 0.65;
	}

	.row-interactive {
		display: flex;
		align-items: center;
		width: 100%;
		min-height: 26px;
		padding-left: var(--indent);
		padding-right: 8px;
		box-sizing: border-box;
		border-radius: var(--r-sm);
		border: 1px solid transparent;
		/* gap: 6px; */
	}

	.row-interactive-label {
		flex: 1;
		/* min-height: 26px; */
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.chevron {
		width: 10px;
		height: 10px;
		stroke: currentColor;
		stroke-width: 1.5;
		fill: none;
		flex-shrink: 0;
		transform: rotate(0deg);
		transition: transform 120ms ease;
		opacity: 0.8;
	}

	.chevron.expanded {
		transform: rotate(90deg);
	}

	.doc-tree a {
		color: var(--text-dim);
		text-decoration: none;
		font-size: 13.5px;
	}

	.doc-tree .row-interactive.active {
		position: relative;
		background: var(--surface-hi);
	}

	.doc-tree .row-interactive.active::before {
		content: '';
		position: absolute;
		left: -14px;
		top: 6px;
		bottom: 6px;
		width: 2px;
		border-radius: 2px;
		background: var(--accent);
	}

	.doc-tree .row-interactive.active a,
	.group-container.active a {
		color: var(--text);
	}

	.group-container:hover,
	.row-interactive:hover {
		background: var(--surface);
	}

	.row-interactive:focus-visible {
		outline: 1px solid var(--accent);
		outline-offset: 2px;
	}
</style>
