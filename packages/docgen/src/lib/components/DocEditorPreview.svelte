<script lang="ts">
	import type { ComponentType } from 'svelte';
	import MermaidHydrate from '$lib/components/MermaidHydrate.svelte';
	import type { DocMeta } from '$lib/registry.ts';

	let {
		currentDoc,
		moduleUrl,
		errorMessage = null
	}: {
		currentDoc: DocMeta;
		moduleUrl: string | null;
		errorMessage?: string | null;
	} = $props();

	let PreviewComponent = $state<ComponentType | null>(null);
	let importError = $state<string | null>(null);
	let loadToken = 0;

	$effect(() => {
		if (!moduleUrl) {
			PreviewComponent = null;
			importError = null;
			return;
		}

		const token = ++loadToken;
		importError = null;
		import(/* @vite-ignore */ moduleUrl)
			.then((module) => {
				if (token !== loadToken) return;
				PreviewComponent = module.default as ComponentType;
			})
			.catch((error) => {
				if (token !== loadToken) return;
				importError = error instanceof Error ? error.message : String(error);
			});
	});
</script>

<MermaidHydrate rootSelector=".doc-editor-preview .doc-content" />

<article class="doc-editor-preview">
	<header class="doc-header">
		<p class="eyebrow">Preview</p>
		<h1>{currentDoc.title}</h1>
		{#if currentDoc.description}
			<p class="lede">{currentDoc.description}</p>
		{/if}
	</header>

	{#if errorMessage || importError}
		<section class="preview-error" aria-live="polite">
			<strong>Preview failed</strong>
			<pre>{errorMessage ?? importError}</pre>
		</section>
	{/if}

	<section class="doc-content">
		{#if PreviewComponent}
			{#key moduleUrl}
				<PreviewComponent />
			{/key}
		{:else if !errorMessage && !importError}
			<p class="preview-muted">Preparing preview...</p>
		{/if}
	</section>
</article>

<style>
	.doc-editor-preview {
		display: flex;
		flex-direction: column;
		gap: 24px;
		min-width: 0;
		padding: 28px 36px 64px;
	}

	.doc-header {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.eyebrow {
		margin: 0;
		color: var(--accent);
		font-family: var(--font-mono);
		font-size: 10.5px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h1,
	p {
		margin: 0;
	}

	h1 {
		color: var(--text);
		font-size: 32px;
		font-weight: 500;
		line-height: 1.1;
	}

	.lede,
	.preview-muted {
		color: var(--text-dim);
	}

	.preview-error {
		padding: 12px 14px;
		border: 1px solid var(--text-error);
		border-radius: var(--r-md);
		background: color-mix(in srgb, var(--text-error) 12%, transparent);
		color: var(--text);
	}

	.preview-error pre {
		margin: 8px 0 0;
		white-space: pre-wrap;
		color: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 12px;
	}
</style>
