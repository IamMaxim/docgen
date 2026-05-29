// Registry
export {
	createRegistry,
	defaultDocGlob,
	type Registry,
	type CreateRegistryOptions,
	type RawDocModule,
	type DocModuleMap,
	type DocRawMap,
	type DocMeta,
	type DocTreeNode,
	type DocHeading,
	type DocCallout,
	type SearchDocument,
	type DocGraph,
	type DocGraphNode,
	type DocGraphEdge,
	type LinkGraphFile
} from './registry.ts';

// Config
export { defineConfig, validateConfig, type DocsSiteConfig } from './config.ts';

// Paths
export { createPaths, type DocPaths } from './paths.ts';

// Context (registry provider)
export { setDocgenRegistry, useDocgenRegistry, tryDocgenRegistry } from './context.ts';
export { default as DocgenProvider } from './components/DocgenProvider.svelte';

// Components — top-level
export { default as DocShell } from './components/DocShell.svelte';
export { default as Topbar } from './components/Topbar.svelte';
export { default as SearchModal } from './components/SearchModal.svelte';
export { default as DocTree } from './components/DocTree.svelte';
export { default as RightRail } from './components/RightRail.svelte';
export { default as SettingsMenu } from './components/SettingsMenu.svelte';
export { default as ThemeToggle } from './components/ThemeToggle.svelte';
export { default as MermaidHydrate } from './components/MermaidHydrate.svelte';
export { default as WikilinkTooltip } from './components/WikilinkTooltip.svelte';
export { default as LayerNav } from './components/LayerNav.svelte';
export { default as DocPageView } from './components/DocPageView.svelte';
export { default as DocDiffView } from './components/DocDiffView.svelte';
export { default as DocEditorView } from './components/DocEditorView.svelte';
export { default as DocEditorPreview } from './components/DocEditorPreview.svelte';
export { default as DocSourceEditor } from './components/DocSourceEditor.svelte';
export { default as HomeDocGraph } from './components/HomeDocGraph.svelte';
export { default as Icon } from './components/Icon.svelte';

// Page shells
export { default as DocsSlugPage } from './pages/DocsSlugPage.svelte';
export { default as DocsIndexPage } from './pages/DocsIndexPage.svelte';
export { default as DiffPage } from './pages/DiffPage.svelte';
export { default as EditPage } from './pages/EditPage.svelte';

// Loaders (universal — safe for browser builds)
export {
	makeDocsIndexLoad,
	makeDocsSlugLoad,
	makeDocsSlugEntries,
	makeDocPageLoad,
	makeDocPageEntries,
	makeHomeLoad
} from './loaders/index.ts';

// Stores & actions
export { theme, rightRailCollapsed, fullWidth, leftRailWidth, type Theme } from './stores/ui-prefs.ts';
export { resizable } from './actions/resizable.ts';
export { scrollSync } from './actions/scroll-sync.ts';

// Platform
export { IS_MAC, shortcutLabel } from './platform.ts';

// Sentinel
export const PACKAGE_NAME = 'docgen';
