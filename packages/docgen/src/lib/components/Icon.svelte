<script lang="ts">
	type IconName =
		| 'arrow'
		| 'check'
		| 'chevron'
		| 'diff'
		| 'doc'
		| 'edit'
		| 'enter'
		| 'hash'
		| 'maximize'
		| 'menu'
		| 'moon'
		| 'search'
		| 'sun'
		| 'table'
		| 'triangle'
		| 'x';

	let { name, size = 14 }: { name: IconName; size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill={name === 'triangle' ? 'currentColor' : 'none'}
	stroke="currentColor"
	stroke-width={name === 'chevron' ? 2.5 : 2}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if name === 'search'}
		<circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
	{:else if name === 'chevron'}
		<path d="m9 18 6-6-6-6" />
	{:else if name === 'diff'}
		<path d="M6 4v16M18 4v16" />
		<path d="M9 8h6M9 16h6M12 5v6M12 13v6" />
	{:else if name === 'sun'}
		<circle cx="12" cy="12" r="4" />
		<path
			d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
		/>
	{:else if name === 'moon'}
		<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
	{:else if name === 'doc'}
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
		<path d="M14 2v6h6" />
	{:else if name === 'hash'}
		<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />
	{:else if name === 'arrow'}
		<path d="M5 12h14M13 5l7 7-7 7" />
	{:else if name === 'check'}
		<path d="M3 12l6 6L21 6" />
	{:else if name === 'triangle'}
		<path d="M12 4 2 20h20z" opacity="0.18" />
		<path d="M12 4 2 20h20z" fill="none" />
		<path d="M12 10v4M12 17h.01" fill="none" />
	{:else if name === 'edit'}
		<path d="M12 20h9" />
		<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
	{:else if name === 'enter'}
		<path d="M9 10 4 15l5 5M20 4v7a4 4 0 0 1-4 4H4" />
	{:else if name === 'menu'}
		<path d="M4 6h16M4 12h16M4 18h16" />
	{:else if name === 'maximize'}
		<path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" />
	{:else if name === 'x'}
		<path d="M18 6 6 18M6 6l12 12" />
	{:else if name === 'table'}
		<rect x="3" y="4" width="18" height="16" rx="1.5" />
		<path d="M3 10h18M3 16h18M9 4v16M15 4v16" />
	{/if}
</svg>
