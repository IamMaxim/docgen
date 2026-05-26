<script lang="ts">
	import { formatDate } from '$lib/diff/timeline-groups.ts';
	import type { TimelineBucket } from '$lib/diff/timeline-groups.ts';
	import type { DocDiffTimelinePoint } from '$lib/diff/types.ts';

	let {
		buckets,
		selectedId,
		onSelect
	}: {
		buckets: TimelineBucket[];
		selectedId: string | null;
		onSelect: (point: DocDiffTimelinePoint) => void;
	} = $props();

	const pointTitle = (p: DocDiffTimelinePoint) =>
		p.kind === 'worktree' ? 'Uncommitted changes' : p.subject;
	const pointHash = (p: DocDiffTimelinePoint) => (p.kind === 'worktree' ? 'worktree' : p.shortHash);
</script>

<aside class="timeline-rail" aria-label="Commit timeline">
	{#each buckets as bucket}
		<h3>{bucket.label}</h3>
		<ul>
			{#each bucket.points as point}
				<li>
					<button
						type="button"
						class:active={point.id === selectedId}
						class:worktree={point.kind === 'worktree'}
						aria-current={point.id === selectedId ? 'true' : undefined}
						onclick={() => onSelect(point)}
						title={pointTitle(point)}
					>
						<span class="dot" aria-hidden="true"></span>
						<span class="copy">
							<strong>{pointTitle(point)}</strong>
							<small>
								{pointHash(point)}{formatDate(point.date) ? ` · ${formatDate(point.date)}` : ''}
							</small>
						</span>
						<span class="stat">
							<span class="added">+{point.totalAddedLines}</span>
							<span class="removed">−{point.totalRemovedLines}</span>
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/each}
</aside>

<style>
	.timeline-rail {
		position: sticky;
		top: var(--topbar-height);
		height: calc(100vh - var(--topbar-height));
		max-height: calc(100vh - var(--topbar-height));
		overflow-y: auto;
		min-width: 0;
		padding: 8px 8px 16px;
	}

	h3 {
		margin: 8px 4px 3px;
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 9.5px;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	h3:first-child {
		margin-top: 0;
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0;
	}
	button {
		display: grid;
		grid-template-columns: 8px minmax(0, 1fr) auto;
		gap: 6px;
		align-items: center;
		width: 100%;
		padding: 3px 6px;
		border: 0;
		border-radius: 3px;
		background: transparent;
		color: var(--text-dim);
		text-align: left;
		cursor: pointer;
	}
	button:hover {
		background: var(--bg-soft);
		color: var(--text);
	}
	button.active {
		background: var(--surface-hi);
		color: var(--text);
	}
	button.active .dot,
	button.worktree .dot {
		box-shadow: 0 0 0 3px var(--accent-soft);
	}
	button.worktree .dot {
		background: var(--warn);
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 999px;
		background: var(--accent);
	}
	.copy {
		display: flex;
		flex-direction: column;
		gap: 0;
		min-width: 0;
	}
	.copy strong {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 11.5px;
		font-weight: 500;
		line-height: 1.3;
	}
	.copy small {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 9.5px;
		line-height: 1.3;
	}
	.stat {
		display: flex;
		gap: 4px;
		font-family: var(--font-mono);
		font-size: 9.5px;
	}

	@media (max-width: 1100px) {
		.timeline-rail {
			position: fixed;
			top: var(--topbar-height);
			right: 0;
			bottom: 0;
			width: min(360px, 88vw);
			max-height: none;
			padding: 16px;
			border-left: 1px solid var(--border);
			background: var(--bg);
			transform: translateX(100%);
			transition: transform 0.18s ease;
			z-index: 30;
		}
		:global(.diff-workspace.timeline-open) .timeline-rail {
			transform: translateX(0);
		}
	}
</style>
