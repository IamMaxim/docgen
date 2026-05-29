<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import type { SearchDocument } from '$lib/registry.ts';
	import Icon from './Icon.svelte';

	type ResultKind = 'page' | 'heading' | 'todo' | 'rust' | 'body';

	type SearchResult = {
		kind: ResultKind;
		title: string;
		path: string;
		href: string;
		context: string;
		score: number;
	};

	let {
		open = $bindable(false),
		onClose,
		searchIndexUrl = '/search-index.json'
	}: {
		open?: boolean;
		onClose?: () => void;
		searchIndexUrl?: string;
	} = $props();

	// Self-sufficient close: works whether the parent uses `bind:open` or the
	// `open` + `onClose` prop pair. Sets the bindable value and notifies the
	// parent if it provided a handler.
	const close = () => {
		open = false;
		onClose?.();
	};

	let query = $state('');
	let selected = $state(0);
	let inputEl: HTMLInputElement | null = $state(null);
	let resultsEl: HTMLDivElement | null = $state(null);
	let docs = $state<SearchDocument[]>([]);
	let loadError = $state<string | null>(null);

	const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

	const fuzzyScore = (haystack: string, needle: string) => {
		if (!needle) return 1;
		const text = normalize(haystack);
		const term = normalize(needle);
		if (text === term) return 100;
		if (text.startsWith(term)) return 80;
		if (text.includes(term)) return 60;

		let cursor = 0;
		for (const char of term) {
			const idx = text.indexOf(char, cursor);
			if (idx === -1) return 0;
			cursor = idx + 1;
		}
		return 18;
	};

	const excerpt = (text: string, term: string) => {
		const clean = text.replace(/\s+/g, ' ').trim();
		if (!clean) return '';
		const idx = clean.toLowerCase().indexOf(term.toLowerCase());
		if (idx < 0) return clean.slice(0, 150);
		const start = Math.max(0, idx - 48);
		const end = Math.min(clean.length, idx + term.length + 92);
		return `${start > 0 ? '…' : ''}${clean.slice(start, end)}${end < clean.length ? '…' : ''}`;
	};

	const hrefFor = (doc: SearchDocument, anchor?: string) =>
		`${base}${doc.path}${anchor ? `#${anchor}` : ''}`;

	const buildResults = (term: string): SearchResult[] => {
		const q = term.trim();
		if (!q) {
			return docs.slice(0, 8).map((doc) => ({
				kind: 'page',
				title: doc.title,
				path: doc.section,
				href: hrefFor(doc),
				context: doc.description ?? doc.path,
				score: 1
			}));
		}

		const out: SearchResult[] = [];
		for (const doc of docs) {
			const titleScore = fuzzyScore(`${doc.title} ${doc.path} ${doc.section}`, q);
			if (titleScore > 0) {
				out.push({
					kind: 'page',
					title: doc.title,
					path: `${doc.section} / ${doc.path.replace(/^\/docs\/?/, '') || 'index'}`,
					href: hrefFor(doc),
					context: doc.description ?? doc.path,
					score: titleScore + 30
				});
			}

			for (const heading of doc.headings) {
				const score = fuzzyScore(`${heading.label} ${doc.title}`, q);
				if (score > 0) {
					out.push({
						kind: 'heading',
						title: heading.label,
						path: `${doc.title} → ${heading.label}`,
						href: hrefFor(doc, heading.anchor),
						context: doc.description ?? doc.path,
						score: score + 20
					});
				}
			}

			for (const callout of doc.callouts) {
				const score = fuzzyScore(`${callout.kind} ${callout.text} ${doc.title}`, q);
				if (score > 0) {
					out.push({
						kind: 'todo',
						title: callout.text,
						path: `${callout.kind.replace('-', ' ')} / ${doc.title}`,
						href: hrefFor(doc),
						context: doc.path,
						score: score + 16
					});
				}
			}

			for (const ref of doc.rustRefs) {
				const score = fuzzyScore(`${ref} ${doc.title}`, q);
				if (score > 0) {
					out.push({
						kind: 'rust',
						title: ref,
						path: `RustRef / ${doc.title}`,
						href: hrefFor(doc),
						context: doc.path,
						score: score + 14
					});
				}
			}

			const bodyScore = fuzzyScore(doc.text, q);
			if (bodyScore > 0) {
				out.push({
					kind: 'body',
					title: doc.title,
					path: `Full text / ${doc.section}`,
					href: hrefFor(doc),
					context: excerpt(doc.text, q),
					score: bodyScore
				});
			}
		}

		return out
			.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
			.slice(0, 24);
	};

	const results = $derived(buildResults(query));
	const grouped = $derived.by(() => {
		const groups: { kind: ResultKind; label: string; items: SearchResult[] }[] = [
			{ kind: 'page', label: 'Pages', items: [] },
			{ kind: 'heading', label: 'Headings', items: [] },
			{ kind: 'todo', label: 'TODOs / questions', items: [] },
			{ kind: 'rust', label: 'Rust refs', items: [] },
			{ kind: 'body', label: 'Full text', items: [] }
		];
		for (const result of results) {
			groups.find((group) => group.kind === result.kind)?.items.push(result);
		}
		return groups.filter((group) => group.items.length > 0);
	});

	$effect(() => {
		if (!open) return;
		query = '';
		selected = 0;
		loadError = null;
		if (!docs.length) {
			fetch(`${base}${searchIndexUrl}`)
				.then((response) => {
					if (!response.ok) throw new Error(`Search index request failed: ${response.status}`);
					return response.json() as Promise<SearchDocument[]>;
				})
				.then((payload) => {
					docs = payload;
				})
				.catch((error: unknown) => {
					loadError = error instanceof Error ? error.message : 'Search index unavailable';
				});
		}
		tick().then(() => inputEl?.focus());
	});

	$effect(() => {
		query;
		selected = 0;
	});

	$effect(() => {
		selected;
		const el = resultsEl?.querySelector<HTMLElement>(`[data-index="${selected}"]`);
		el?.scrollIntoView({ block: 'nearest' });
	});

	const openResult = (result: SearchResult | undefined) => {
		if (!result) return;
		close();
		goto(result.href);
	};

	const onKeydown = (event: KeyboardEvent) => {
		if (!open) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			close();
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			selected = Math.min(results.length - 1, selected + 1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			selected = Math.max(0, selected - 1);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			openResult(results[selected]);
		}
	};

	const highlight = (text: string) => {
		const term = query.trim();
		if (!term) return { before: text, match: '', after: '' };
		const idx = text.toLowerCase().indexOf(term.toLowerCase());
		if (idx < 0) return { before: text, match: '', after: '' };
		return {
			before: text.slice(0, idx),
			match: text.slice(idx, idx + term.length),
			after: text.slice(idx + term.length)
		};
	};

</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div class="search-overlay">
		<button class="search-backdrop" type="button" aria-label="Close search" onclick={close}></button>
		<div
			class="search-modal"
			role="dialog"
			aria-modal="true"
			aria-label="Search documentation"
			tabindex="-1"
		>
			<div class="search-modal__input">
				<Icon name="search" />
				<input
					bind:this={inputEl}
					bind:value={query}
					placeholder="Search pages, headings, Rust refs, TODOs…"
					aria-label="Search query"
				/>
				<span class="kbd">esc</span>
			</div>

			<div class="search-modal__results" bind:this={resultsEl}>
				{#if loadError}
					<div class="search-empty">{loadError}</div>
				{:else if !docs.length}
					<div class="search-empty">Loading search index…</div>
				{:else if results.length === 0}
					<div class="search-empty">No results for “{query}”. Try a shorter query.</div>
				{:else}
					{@const state = { index: -1 }}
					{#each grouped as group}
						<div class="search-group">{group.label}</div>
						{#each group.items as result}
							{@const index = ++state.index}
							{@const title = highlight(result.title)}
							<button
								type="button"
								data-index={index}
								class="search-result"
								class:is-active={index === selected}
								onmouseenter={() => (selected = index)}
								onclick={() => openResult(result)}
							>
								<span class="search-result__icon">
									{#if result.kind === 'rust'}
										<img src={`${base}/icons/rust.svg`} alt="" class="rust-mark" width="14" height="14" />
									{:else if result.kind === 'heading'}
										<Icon name="hash" />
									{:else if result.kind === 'todo'}
										<Icon name="triangle" />
									{:else}
										<Icon name="doc" />
									{/if}
								</span>
								<span class="search-result__main">
									<span class="search-result__title">
										{title.before}{#if title.match}<mark>{title.match}</mark>{/if}{title.after}
									</span>
									<span class="search-result__path">{result.path}</span>
									{#if result.context}
										<span class="search-result__context">{result.context}</span>
									{/if}
								</span>
								<span class="search-result__hint">
									{#if index === selected}
										<Icon name="enter" size={12} />
									{/if}
								</span>
							</button>
						{/each}
					{/each}
				{/if}
			</div>

			<footer class="search-modal__foot">
				<div class="legend">
					<span><span class="kbd">↑↓</span> navigate</span>
					<span><span class="kbd">↵</span> open</span>
					<span><span class="kbd">esc</span> close</span>
				</div>
				<div>{results.length} result{results.length === 1 ? '' : 's'}</div>
			</footer>
		</div>
	</div>
{/if}

<style>
	.search-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: grid;
		place-items: start center;
		padding-top: 12vh;
	}

	.search-backdrop {
		position: absolute;
		inset: 0;
		border: 0;
		background: color-mix(in srgb, var(--bg) 70%, transparent);
		backdrop-filter: blur(6px);
	}

	.search-modal {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		width: min(720px, 92vw);
		max-height: 74vh;
		overflow: hidden;
		border: 1px solid var(--border-strong);
		border-radius: var(--r-lg);
		background: var(--bg-elev);
		box-shadow:
			0 30px 80px rgba(0, 0, 0, 0.4),
			0 0 0 1px var(--hairline);
	}

	.search-modal__input {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 18px;
		border-bottom: 1px solid var(--border);
		color: var(--text-mute);
	}

	input {
		flex: 1;
		min-width: 0;
		border: 0;
		outline: 0;
		background: transparent;
		color: var(--text);
		font: inherit;
		font-size: 15px;
	}

	input::placeholder {
		color: var(--text-mute);
	}

	.search-modal__results {
		flex: 1;
		overflow-y: auto;
		padding: 8px 8px 12px;
	}

	.search-group {
		padding: 12px 12px 4px;
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.search-result {
		display: grid;
		grid-template-columns: 22px minmax(0, 1fr) auto;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 8px 12px;
		border: 0;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--text-dim);
		text-align: left;
	}

	.search-result.is-active {
		background: var(--surface-hi);
		color: var(--text);
	}

	.search-result__icon {
		display: grid;
		place-items: center;
		color: var(--text-mute);
	}

	.search-result.is-active .search-result__icon {
		color: var(--accent);
	}

	.rust-mark {
		width: 14px;
		height: 14px;
		display: block;
	}

	.search-result__main {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.search-result__title {
		color: var(--text);
		font-size: 13.5px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	mark {
		padding: 0 1px;
		border-radius: 2px;
		background: var(--accent-soft);
		color: var(--accent);
	}

	.search-result__path,
	.search-result__context {
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: var(--text-mute);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.search-result__context {
		font-family: var(--font-sans);
		font-size: 12px;
	}

	.search-result__hint {
		color: var(--text-mute);
	}

	.search-modal__foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 8px 14px;
		border-top: 1px solid var(--border);
		background: var(--surface);
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 10.5px;
	}

	.legend {
		display: flex;
		gap: 14px;
	}

	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}

	.search-empty {
		padding: 36px 18px;
		text-align: center;
		color: var(--text-mute);
	}

	@media (max-width: 640px) {
		.search-overlay {
			padding-top: 8vh;
		}

		.search-modal__foot {
			align-items: flex-start;
			flex-direction: column;
		}

		.legend {
			flex-wrap: wrap;
		}
	}
</style>
