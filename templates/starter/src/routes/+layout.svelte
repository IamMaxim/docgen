<script lang="ts">
	import 'katex/dist/katex.min.css';
	import '@iammaxim/docgen/styles';

	import { dev } from '$app/environment';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { type Snippet } from 'svelte';

	import {
		DocgenProvider,
		Topbar,
		DocTree,
		RightRail,
		SearchModal,
		WikilinkTooltip,
		theme,
		rightRailCollapsed,
		fullWidth,
		leftRailWidth,
		resizable,
		type Theme,
		type DocMeta
	} from '@iammaxim/docgen';

	import { registry, config } from '$lib/docgen-registry';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();
	let searchOpen = $state(false);

	const setTheme = (value: Theme) => theme.set(value);
	const toggleRightRail = () => rightRailCollapsed.update((v) => !v);
	const toggleFullWidth = () => fullWidth.update((v) => !v);

	const currentPath = $derived.by(() => {
		const pathname = ($page.url.pathname || '/').replace(/\/+$/, '') || '/';
		if (base && pathname.startsWith(base)) {
			return pathname.slice(base.length).replace(/\/+$/, '') || '/';
		}
		return pathname;
	});

	const currentDoc = $derived(($page.data.currentDoc as DocMeta | undefined) ?? undefined);
	const backlinks = $derived(($page.data.backlinks as DocMeta[] | undefined) ?? []);
	const isDocsPage = $derived(
		currentPath === config.baseUrl || currentPath.startsWith(`${config.baseUrl}/`)
	);
	const isDiffPage = $derived(currentPath === '/diff');
	const isEditPage = $derived(currentPath === '/edit' || currentPath.startsWith('/edit/'));
	const editorSlug = $derived.by(() => {
		if (!dev || !currentDoc || !isDocsPage || isDiffPage || isEditPage) return null;
		return currentDoc.slug;
	});

	const onGlobalKey = (event: KeyboardEvent) => {
		const target = event.target as HTMLElement | null;
		const isTyping =
			target?.tagName === 'INPUT' ||
			target?.tagName === 'TEXTAREA' ||
			target?.isContentEditable === true;

		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			searchOpen = true;
			return;
		}

		if (event.key === '/' && !searchOpen && !isTyping) {
			event.preventDefault();
			searchOpen = true;
		}
	};
</script>

<svelte:window onkeydown={onGlobalKey} />

<DocgenProvider {registry}>
	<div
		class="app-shell"
		class:right-collapsed={$rightRailCollapsed || !isDocsPage || isDiffPage || isEditPage}
		class:diff-page={isDiffPage}
		style:--left-rail-width={`${$leftRailWidth}px`}
	>
		<Topbar
			siteTitle={config.siteTitle}
			theme={$theme}
			onTheme={setTheme}
			onSearch={() => (searchOpen = true)}
			onToggleRightRail={toggleRightRail}
			onToggleFullWidth={toggleFullWidth}
			rightRailCollapsed={$rightRailCollapsed}
			fullWidth={$fullWidth}
			docsControlsAvailable={isDocsPage && !isEditPage}
			{editorSlug}
			diffPath="/diff"
			editPath="/edit"
		/>

		{#if !isDiffPage}
			<aside class="left-rail" style:width={`${$leftRailWidth}px`}>
				<section class="left-rail__tree">
					<DocTree nodes={data.tree} {currentPath} linkBase={base} />
				</section>

				<footer class="left-rail__footer">
					{#if data.commit}
						<div class="meta-row">
							<span>commit</span>
							<span>{data.commit.shortHash}</span>
						</div>
					{/if}
					<div class="meta-row">
						<span>pages</span>
						<span>{data.stats.totalDocs}</span>
					</div>
					<div class="meta-row">
						<span>callouts</span>
						<span>{data.stats.totalCallouts}</span>
					</div>
				</footer>
			</aside>
			<div
				class="rail-resizer"
				role="separator"
				aria-orientation="vertical"
				aria-label="Resize left sidebar"
				use:resizable={{ store: leftRailWidth, min: 180, max: 560 }}
			></div>
		{/if}

		<main class="main-content">
			<div
				class="main-content__inner"
				class:docs-page={isDocsPage}
				class:diff-route={isDiffPage}
				class:edit-route={isEditPage}
				class:full-width={$fullWidth}
			>
				{@render children()}
			</div>
		</main>

		{#if isDocsPage && !isDiffPage && !isEditPage}
			<RightRail
				{currentDoc}
				{backlinks}
				commit={data.commit}
				buildTimestamp={data.buildTimestamp}
				collapsed={$rightRailCollapsed}
			/>
		{/if}

		<SearchModal open={searchOpen} onClose={() => (searchOpen = false)} />
	</div>
</DocgenProvider>

<WikilinkTooltip />

<style>
	.app-shell {
		display: grid;
		grid-template-columns: var(--left-rail-width) 5px minmax(0, 1fr) var(--right-rail-width);
		min-height: 100vh;
		background: var(--bg);
	}

	.app-shell.right-collapsed {
		grid-template-columns: var(--left-rail-width) 5px minmax(0, 1fr);
	}

	.app-shell.diff-page {
		grid-template-columns: minmax(0, 1fr);
	}

	.left-rail {
		position: sticky;
		top: var(--topbar-height);
		display: block;
		height: calc(100vh - var(--topbar-height));
		padding: 18px 14px 30px;
		overflow-y: auto;
	}

	.rail-resizer {
		position: sticky;
		top: var(--topbar-height);
		height: calc(100vh - var(--topbar-height));
		width: 5px;
		cursor: col-resize;
		background: transparent;
		touch-action: none;
		user-select: none;
		z-index: 5;
	}
	.rail-resizer::before {
		content: '';
		position: absolute;
		left: 2px;
		top: 0;
		bottom: 0;
		width: 1px;
		background: var(--border);
		transition:
			background 0.12s,
			width 0.12s;
	}
	.rail-resizer:hover::before {
		background: var(--accent-line);
		width: 2px;
		left: 1.5px;
	}

	.left-rail__tree {
		min-height: max-content;
	}

	.left-rail__footer {
		display: flex;
		flex-direction: column;
		gap: 3px;
		margin-top: 28px;
		padding: 14px 10px 0;
		border-top: 1px solid var(--hairline);
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 10.5px;
		line-height: 1.7;
	}

	.meta-row {
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}

	.meta-row span:last-child {
		color: var(--text-dim);
	}

	.main-content {
		min-width: 0;
	}

	.main-content__inner {
		width: 100%;
	}

	.main-content__inner.docs-page {
		width: min(100%, 900px);
		max-width: 900px;
		margin-inline: auto;
		padding: 36px 48px 80px;
	}

	.main-content__inner.docs-page.full-width {
		width: 100%;
		max-width: none;
		margin-inline: 0;
	}

	.main-content__inner.docs-page.diff-route {
		width: 100%;
		max-width: none;
		margin-inline: 0;
		padding: 0;
	}

	.main-content__inner.docs-page.edit-route {
		width: 100%;
		max-width: none;
		margin-inline: 0;
		padding: 0;
	}

	.main-content__inner.docs-page.full-width :global(.doc-shell) {
		max-width: none;
	}

	@media (max-width: 1100px) {
		.app-shell,
		.app-shell.right-collapsed {
			grid-template-columns: var(--left-rail-width) 5px minmax(0, 1fr);
		}

		.app-shell > :global(.right-rail) {
			grid-column: 3;
			margin: 0 48px 48px;
		}
	}

	@media (max-width: 860px) {
		.app-shell,
		.app-shell.right-collapsed {
			grid-template-columns: 1fr;
		}
		.rail-resizer {
			display: none;
		}

		.left-rail {
			position: static;
			height: auto;
			max-height: 42vh;
			border-bottom: 1px solid var(--border);
		}

		.main-content__inner.docs-page {
			padding: 28px 18px 56px;
		}

		.app-shell > :global(.right-rail) {
			grid-column: 1;
			margin: 0 18px 42px;
		}
	}
</style>
