<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';
	import { markdown } from '@codemirror/lang-markdown';
	import { unifiedMergeView } from '@codemirror/merge';
	import { Compartment, Prec } from '@codemirror/state';
	import { keymap } from '@codemirror/view';
	import { acceptCompletion, completionStatus } from '@codemirror/autocomplete';
	import { basicSetup, EditorView } from 'codemirror';
	import { editorThemeId } from '$lib/editor-theme-store';
	import { wordWrap } from '$lib/editor-prefs-store';
	import { buildEditorTheme } from '$lib/editor-themes';
	import { wikilinkHighlighter } from '$lib/editor-wikilinks';
	import { formatTableAtCursor, formatTableKeymap } from '$lib/editor-format-table';
	import { wikilinkAutocompletion } from '$lib/editor-wikilink-complete';
	import { get } from 'svelte/store';

	let {
		value,
		headSource,
		onChange,
		onSave
	}: {
		value: string;
		headSource: string;
		onChange: (value: string) => void;
		onSave: () => void;
	} = $props();

	let host: HTMLDivElement;
	let view: EditorView | null = null;
	let internalUpdate = false;
	const themeCompartment = new Compartment();
	const wrapCompartment = new Compartment();

	function createEditor() {
		if (!browser || !host || view) return;
		const initialTheme = buildEditorTheme(get(editorThemeId));
		const initialWrap = get(wordWrap) ? EditorView.lineWrapping : [];
		view = new EditorView({
			parent: host,
			doc: value,
			extensions: [
				basicSetup,
				markdown(),
				unifiedMergeView({
					original: headSource,
					gutter: true,
					highlightChanges: true,
					mergeControls: false
				}),
				themeCompartment.of(initialTheme),
				wikilinkHighlighter,
				wrapCompartment.of(initialWrap),
				wikilinkAutocompletion,
				Prec.high(keymap.of(formatTableKeymap)),
				Prec.high(
					keymap.of([
						{
							key: 'Tab',
							run: (view) => {
								if (completionStatus(view.state) !== 'active') return false;
								return acceptCompletion(view);
							}
						}
					])
				),
				EditorView.updateListener.of((update) => {
					if (!update.docChanged || internalUpdate) return;
					onChange(update.state.doc.toString());
				}),
				EditorView.domEventHandlers({
					keydown(event) {
						if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
							event.preventDefault();
							onSave();
							return true;
						}
						return false;
					}
				})
			]
		});
	}

	export function scrollElement(): HTMLElement | null {
		return host?.querySelector('.cm-scroller') ?? null;
	}

	export function formatTable(): boolean {
		if (!view) return false;
		const result = formatTableAtCursor(view);
		view.focus();
		return result;
	}

	onMount(() => {
		createEditor();
		const unsubTheme = editorThemeId.subscribe((id) => {
			if (!view) return;
			view.dispatch({ effects: themeCompartment.reconfigure(buildEditorTheme(id)) });
		});
		const unsubWrap = wordWrap.subscribe((enabled) => {
			if (!view) return;
			view.dispatch({
				effects: wrapCompartment.reconfigure(enabled ? EditorView.lineWrapping : [])
			});
		});
		return () => {
			unsubTheme();
			unsubWrap();
		};
	});

	$effect(() => {
		if (!view) return;
		const current = view.state.doc.toString();
		if (current === value) return;
		internalUpdate = true;
		view.dispatch({
			changes: { from: 0, to: current.length, insert: value }
		});
		internalUpdate = false;
	});

	onDestroy(() => {
		view?.destroy();
		view = null;
	});
</script>

<div bind:this={host} class="source-editor"></div>

<style>
	.source-editor {
		height: 100%;
		min-height: 0;
		overflow: hidden;
		background: var(--surface);
	}

	.source-editor :global(.cm-editor) {
		height: 100%;
	}

	.source-editor :global(.cm-tooltip.cm-tooltip-autocomplete) {
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		background: var(--bg-elev);
		color: var(--text);
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
		font-family: var(--font-mono);
		font-size: 12px;
	}

	.source-editor :global(.cm-tooltip-autocomplete ul) {
		max-height: 280px;
		font-family: inherit;
	}

	.source-editor :global(.cm-tooltip-autocomplete ul li) {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 3px 8px;
		line-height: 1.25;
	}

	.source-editor :global(.cm-tooltip-autocomplete ul li[aria-selected]) {
		background: var(--accent-soft);
		color: var(--text);
	}

	.source-editor :global(.cm-tooltip-autocomplete .cm-completionLabel),
	.source-editor :global(.cm-tooltip-autocomplete .cm-completionDetail),
	.source-editor :global(.cm-tooltip-autocomplete .cm-completionIcon) {
		display: none;
	}

	.source-editor :global(.cm-wikilink-suggestion) {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
	}

	.source-editor :global(.cm-wikilink-suggestion__title) {
		color: var(--text);
		font-size: 12.5px;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.source-editor :global(.cm-wikilink-suggestion__path) {
		color: var(--text-mute);
		font-size: 10.5px;
		line-height: 1.15;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.source-editor :global(.cm-wikilink-suggestion__match) {
		color: var(--accent);
		font-weight: 600;
	}

	.source-editor :global(.cm-tooltip-autocomplete .cm-completionInfo) {
		display: none;
	}
</style>
