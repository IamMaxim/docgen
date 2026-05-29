<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { base } from '$app/paths';
	import { onDestroy, onMount, tick } from 'svelte';
	import DocEditorPreview from '$lib/components/DocEditorPreview.svelte';
	import DocSourceEditor from '$lib/components/DocSourceEditor.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import SettingsMenu from '$lib/components/SettingsMenu.svelte';
	import { fetchPreview, fetchSource, saveSource } from '$lib/editor/client.ts';
	import { scrollSync } from '$lib/actions/scroll-sync';
	import { shortcutLabel } from '$lib/platform';
	import type { DocEditorSourcePayload } from '$lib/editor/types.ts';

	type EditorPageData = {
		currentDoc: DocEditorSourcePayload['doc'];
		editor: {
			slug: string;
			docPath: string;
		};
	};

	let {
		data,
		sourceApiUrl = '/docs/editor-api/source.json',
		previewApiUrl = '/docs/editor-api/preview.json'
	}: {
		data: EditorPageData;
		sourceApiUrl?: string;
		previewApiUrl?: string;
	} = $props();

	let sourceEditor = $state<
		{ scrollElement: () => HTMLElement | null; formatTable: () => boolean } | undefined
	>(undefined);
	const formatShortcutLabel = shortcutLabel('⌘⌥L', 'Ctrl+Alt+L');
	let previewScrollHost: HTMLDivElement;
	let scrollHandle: { sync: () => void } | undefined;
	let sourcePayload = $state<DocEditorSourcePayload | null>(null);
	let buffer = $state('');
	let lastSavedSource = $state('');
	let diskHash = $state('');
	let headSource = $state('');
	let moduleUrl = $state<string | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	let statusMessage = $state('Loading source...');
	let errorMessage = $state<string | null>(null);
	let previewError = $state<string | null>(null);
	let previewTimer: ReturnType<typeof setTimeout> | null = null;

	const dirty = $derived(buffer !== lastSavedSource);

	async function loadSource() {
		loading = true;
		errorMessage = null;
		statusMessage = 'Loading source...';
		try {
			const payload = await fetchSource(data.editor.slug, sourceApiUrl);
			sourcePayload = payload;
			buffer = payload.source;
			lastSavedSource = payload.source;
			diskHash = payload.diskHash;
			headSource = payload.headSource;
			statusMessage = 'Loaded';
			void updatePreview(payload.source);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : String(error);
			statusMessage = 'Load failed';
		} finally {
			loading = false;
		}
	}

	function schedulePreview(source: string) {
		if (previewTimer) clearTimeout(previewTimer);
		previewTimer = setTimeout(() => void updatePreview(source), 350);
	}

	async function updatePreview(source: string) {
		previewError = null;
		try {
			const payload = await fetchPreview(data.editor.docPath, source, previewApiUrl);
			moduleUrl = payload.moduleUrl;
			await tick();
			scrollHandle?.sync();
		} catch (error) {
			previewError = error instanceof Error ? error.message : String(error);
		}
	}

	function onEditorChange(next: string) {
		buffer = next;
		statusMessage = next === lastSavedSource ? 'Saved' : 'Unsaved changes';
		schedulePreview(next);
	}

	async function save() {
		if (!sourcePayload || saving || !dirty) return;
		saving = true;
		errorMessage = null;
		statusMessage = 'Saving...';
		try {
			const saved = await saveSource(
				{
					slug: data.editor.slug,
					source: buffer,
					diskHash
				},
				sourceApiUrl
			);
			lastSavedSource = saved.source;
			diskHash = saved.diskHash;
			statusMessage = `Saved ${new Date(saved.savedAt).toLocaleTimeString()}`;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : String(error);
			statusMessage = 'Save failed';
		} finally {
			saving = false;
		}
	}

	beforeNavigate((navigation) => {
		if (!dirty) return;
		// Tab close / external navigation goes through the browser's `beforeunload`
		// prompt below; skip the synchronous confirm in that case.
		if (navigation.willUnload) return;
		const ok = window.confirm('Discard unsaved documentation changes?');
		if (!ok) navigation.cancel();
	});

	onMount(() => {
		void loadSource();
		const onBeforeUnload = (event: BeforeUnloadEvent) => {
			if (!dirty) return;
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	});

	onDestroy(() => {
		if (previewTimer) clearTimeout(previewTimer);
	});
</script>

<article class="doc-editor">
	<header class="editor-header">
		<div>
			<p class="eyebrow">Editor</p>
			<h1>{data.currentDoc.title}</h1>
			<p class="path">{data.editor.docPath}</p>
		</div>
		<div class="editor-actions">
			<span class:dirty class:error={Boolean(errorMessage)}>{errorMessage ?? statusMessage}</span>
			<div class="btn-strip">
				<button
					type="button"
					class="icon-only icon-action"
					aria-label="Format table"
					disabled={!sourceEditor}
					onclick={() => sourceEditor?.formatTable()}
				>
					<Icon name="table" />
					<span class="tooltip" role="tooltip">
						<span class="tooltip__name">Format table</span>
						<kbd class="tooltip__kbd">{formatShortcutLabel}</kbd>
					</span>
				</button>
				<SettingsMenu />
			</div>
			<div class="btn-strip">
				<a href={`${base}${data.currentDoc.path}`}>View</a>
				<button
					type="button"
					class="is-primary"
					disabled={!dirty || saving || loading}
					onclick={save}
				>
					{saving ? 'Saving...' : 'Save'}
				</button>
			</div>
		</div>
	</header>

	{#if errorMessage}
		<section class="editor-error">{errorMessage}</section>
	{/if}

	<section class="editor-workspace">
		<div class="pane source-pane">
			{#if sourcePayload}
				<DocSourceEditor
					bind:this={sourceEditor}
					value={buffer}
					{headSource}
					onChange={onEditorChange}
					onSave={save}
				/>
			{:else}
				<div class="loading">Loading source...</div>
			{/if}
		</div>

		<div
			class="pane preview-pane"
			bind:this={previewScrollHost}
			use:scrollSync={{
				partner: () => sourceEditor?.scrollElement() ?? null,
				bindHandle: (h) => (scrollHandle = h)
			}}
		>
			<DocEditorPreview currentDoc={data.currentDoc} {moduleUrl} errorMessage={previewError} />
		</div>
	</section>
</article>

<style>
	.doc-editor {
		display: flex;
		flex-direction: column;
		width: 100%;
		min-width: 0;
		height: calc(100vh - var(--topbar-height));
		color: var(--text);
	}

	.editor-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		min-height: 82px;
		padding: 14px 20px;
		border-bottom: 1px solid var(--border);
		background: var(--bg);
	}

	.eyebrow,
	.path,
	.editor-actions span {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 11px;
	}

	.eyebrow {
		color: var(--accent);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h1 {
		margin: 2px 0;
		font-size: 20px;
		font-weight: 500;
		line-height: 1.2;
	}

	.path {
		color: var(--text-mute);
	}

	.editor-actions {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.editor-actions span {
		color: var(--text-mute);
		white-space: nowrap;
	}

	.editor-actions span.dirty {
		color: var(--warn);
	}

	.editor-actions span.error {
		color: var(--text-error);
	}

	.icon-text,
	.primary {
		height: 32px;
		padding: 0 12px;
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		background: var(--surface);
		color: var(--text);
		text-decoration: none;
	}

	.icon-action {
		position: relative;
	}

	.icon-action .tooltip {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 5px 8px;
		border: 1px solid var(--border);
		border-radius: var(--r-sm);
		background: var(--bg-elev);
		color: var(--text);
		font-size: 12px;
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transform: translateY(-2px);
		transition:
			opacity 80ms ease,
			transform 80ms ease;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
		z-index: 5;
	}

	.icon-action:hover:not(:disabled) .tooltip,
	.icon-action:focus-visible .tooltip {
		opacity: 1;
		transform: translateY(0);
	}

	.tooltip__kbd {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-dim);
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 1px 5px;
	}

	.icon-text {
		display: inline-flex;
		align-items: center;
	}

	.primary {
		background: var(--accent-soft);
	}

	.primary:disabled {
		cursor: default;
		opacity: 0.55;
	}

	.editor-error {
		margin: 0 20px;
		padding: 10px 12px;
		border: 1px solid var(--text-error);
		border-radius: var(--r-md);
		color: var(--text-error);
	}

	.editor-workspace {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		min-height: 0;
		flex: 1;
	}

	.pane {
		min-width: 0;
		min-height: 0;
	}

	.source-pane {
		border-right: 1px solid var(--border);
	}

	.preview-pane {
		overflow: auto;
		background: var(--bg);
	}

	.loading {
		padding: 20px;
		color: var(--text-dim);
	}

	@media (max-width: 900px) {
		.doc-editor {
			height: auto;
			min-height: calc(100vh - var(--topbar-height));
		}

		.editor-header {
			align-items: flex-start;
			flex-direction: column;
		}

		.editor-workspace {
			grid-template-columns: 1fr;
		}

		.source-pane {
			height: 52vh;
			border-right: 0;
		}

		.preview-pane {
			min-height: 52vh;
		}
	}
</style>
