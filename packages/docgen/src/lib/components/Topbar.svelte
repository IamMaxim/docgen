<script lang="ts">
  import { resolve } from "$app/paths";
  import Icon from "./Icon.svelte";
  import ThemeToggle from "./ThemeToggle.svelte";

  type Theme = "light" | "dark";

  let {
    theme,
    onTheme,
    onSearch,
    onToggleRightRail,
    onToggleFullWidth,
    rightRailCollapsed,
    fullWidth = false,
    docsControlsAvailable = true,
    editorSlug = null,
    siteTitle = "Wiki",
  }: {
    theme: Theme;
    onTheme: (theme: Theme) => void;
    onSearch: () => void;
    onToggleRightRail: () => void;
    onToggleFullWidth: () => void;
    rightRailCollapsed: boolean;
    fullWidth?: boolean;
    docsControlsAvailable?: boolean;
    editorSlug?: string[] | null;
    siteTitle?: string;
  } = $props();
</script>

<header class="topbar">
  <a class="topbar__brand" href={resolve("/")} aria-label={`${siteTitle} home`}>
    <span class="brand-mark" aria-hidden="true"></span>
    <span class="brand-name">{siteTitle}</span>
  </a>

  <div class="topbar__main">
    <button type="button" class="search-trigger" onclick={onSearch}>
      <Icon name="search" />
      <span class="label">Search pages, headings, Rust refs…</span>
      <span class="kbd">⌘K</span>
    </button>

    <div class="topbar__actions">
      {#if docsControlsAvailable}
        <div class="btn-strip">
          <a
            class="icon-only"
            href="/docs/diff"
            aria-label="Show documentation diff"
            title="Show documentation diff"
          >
            <Icon name="diff" />
          </a>
          {#if editorSlug}
            {#if editorSlug.length === 0}
              <a
                class="icon-only"
                href="/docs/edit"
                aria-label="Edit documentation page"
                title="Edit documentation page"
              >
                <Icon name="edit" />
              </a>
            {:else}
              <a
                class="icon-only"
                href={`/docs/edit/${editorSlug.join("/")}`}
                aria-label="Edit documentation page"
                title="Edit documentation page"
              >
                <Icon name="edit" />
              </a>
            {/if}
          {/if}
          <button
            type="button"
            class="icon-only"
            class:is-active={fullWidth}
            onclick={onToggleFullWidth}
            aria-label={fullWidth
              ? "Use centered page width"
              : "Use full page width"}
            title={fullWidth
              ? "Use centered page width"
              : "Use full page width"}
          >
            <Icon name="maximize" />
          </button>
          <button
            type="button"
            class="icon-only"
            class:is-active={!rightRailCollapsed}
            onclick={onToggleRightRail}
            aria-label={rightRailCollapsed
              ? "Show page info"
              : "Hide page info"}
            title={rightRailCollapsed ? "Show page info" : "Hide page info"}
          >
            <Icon name="menu" />
          </button>
        </div>
      {/if}
      <ThemeToggle {theme} onSelect={onTheme} />
    </div>
  </div>
</header>

<style>
  .topbar {
    position: sticky;
    top: 0;
    z-index: 30;
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: var(--left-rail-width) minmax(0, 1fr);
    height: var(--topbar-height);
    box-sizing: border-box;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--bg) 92%, transparent);
    backdrop-filter: blur(8px);
  }

  .topbar__brand {
    display: flex;
    align-items: center;
    gap: 10px;
    height: var(--topbar-height);
    padding: 0 18px;
    border-right: 1px solid var(--border);
    color: var(--text);
    text-decoration: none;
  }

  .topbar__brand:hover {
    background: var(--bg-soft);
  }

  .brand-mark {
    position: relative;
    display: inline-grid;
    place-items: center;
    width: 22px;
    height: 22px;
  }

  .brand-mark::before,
  .brand-mark::after {
    content: "";
    position: absolute;
    inset: 0;
    border: 1px solid var(--text);
  }

  .brand-mark::after {
    transform: rotate(45deg) scale(0.62);
    border-color: var(--accent);
    background: var(--accent);
  }

  .brand-name {
    font-size: 14px;
    font-weight: 500;
  }

  .topbar__main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    height: var(--topbar-height);
    padding: 0 22px;
    min-width: 0;
  }

  .search-trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: min(360px, 42vw);
    height: 32px;
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    background: var(--surface);
    color: var(--text-dim);
    font-size: 13px;
  }

  .search-trigger:hover {
    border-color: var(--border-strong);
    background: var(--surface-hi);
  }

  .search-trigger .label {
    flex: 1;
    min-width: 0;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .topbar__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  @media (max-width: 860px) {
    .topbar {
      grid-template-columns: 1fr;
    }

    .topbar__brand {
      display: none;
    }

    .topbar__main {
      padding: 0 12px;
    }

    .search-trigger {
      min-width: 0;
      flex: 1;
    }
  }
</style>
