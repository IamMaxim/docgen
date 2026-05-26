<script lang="ts">
	import { setDocgenRegistry, Topbar, DocTree, SearchModal } from '@iammaxim/docgen';
	import '@iammaxim/docgen/styles';
	import 'katex/dist/katex.min.css';
	import { registry, config } from '$lib/docgen-registry';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	setDocgenRegistry(registry);

	let searchOpen = $state(false);
	const onKey = (event: KeyboardEvent) => {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			searchOpen = true;
		}
	};
</script>

<svelte:window onkeydown={onKey} />

<div class="app-shell">
	<Topbar siteTitle={config.siteTitle} onSearch={() => (searchOpen = true)} />
	<aside class="left">
		<DocTree tree={data.tree} />
	</aside>
	<main class="content">
		{@render children()}
	</main>
	{#if config.features.search}
		<SearchModal bind:open={searchOpen} />
	{/if}
</div>

<style>
	.app-shell {
		display: grid;
		grid-template-columns: 260px 1fr;
		grid-template-rows: auto 1fr;
		min-height: 100vh;
	}
	.app-shell :global(> :first-child) {
		grid-column: 1 / -1;
	}
	.left {
		border-right: 1px solid var(--border, #e5e5e5);
		padding: 1rem;
		overflow: auto;
	}
	.content {
		padding: 2rem;
		max-width: 1024px;
	}
</style>
