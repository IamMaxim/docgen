<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import {
		setDocgenRegistry,
		Topbar,
		DocTree,
		SearchModal,
		theme,
		type Theme
	} from '@iammaxim/docgen';
	import '@iammaxim/docgen/styles';
	import 'katex/dist/katex.min.css';
	import { registry, config } from '$lib/docgen-registry';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	setDocgenRegistry(registry);

	// Current page path relative to `base`, used to highlight the active tree entry.
	const currentPath = $derived.by(() => {
		const pathname = ($page.url.pathname || '/').replace(/\/+$/, '') || '/';
		if (base && pathname.startsWith(base)) {
			return pathname.slice(base.length).replace(/\/+$/, '') || '/';
		}
		return pathname;
	});

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
	<Topbar
		siteTitle={config.siteTitle}
		onSearch={() => (searchOpen = true)}
		theme={$theme}
		onTheme={(value: Theme) => theme.set(value)}
		docsControlsAvailable={false}
	/>
	<aside class="left">
		<DocTree nodes={data.tree} {currentPath} linkBase={base} />
	</aside>
	<main class="content">
		{@render children()}
	</main>
	{#if config.features.search}
		<SearchModal bind:open={searchOpen} />
	{/if}
</div>

<style>
	/* Fixed-height shell: the topbar stays put while the tree and the page
	   content scroll independently within the remaining viewport height. */
	.app-shell {
		display: grid;
		grid-template-columns: 260px 1fr;
		grid-template-rows: auto minmax(0, 1fr);
		height: 100vh;
	}
	.app-shell :global(> :first-child) {
		grid-column: 1 / -1;
	}
	.left {
		border-right: 1px solid var(--border, #e5e5e5);
		padding: 1rem;
		overflow-y: auto;
	}
	.content {
		padding: 2rem;
		max-width: 1024px;
		overflow-y: auto;
	}
</style>
