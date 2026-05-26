<script lang="ts">
	import { base } from '$app/paths';
	import { useDocgenRegistry } from '$lib/context.ts';

	const { paths: { DOC_URL_PREFIX } } = useDocgenRegistry();

	const layers = [
		{ label: 'Overview', path: `${DOC_URL_PREFIX}/overview` },
		{ label: 'Game design', path: `${DOC_URL_PREFIX}/game-design` },
		{ label: 'Developers', path: `${DOC_URL_PREFIX}/dev` }
	] as const;
</script>

<nav class="layer-nav" aria-label="Documentation layers">
	{#each layers as layer}
		<a class="layer-nav__link" href={`${base}${layer.path}`}>{layer.label}</a>
	{/each}
</nav>

<style>
	.layer-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0.75rem;
		padding: 0 8px 8px;
		border-bottom: 1px solid var(--border-muted);
		margin-bottom: 0.5rem;
	}

	.layer-nav__link {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		text-decoration: none;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
		border: 1px solid var(--border-muted);
	}

	.layer-nav__link:hover {
		color: var(--accent);
		border-color: var(--accent);
	}
</style>
