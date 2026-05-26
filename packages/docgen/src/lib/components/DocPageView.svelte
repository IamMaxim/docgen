<script lang="ts">
	import { base } from '$app/paths';
	import MermaidHydrate from '$lib/components/MermaidHydrate.svelte';
	import { useDocgenRegistry } from '$lib/context.ts';
	import type { DocMeta } from '$lib/registry.ts';

	let { currentDoc }: { currentDoc: DocMeta } = $props();

	const registry = useDocgenRegistry();
	const { getDocComponent, getEntryByPath } = registry;
	const { DOC_URL_PREFIX } = registry.paths;

	const prettify = (segment: string) =>
		segment
			.split('-')
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(' ');

	const DocComponent = $derived.by(() => {
		const resolved = getDocComponent(currentDoc.slug);
		if (!resolved) {
			throw new Error(`Document component missing for ${currentDoc.path}`);
		}
		return resolved;
	});

	const breadcrumbs = $derived.by<{ label: string; href: string | null }[]>(() => {
		const items: { label: string; href: string | null }[] = [
			{ label: 'Docs', href: `${base}${DOC_URL_PREFIX}` }
		];
		if (!currentDoc.slug.length) return items;
		const stack: string[] = [];
		for (const segment of currentDoc.slug) {
			stack.push(segment);
			const path = `${DOC_URL_PREFIX}/${stack.join('/')}`;
			const targetDoc = getEntryByPath(path);
			items.push({
				label: targetDoc?.title ?? prettify(segment),
				href: targetDoc ? `${base}${path}` : null
			});
		}
		return items;
	});
</script>

<MermaidHydrate />

<article class="doc-page">
	<header class="doc-header">
		<nav class="breadcrumbs" aria-label="Breadcrumbs">
			{#each breadcrumbs as crumb, index}
				{#if crumb.href}
					<a
						href={crumb.href}
						aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
						class:current={index === breadcrumbs.length - 1}
					>
						{crumb.label}
					</a>
				{:else}
					<span>{crumb.label}</span>
				{/if}
				{#if index < breadcrumbs.length - 1}
					<span class="sep">/</span>
				{/if}
			{/each}
		</nav>
		<h1>{currentDoc.title}</h1>
		{#if currentDoc.description}
			<p class="lede">{currentDoc.description}</p>
		{/if}
	</header>

	<section class="doc-content">
		{#key currentDoc.path}
			<DocComponent />
		{/key}
	</section>
</article>

<style>
	.doc-page {
		display: flex;
		flex-direction: column;
		gap: 32px;
	}

	.doc-header {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.breadcrumbs {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 4px;
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 10.5px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.breadcrumbs a {
		color: inherit;
		text-decoration: none;
	}

	.breadcrumbs a:hover {
		color: var(--text-dim);
	}

	.breadcrumbs a.current {
		color: var(--accent);
	}

	.sep {
		color: var(--text-mute);
	}

	h1 {
		margin: 0;
		color: var(--text);
		font-size: 38px;
		font-weight: 500;
		letter-spacing: -0.025em;
		line-height: 1.1;
	}

	.lede {
		max-width: 60ch;
		margin: 0;
		color: var(--text-dim);
		font-size: 17px;
		font-weight: 350;
		line-height: 1.55;
	}

	.doc-content {
		min-width: 0;
	}

	@media (max-width: 640px) {
		h1 {
			font-size: 30px;
		}

		.lede {
			font-size: 15px;
		}
	}
</style>
