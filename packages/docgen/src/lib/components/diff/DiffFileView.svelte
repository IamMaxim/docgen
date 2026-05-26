<script lang="ts">
	import type { BlockRun } from '$lib/diff/tree.ts';
	import type { DocDiffFile, DocDiffFileStatus } from '$lib/diff/types.ts';

	let {
		file,
		revisionLoaded,
		blockRuns,
		revisionError
	}: {
		file: DocDiffFile | null;
		revisionLoaded: boolean;
		blockRuns: BlockRun[];
		revisionError: string | null;
	} = $props();

	function fileBaseName(path: string) {
		const i = path.lastIndexOf('/');
		return i === -1 ? path : path.slice(i + 1);
	}
	function fileDirName(path: string) {
		const i = path.lastIndexOf('/');
		return i === -1 ? '' : path.slice(0, i + 1);
	}
	function statusGlyph(s: DocDiffFileStatus) {
		return s === 'added' ? 'A' : s === 'modified' ? 'M' : s === 'deleted' ? 'D' : 'R';
	}
</script>

<main class="selected-file">
	{#if file}
		<header class="file-header">
			<span class="pill pill--{file.status}" title={file.status}>
				{statusGlyph(file.status)}
			</span>
			{#if file.oldPath && file.oldPath !== file.path}
				<span class="path">
					<span class="path-dir">{fileDirName(file.oldPath)}</span><span class="path-base"
						>{fileBaseName(file.oldPath)}</span
					>
					<span class="arrow" aria-hidden="true">→</span>
					<span class="path-dir">{fileDirName(file.path)}</span><span class="path-base"
						>{fileBaseName(file.path)}</span
					>
				</span>
			{:else}
				<span class="path">
					<span class="path-dir">{fileDirName(file.path)}</span><span class="path-base"
						>{fileBaseName(file.path)}</span
					>
				</span>
			{/if}
			<span class="spacer"></span>
			<span class="counts">
				<span class="added">+{file.addedLines}</span>
				<span class="removed">−{file.removedLines}</span>
			</span>
		</header>

		{#if revisionLoaded}
			{#if blockRuns.length === 0}
				<section class="empty-state">
					<p>No paragraph-level changes in this file.</p>
				</section>
			{:else}
				<div class="rendered-blocks doc-shell doc-content">
					{#each blockRuns as run, ri (ri)}
						<div class={`diff-run diff-run--${run.kind}`}>
							<div class="diff-gutter" aria-hidden="true">
								<span class="gutter-glyph">
									{run.kind === 'added' ? '+' : run.kind === 'removed' ? '−' : '·'}
								</span>
							</div>
							<div class="diff-body">
								{#each run.blocks as block}
									<section class="diff-block" aria-label={run.kind}>
										{@html block.html}
									</section>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{:else if revisionError}
			<section class="empty-state">
				<p>Failed to load revision diff: {revisionError}</p>
			</section>
		{:else}
			<div class="skel skel--blocks" aria-hidden="true">
				<div></div>
				<div></div>
				<div></div>
			</div>
		{/if}
	{:else}
		<section class="empty-state">
			<p>Select a file from the sidebar.</p>
		</section>
	{/if}

	<p class="kbd-hint">
		<kbd>j</kbd>/<kbd>k</kbd> file · <kbd>J</kbd>/<kbd>K</kbd> commit ·
		<kbd>[</kbd>/<kbd>]</kbd> jump block
	</p>
</main>

<style>
	.selected-file {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 100%;
		min-width: 0;
		padding: 8px 16px 32px;
	}

	.file-header {
		display: flex;
		gap: 8px;
		align-items: center;
		padding: 5px 10px;
		border: 1px solid var(--border);
		border-radius: var(--r-sm);
		background: var(--surface);
		min-width: 0;
		position: sticky;
		top: calc(var(--topbar-height) + 8px);
		z-index: 2;
	}
	.file-header .path {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 2px;
		font-family: var(--font-mono);
		font-size: 12px;
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.file-header .path-dir {
		color: var(--text-mute);
	}
	.file-header .path-base {
		color: var(--text);
		font-weight: 500;
	}
	.file-header .arrow {
		margin: 0 6px;
		color: var(--text-mute);
	}
	.file-header .spacer {
		flex: 1;
	}
	.file-header .counts {
		display: flex;
		gap: 8px;
		font-family: var(--font-mono);
		font-size: 11px;
		white-space: nowrap;
	}

	.rendered-blocks {
		display: flex;
		flex-direction: column;
		gap: 1px;
		width: 100%;
		min-width: 0;
		max-width: none;
		font-size: 14px;
	}

	.diff-run {
		display: grid;
		grid-template-columns: var(--gutter-w) minmax(0, 1fr);
		min-width: 0;
		border-radius: 3px;
	}
	.diff-run--added {
		background: var(--diff-added-bg);
	}
	.diff-run--removed {
		background: var(--diff-removed-bg);
	}
	.diff-run--context {
		background: transparent;
	}
	.diff-gutter {
		display: flex;
		justify-content: center;
		padding-top: 4px;
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 600;
		border-radius: 3px 0 0 3px;
	}
	.diff-run--added .diff-gutter {
		color: var(--diff-added);
		background: oklch(0.76 0.12 145 / 0.2);
	}
	.diff-run--removed .diff-gutter {
		color: var(--diff-removed);
		background: oklch(0.67 0.16 25 / 0.22);
	}
	.diff-body {
		min-width: 0;
		padding: 2px 0;
	}
	.diff-block {
		padding: 2px 12px;
		min-width: 0;
	}
	.diff-block :global(:first-child) {
		margin-top: 0;
	}
	.diff-block :global(:last-child) {
		margin-bottom: 0;
	}
	.diff-block :global(pre) {
		overflow-x: auto;
	}
	.diff-block :global(.table-wrap),
	.diff-block :global(table) {
		max-width: 100%;
		overflow-x: auto;
		display: block;
	}
	.diff-block :global(table) {
		border-collapse: collapse;
	}
</style>
