<script lang="ts">
	import { formatDate } from '$lib/diff/timeline-groups.ts';
	import type { DocDiffTimelinePoint } from '$lib/diff/types.ts';

	let {
		point,
		timelineOpen,
		onToggleTimeline
	}: {
		point: DocDiffTimelinePoint;
		timelineOpen: boolean;
		onToggleTimeline: () => void;
	} = $props();

	const title = $derived(point.kind === 'worktree' ? 'Uncommitted changes' : point.subject);
	const hash = $derived(point.kind === 'worktree' ? 'worktree' : point.shortHash);
	const dateLabel = $derived(formatDate(point.date));
</script>

<header class="commit-header">
	<h1 {title}>{title}</h1>
	<p class="commit-meta">
		<span class="hash">{hash}</span>
		{#if dateLabel}
			<span class="sep" aria-hidden="true">·</span>
			<span>{dateLabel}</span>
		{/if}
		{#if point.author}
			<span class="sep" aria-hidden="true">·</span>
			<span>{point.author}</span>
		{/if}
		<span class="sep" aria-hidden="true">·</span>
		<span>{point.files.length} files</span>
		<span class="added">+{point.totalAddedLines}</span>
		<span class="removed">−{point.totalRemovedLines}</span>
	</p>
	<button
		class="timeline-toggle"
		type="button"
		onclick={onToggleTimeline}
		aria-expanded={timelineOpen}
	>
		{timelineOpen ? 'Hide commits' : 'Switch commit'}
	</button>
</header>

<style>
	.commit-header {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-rows: auto auto;
		column-gap: 12px;
		row-gap: 2px;
		align-items: center;
		padding: 6px 10px;
		border: 1px solid var(--border);
		border-top: none;
		border-radius: var(--r-sm);
		background: var(--surface);
	}
	.commit-header h1 {
		margin: 0;
		font-size: 14px;
		font-weight: 500;
		letter-spacing: -0.005em;
		line-height: 1.25;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.commit-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin: 0;
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 11px;
		grid-column: 1;
	}
	.commit-meta .hash {
		color: var(--accent);
	}
	.commit-meta .sep {
		opacity: 0.5;
	}
	.timeline-toggle {
		grid-row: 1 / span 2;
		grid-column: 2;
		justify-self: end;
		align-self: center;
		padding: 6px 10px;
		border: 1px solid var(--border);
		border-radius: var(--r-sm);
		background: var(--surface);
		color: var(--text-dim);
		font-size: 12px;
		cursor: pointer;
	}
	.timeline-toggle:hover {
		border-color: var(--accent-line);
		color: var(--text);
	}

	@media (min-width: 1101px) {
		.timeline-toggle {
			display: none;
		}
	}

	@media (max-width: 800px) {
		.commit-header h1 {
			font-size: 22px;
		}
	}
</style>
