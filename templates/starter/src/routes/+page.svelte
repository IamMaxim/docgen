<script lang="ts">
	import { base } from '$app/paths';
	import { config } from '$lib/docgen-registry';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const recent = $derived(data.homeDocs?.slice(0, 6) ?? []);
</script>

<svelte:head>
	<title>{config.siteTitle}</title>
</svelte:head>

<section class="hero">
	<h1>{config.siteTitle}</h1>
	{#if config.description}
		<p class="lede">{config.description}</p>
	{/if}
	<p>
		<a class="cta" href="{base}{config.baseUrl}">Open documentation →</a>
	</p>
</section>

<section class="recent">
	<h2>Pages</h2>
	<ul>
		{#each recent as doc (doc.id)}
			<li>
				<a href="{base}{doc.path}">{doc.title}</a>
				{#if doc.description}<span class="desc">— {doc.description}</span>{/if}
			</li>
		{/each}
	</ul>
	<p class="meta">{data.stats.totalDocs} documents · {data.stats.totalCallouts} callouts</p>
</section>

<style>
	.hero { padding: 3rem 0 2rem; }
	.hero h1 { font-size: 2.5rem; margin: 0 0 0.25rem; }
	.lede { color: var(--muted, #666); font-size: 1.125rem; margin: 0 0 1.5rem; }
	.cta {
		display: inline-block;
		padding: 0.5rem 1rem;
		border: 1px solid currentColor;
		border-radius: 6px;
		text-decoration: none;
	}
	.recent { border-top: 1px solid var(--border, #e5e5e5); padding-top: 1.5rem; }
	.recent ul { list-style: none; padding: 0; }
	.recent li { padding: 0.25rem 0; }
	.desc { color: var(--muted, #888); }
	.meta { color: var(--muted, #888); font-size: 0.875rem; margin-top: 1rem; }
</style>
