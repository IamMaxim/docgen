<script lang="ts">
	import { editorThemeId } from '$lib/editor-theme-store';
	import { EDITOR_THEMES } from '$lib/editor-themes';
	import { wordWrap } from '$lib/editor-prefs-store';
	import Icon from './Icon.svelte';

	let open = $state(false);
	let host: HTMLDivElement | undefined = $state();

	function toggle() {
		open = !open;
	}

	function close() {
		open = false;
	}

	function onDocPointer(event: MouseEvent) {
		if (!open) return;
		const target = event.target as Node | null;
		if (host && target && !host.contains(target)) close();
	}

	function onKey(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) close();
	}
</script>

<svelte:window onmousedown={onDocPointer} onkeydown={onKey} />

<div class="settings-menu" bind:this={host}>
	<button
		type="button"
		class="icon-btn"
		class:is-active={open}
		aria-haspopup="menu"
		aria-expanded={open}
		aria-label="Editor settings"
		title="Editor settings"
		onclick={toggle}
	>
		<Icon name="menu" />
	</button>

	{#if open}
		<div class="panel" role="menu" aria-label="Editor settings">
			<div class="panel__label">Options</div>
			<label class="toggle-row">
				<input
					type="checkbox"
					checked={$wordWrap}
					onchange={(e) => wordWrap.set((e.currentTarget as HTMLInputElement).checked)}
				/>
				<span>Word wrap</span>
			</label>
			<div class="panel__divider"></div>
			<div class="panel__label">Editor theme</div>
			<ul class="theme-list">
				{#each EDITOR_THEMES as theme (theme.id)}
					<li>
						<button
							type="button"
							role="menuitemradio"
							aria-checked={$editorThemeId === theme.id}
							class="theme-item"
							class:is-active={$editorThemeId === theme.id}
							onclick={() => {
								editorThemeId.set(theme.id);
								close();
							}}
						>
							<span class="swatch" style:background={theme.swatch} aria-hidden="true"></span>
							<span class="name">{theme.label}</span>
							{#if $editorThemeId === theme.id}
								<span class="check" aria-hidden="true"><Icon name="check" size={12} /></span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.settings-menu {
		position: relative;
		display: inline-flex;
	}

	.panel {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		min-width: 220px;
		padding: 8px;
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		background: var(--bg-elev);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
		z-index: 40;
	}

	.panel__label {
		padding: 4px 8px 6px;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-mute);
	}

	.panel__divider {
		height: 1px;
		margin: 6px 0;
		background: var(--border);
	}

	.toggle-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 8px;
		border-radius: var(--r-sm);
		color: var(--text);
		font-size: 13px;
		cursor: pointer;
	}

	.toggle-row:hover {
		background: var(--bg-soft);
	}

	.toggle-row input {
		accent-color: var(--accent);
		cursor: pointer;
	}

	.theme-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.theme-item {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 6px 8px;
		border: 0;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--text-dim);
		font: inherit;
		font-size: 13px;
		text-align: left;
	}

	.theme-item:hover {
		background: var(--bg-soft);
		color: var(--text);
	}

	.theme-item.is-active {
		color: var(--text);
	}

	.swatch {
		width: 14px;
		height: 14px;
		border-radius: 999px;
		border: 1px solid var(--border-strong);
		flex: 0 0 auto;
	}

	.name {
		flex: 1;
	}

	.check {
		display: inline-grid;
		place-items: center;
		color: var(--accent);
	}
</style>
