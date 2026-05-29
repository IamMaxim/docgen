<script lang="ts">
	import { base } from '$app/paths';
	import { Icon, HomeDocGraph } from '@iammaxim/docgen';
	import { config } from '$lib/docgen-registry';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const DOC_URL_PREFIX = config.baseUrl;
	const docs = $derived(data.homeDocs ?? []);
	const recent = $derived(docs.slice(0, 6));

	// Section cards come straight from config.sectionLabels (key -> label).
	// doc.section holds the resolved label, so we count by label.
	const sectionCards = $derived(
		Object.entries(config.sectionLabels ?? {}).map(([key, label]) => ({
			key,
			label,
			path: `${DOC_URL_PREFIX}/${key}`,
			count: docs.filter((doc) => doc.section === label).length
		}))
	);

	const commitLabel = $derived(data.commit?.shortHash ?? 'local');
</script>

<svelte:head>
	<title>{config.siteTitle}</title>
	{#if config.description}<meta name="description" content={config.description} />{/if}
</svelte:head>

<section class="home">
	<header class="home__head">
		<div>
			<h1 class="home__title">{config.siteTitle}</h1>
			{#if config.description}<p class="home__sub">{config.description}</p>{/if}
		</div>
		<div class="home__stats">
			<div class="stat">
				<div class="stat__num">{data.stats?.totalDocs ?? docs.length}</div>
				<div class="stat__lbl">pages</div>
			</div>
			<div class="stat">
				<div class="stat__num">{data.stats?.totalCallouts ?? 0}</div>
				<div class="stat__lbl">callouts</div>
			</div>
			<div class="stat">
				<div class="stat__num">{commitLabel}</div>
				<div class="stat__lbl">commit</div>
			</div>
		</div>
	</header>

	<a class="home-search-trigger" href={`${base}${DOC_URL_PREFIX}`}>
		<Icon name="search" />
		<span class="ph">Use ⌘K or / anywhere to search — or open the documentation</span>
		<span class="hint">open docs</span>
	</a>

	<div class="home__grid">
		{#if sectionCards.length > 0}
			<div>
				<div class="panel__title section-title">
					<span>Sections</span><span>{sectionCards.length}</span>
				</div>
				<div class="section-cards">
					{#each sectionCards as section (section.key)}
						<a class="section-card" href={`${base}${section.path}`}>
							<span class="section-card__title">{section.label}</span>
							<span class="section-card__meta"><b>{section.count}</b> pages</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<div class="home__right">
			<section class="panel">
				<div class="panel__title"><span>Recent</span><span>{recent.length}</span></div>
				<ul class="recent-list">
					{#each recent as doc (doc.id)}
						<li>
							<span class="when">{doc.section}</span>
							<a class="what" href={`${base}${doc.path}`}>{doc.title}</a>
						</li>
					{/each}
				</ul>
			</section>
		</div>
	</div>

	{#if config.features.graph}
		<HomeDocGraph nodes={data.graph?.nodes ?? []} edges={data.graph?.edges ?? []} />
	{/if}
</section>

<style>
	.home {
		display: grid;
		gap: 32px;
		width: min(1180px, 100%);
		padding: 28px 40px 64px;
	}
	.home__head {
		display: grid;
		grid-template-columns: 1.4fr 1fr;
		gap: 36px;
		align-items: end;
		padding-bottom: 28px;
		border-bottom: 1px solid var(--hairline, #e5e5e5);
	}
	.home__title {
		margin: 0 0 6px;
		color: var(--text);
		font-size: 44px;
		font-weight: 400;
		letter-spacing: -0.03em;
		line-height: 1.05;
	}
	.home__sub {
		max-width: 52ch;
		margin: 0;
		color: var(--text-dim);
		font-size: 15.5px;
	}
	.home__stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20px;
	}
	.stat {
		min-width: 0;
		padding-left: 14px;
		border-left: 1px solid var(--hairline, #e5e5e5);
	}
	.stat__num {
		overflow: hidden;
		color: var(--text);
		font-size: 26px;
		line-height: 1;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.stat__lbl,
	.panel__title {
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 10.5px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.stat__lbl {
		margin-top: 4px;
	}
	.home-search-trigger {
		display: flex;
		align-items: center;
		gap: 12px;
		height: 48px;
		padding: 0 14px;
		border: 1px solid var(--border);
		border-radius: var(--r-md, 8px);
		background: var(--surface);
		color: var(--text-dim);
		text-decoration: none;
	}
	.home-search-trigger:hover {
		border-color: var(--accent-line);
		background: var(--surface-hi);
		color: var(--text);
	}
	.ph {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.hint {
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
	}
	.home__grid {
		display: grid;
		grid-template-columns: 1.4fr 1fr;
		gap: 32px;
		align-items: start;
	}
	.section-title {
		display: flex;
		justify-content: space-between;
		margin: 0 0 12px 2px;
	}
	.section-cards {
		display: grid;
		gap: 12px;
	}
	.section-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 18px 20px;
		border: 1px solid var(--border);
		border-radius: var(--r-md, 8px);
		background: var(--bg-elev);
		color: inherit;
		text-decoration: none;
	}
	.section-card:hover {
		border-color: var(--border-strong);
		background: var(--surface-hi);
	}
	.section-card__title {
		color: var(--text);
		font-weight: 500;
	}
	.section-card__meta {
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 10.5px;
		text-transform: uppercase;
	}
	.section-card__meta b {
		color: var(--text-dim);
		font-family: var(--font-sans);
		font-size: 14px;
	}
	.home__right {
		display: grid;
		gap: 28px;
		align-content: start;
	}
	.panel {
		padding: 16px 18px 14px;
		border: 1px solid var(--border);
		border-radius: var(--r-md, 8px);
		background: var(--bg-elev);
	}
	.panel__title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}
	.recent-list {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.recent-list li {
		display: flex;
		align-items: baseline;
		gap: 10px;
		padding: 6px 0;
		border-bottom: 1px dashed var(--hairline, #e5e5e5);
		font-size: 13px;
	}
	.recent-list li:last-child {
		border-bottom: 0;
	}
	.when {
		width: 90px;
		flex-shrink: 0;
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 10.5px;
	}
	.what {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		color: var(--text-dim);
		text-decoration: none;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.what:hover {
		color: var(--text);
	}
	@media (max-width: 980px) {
		.home,
		.home__head,
		.home__grid {
			grid-template-columns: 1fr;
		}
	}
</style>
