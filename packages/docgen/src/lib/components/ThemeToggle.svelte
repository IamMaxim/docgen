<script lang="ts">
	import Icon from './Icon.svelte';

	type Theme = 'light' | 'dark';

	let { theme, onSelect }: { theme: Theme; onSelect: (theme: Theme) => void } = $props();
</script>

<div class="theme-toggle" role="tablist" aria-label="Theme">
	<button
		type="button"
		class:is-active={theme === 'dark'}
		aria-label="Dark"
		onclick={() => onSelect('dark')}
	>
		<Icon name="moon" />
	</button>
	<button
		type="button"
		class:is-active={theme === 'light'}
		aria-label="Light"
		onclick={() => onSelect('light')}
	>
		<Icon name="sun" />
	</button>
</div>

<style>
	.theme-toggle {
		display: inline-flex;
		align-items: center;
		height: 32px;
		padding: 2px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
	}

	button {
		display: grid;
		place-items: center;
		width: 28px;
		height: 26px;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: var(--text-mute);
	}

	button:hover {
		color: var(--text);
	}

	button.is-active {
		background: var(--bg-elev);
		color: var(--text);
		box-shadow: 0 0 0 1px var(--border);
	}
</style>
