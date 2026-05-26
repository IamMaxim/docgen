<script lang="ts">
	import type { TreeRow } from '$lib/diff/tree.ts';
	import type { DocDiffFileStatus } from '$lib/diff/types.ts';

	let {
		rows,
		fileCount,
		totalAdded,
		totalRemoved,
		selectedPath,
		onSelectFile,
		onToggleGroup
	}: {
		rows: TreeRow[];
		fileCount: number;
		totalAdded: number;
		totalRemoved: number;
		selectedPath: string | null;
		onSelectFile: (path: string) => void;
		onToggleGroup: (id: string) => void;
	} = $props();

	function statusGlyph(s: DocDiffFileStatus) {
		return s === 'added' ? 'A' : s === 'modified' ? 'M' : s === 'deleted' ? 'D' : 'R';
	}
</script>

<aside class="file-sidebar" aria-label="Files changed">
	<div class="sidebar-head">
		<h2>Files</h2>
		<div class="sidebar-summary">
			<span>{fileCount}</span>
			<span class="added">+{totalAdded}</span>
			<span class="removed">−{totalRemoved}</span>
		</div>
	</div>
	<div class="file-tree" role="tree" aria-label="Changed files">
		{#each rows as row (row.rowType === 'file' ? row.path : row.id)}
			{#if row.rowType === 'group'}
				<button
					type="button"
					class="tree-row tree-row--group"
					role="treeitem"
					aria-expanded={!row.collapsed}
					aria-selected="false"
					style={`--depth:${row.depth};`}
					onclick={() => onToggleGroup(row.id)}
				>
					<span class="chev" aria-hidden="true">{row.collapsed ? '▸' : '▾'}</span>
					<span class="tree-label">{row.label}</span>
					<span class="tree-counts">
						<span class="count-files">{row.fileCount}</span>
						<span class="added">+{row.addedLines}</span>
						<span class="removed">−{row.removedLines}</span>
					</span>
				</button>
			{:else}
				<button
					type="button"
					class="tree-row tree-row--file"
					class:active={row.path === selectedPath}
					role="treeitem"
					aria-selected={row.path === selectedPath}
					aria-current={row.path === selectedPath ? 'true' : undefined}
					style={`--depth:${row.depth};`}
					onclick={() => onSelectFile(row.path)}
					title={row.path}
				>
					<span class="tree-label">{row.label}</span>
					<span class="tree-counts">
						{#if row.addedLines}
							<span class="added">+{row.addedLines}</span>
						{/if}
						{#if row.removedLines}
							<span class="removed">−{row.removedLines}</span>
						{/if}
						<span class="pill pill--{row.status}" title={row.status}>
							{statusGlyph(row.status)}
						</span>
					</span>
				</button>
			{/if}
		{/each}
	</div>
</aside>

<style>
	.file-sidebar {
		position: sticky;
		top: var(--topbar-height);
		height: calc(100vh - var(--topbar-height));
		max-height: calc(100vh - var(--topbar-height));
		overflow-y: auto;
		min-width: 0;
		padding: 8px 8px 16px;
	}
	.sidebar-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 6px;
		padding-bottom: 5px;
		border-bottom: 1px solid var(--hairline);
	}
	h2 {
		margin: 0;
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 9.5px;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.sidebar-summary {
		display: flex;
		gap: 6px;
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 10px;
		white-space: nowrap;
	}

	.file-tree {
		display: flex;
		flex-direction: column;
		gap: 0;
	}
	.tree-row {
		display: flex;
		gap: 6px;
		align-items: center;
		width: 100%;
		min-width: 0;
		padding: 2px 0 2px calc(var(--depth, 0) * 12px);
		border: 0;
		border-radius: 0;
		background: transparent;
		color: var(--text-dim);
		font-size: 11.5px;
		text-align: left;
		cursor: pointer;
		position: relative;
	}
	.tree-row::before {
		content: '';
		position: absolute;
		left: calc((var(--depth, 0) - 1) * 12px + 5px);
		top: 0;
		bottom: 0;
		width: 1px;
		background: var(--hairline);
		display: var(--depth-guide, none);
	}
	.tree-row[style*='--depth:1'],
	.tree-row[style*='--depth:2'],
	.tree-row[style*='--depth:3'],
	.tree-row[style*='--depth:4'] {
		--depth-guide: block;
	}
	.tree-row:hover {
		background: var(--bg-soft);
		color: var(--text);
	}
	.tree-row.active {
		background: var(--surface-hi);
		color: var(--text);
	}
	.tree-row--group {
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 10.5px;
		letter-spacing: 0.02em;
	}
	.tree-row--group .chev {
		display: inline-grid;
		place-items: center;
		width: 12px;
		font-size: 11px;
		color: var(--text-mute);
	}
	.tree-row--group .tree-label {
		display: inline-flex;
		gap: 6px;
		align-items: baseline;
	}
	.tree-row .tree-label {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.tree-row--file .tree-label {
		font-family: var(--font-mono);
		font-size: 11px;
	}
	.tree-row .tree-counts {
		display: flex;
		gap: 5px;
		align-items: center;
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 9.5px;
		white-space: nowrap;
	}
	.tree-row--group .count-files::before {
		content: '(';
	}
	.tree-row--group .count-files::after {
		content: ')';
	}

	@media (max-width: 800px) {
		.file-sidebar {
			position: static;
			max-height: none;
			padding: 12px;
			border: 1px solid var(--border);
			border-radius: var(--r-md);
			background: var(--surface);
		}
	}
</style>
