<script lang="ts">
	import { base } from '$app/paths';
	import { config } from '$lib/docgen-registry';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{config.siteTitle}</title>
</svelte:head>

<section class="hero">
	<h1>{config.siteTitle}</h1>
	{#if config.description}
		<p>{config.description}</p>
	{/if}
	<p><a href="{base}{config.baseUrl}">Open documentation →</a></p>
	<p class="meta">{data.stats.totalDocs} documents</p>
</section>

<style>
	.hero {
		padding: 2rem 0;
	}
	.hero h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}
	.meta {
		color: var(--muted, #888);
		font-size: 0.875rem;
	}
</style>
