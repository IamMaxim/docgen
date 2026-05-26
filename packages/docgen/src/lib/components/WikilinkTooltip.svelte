<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	let tooltipEl: HTMLDivElement | undefined = $state();
	let title = $state('');
	let path = $state('');
	let visible = $state(false);
	let top = $state(0);
	let left = $state(0);
	let currentTarget: HTMLElement | null = null;

	function position(target: HTMLElement) {
		const rect = target.getBoundingClientRect();
		const tipRect = tooltipEl?.getBoundingClientRect();
		const tipW = tipRect?.width ?? 240;
		const tipH = tipRect?.height ?? 56;
		let x = rect.left + rect.width / 2 - tipW / 2;
		let y = rect.bottom + 6;
		if (y + tipH > window.innerHeight - 8) {
			y = rect.top - tipH - 6;
		}
		x = Math.max(8, Math.min(window.innerWidth - tipW - 8, x));
		left = Math.round(x);
		top = Math.round(y);
	}

	function onOver(event: MouseEvent) {
		const link = (event.target as HTMLElement | null)?.closest?.(
			'a[data-wikilink-title]'
		) as HTMLElement | null;
		if (!link) return;
		if (link === currentTarget) return;
		currentTarget = link;
		title = link.dataset.wikilinkTitle ?? '';
		path = link.dataset.wikilinkPath ?? '';
		visible = true;
		queueMicrotask(() => position(link));
	}

	function onOut(event: MouseEvent) {
		const link = (event.target as HTMLElement | null)?.closest?.(
			'a[data-wikilink-title]'
		) as HTMLElement | null;
		if (!link || link !== currentTarget) return;
		const next = (event.relatedTarget as HTMLElement | null)?.closest?.(
			'a[data-wikilink-title]'
		);
		if (next === link) return;
		visible = false;
		currentTarget = null;
	}

	function onScroll() {
		if (currentTarget) position(currentTarget);
	}

	function onClick(event: MouseEvent) {
		const link = (event.target as HTMLElement | null)?.closest?.(
			'a[data-wikilink-title]'
		) as HTMLElement | null;
		if (!link) return;
		visible = false;
		currentTarget = null;
	}

	onMount(() => {
		document.addEventListener('mouseover', onOver);
		document.addEventListener('mouseout', onOut);
		document.addEventListener('click', onClick, { capture: true });
		window.addEventListener('scroll', onScroll, { passive: true, capture: true });
	});

	onDestroy(() => {
		if (typeof document === 'undefined') return;
		document.removeEventListener('mouseover', onOver);
		document.removeEventListener('mouseout', onOut);
		document.removeEventListener('click', onClick, { capture: true });
		window.removeEventListener('scroll', onScroll, { capture: true });
	});
</script>

<div
	bind:this={tooltipEl}
	class="wikilink-tooltip"
	class:is-visible={visible}
	style:top="{top}px"
	style:left="{left}px"
	role="tooltip"
>
	<div class="wikilink-tooltip__title">{title}</div>
	<div class="wikilink-tooltip__path">{path}</div>
</div>

<style>
	.wikilink-tooltip {
		position: fixed;
		max-width: 320px;
		padding: 6px 10px;
		border: 1px solid var(--border);
		border-radius: var(--r-sm);
		background: var(--bg-elev);
		color: var(--text);
		font-size: 12px;
		line-height: 1.3;
		box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28);
		pointer-events: none;
		opacity: 0;
		transform: translateY(-2px);
		transition:
			opacity 90ms ease,
			transform 90ms ease;
		z-index: 1000;
	}

	.wikilink-tooltip.is-visible {
		opacity: 1;
		transform: translateY(0);
	}

	.wikilink-tooltip__title {
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.wikilink-tooltip__path {
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 11px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
