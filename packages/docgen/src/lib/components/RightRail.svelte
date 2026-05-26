<script lang="ts">
	import { base } from '$app/paths';
	import { tick } from 'svelte';
	import type { DocMeta } from '$lib/registry.ts';

	type Heading = {
		id: string;
		label: string;
		depth: number;
	};

	type CommitInfo = {
		shortHash: string;
		author: string | null;
		date: string | null;
	} | null;

	let {
		currentDoc,
		backlinks = [],
		commit,
		buildTimestamp,
		collapsed = false
	}: {
		currentDoc?: DocMeta;
		backlinks?: DocMeta[];
		commit?: CommitInfo;
		buildTimestamp?: string | null;
		collapsed?: boolean;
	} = $props();

	let headings = $state<Heading[]>([]);
	let active = $state('');

	const formatTimestamp = (value: string | null | undefined) => {
		if (!value) return '—';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '—';
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
			date.getDate()
		).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
			date.getMinutes()
		).padStart(2, '0')}`;
	};

	const readHeadings = () => {
		const nodes = Array.from(
			document.querySelectorAll<HTMLElement>('.doc-shell h2[id], .doc-shell h3[id]')
		);
		headings = nodes.map((node) => ({
			id: node.id,
			label: node.textContent?.replace(/#$/, '').trim() ?? node.id,
			depth: node.tagName === 'H3' ? 3 : 2
		}));
		active = headings[0]?.id ?? '';
	};

	$effect(() => {
		currentDoc?.path;
		tick().then(readHeadings);
	});

	$effect(() => {
		if (!headings.length) return;
		const nodes = headings
			.map((heading) => document.getElementById(heading.id))
			.filter((node): node is HTMLElement => Boolean(node));
		if (!nodes.length) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
				if (visible[0]?.target.id) active = visible[0].target.id;
			},
			{ rootMargin: '-84px 0px -70% 0px', threshold: 0 }
		);

		nodes.forEach((node) => observer.observe(node));
		return () => observer.disconnect();
	});

	const scrollTo = (id: string) => {
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		history.replaceState(null, '', `#${id}`);
	};
</script>

{#if !collapsed}
	<aside class="right-rail" aria-label="Page navigation and information">
		{#if headings.length > 0}
			<section class="rail-section">
				<h2>On this page</h2>
				<nav class="toc">
					{#each headings as heading}
						<button
							type="button"
							class:active={active === heading.id}
							class:depth-3={heading.depth === 3}
							onclick={() => scrollTo(heading.id)}
						>
							{heading.label}
						</button>
					{/each}
				</nav>
			</section>
		{/if}

		<section class="rail-section">
			<h2>Additional info</h2>
			<div class="info-list">
				{#if currentDoc}
					<div class="info-row">
						<span>Path</span>
						<a href={`${base}${currentDoc.path}`}>{currentDoc.path}</a>
					</div>
					<div class="info-row">
						<span>Layer</span>
						<strong>{currentDoc.slug[0] ?? 'home'}</strong>
					</div>
				{/if}
				{#if commit}
					<div class="info-row">
						<span>Commit</span>
						<strong>{commit.shortHash}</strong>
					</div>
				{/if}
				<div class="info-row">
					<span>Built</span>
					<strong>{formatTimestamp(buildTimestamp)}</strong>
				</div>
			</div>
		</section>

		{#if backlinks.length > 0}
			<section class="rail-section">
				<h2>Referenced by</h2>
				<ul class="backlinks">
					{#each backlinks as doc}
						<li>
							<a href={`${base}${doc.path}`}>
								<span>{doc.title}</span>
								{#if doc.description}
									<small>{doc.description}</small>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	</aside>
{/if}

<style>
	.right-rail {
		position: sticky;
		top: calc(var(--topbar-height) + 32px);
		align-self: start;
		display: flex;
		flex-direction: column;
		gap: 26px;
		max-height: calc(100vh - var(--topbar-height) - 48px);
		overflow-y: auto;
		padding-left: 18px;
		border-left: 1px solid var(--hairline);
		font-size: 12.5px;
	}

	.rail-section {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}

	h2 {
		margin: 0;
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 10.5px;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.toc {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.toc button {
		display: block;
		width: 100%;
		padding: 4px 0;
		border: 0;
		background: transparent;
		color: var(--text-mute);
		font: inherit;
		line-height: 1.4;
		text-align: left;
	}

	.toc button:hover {
		color: var(--text-dim);
	}

	.toc button.active {
		color: var(--accent);
	}

	.toc button.depth-3 {
		padding-left: 12px;
		font-size: 12px;
	}

	.info-list {
		display: flex;
		flex-direction: column;
		gap: 7px;
	}

	.info-row {
		display: grid;
		grid-template-columns: 58px minmax(0, 1fr);
		gap: 8px;
		align-items: baseline;
		color: var(--text-mute);
	}

	.info-row a,
	.info-row strong {
		min-width: 0;
		overflow: hidden;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 10.5px;
		font-weight: 400;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.backlinks {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.backlinks a {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 6px 8px;
		border: 1px solid var(--border);
		border-radius: var(--r-sm);
		color: var(--text-dim);
		text-decoration: none;
	}

	.backlinks a:hover {
		border-color: var(--accent-line);
		color: var(--text);
	}

	.backlinks small {
		color: var(--text-mute);
		font-size: 11px;
		line-height: 1.35;
	}

	@media (max-width: 1100px) {
		.right-rail {
			position: static;
			max-height: none;
			padding: 16px;
			border: 1px solid var(--border);
			border-radius: var(--r-md);
			background: var(--bg-elev);
		}
	}
</style>
