import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

export type EditorThemeId =
  | "default"
  | "github-light"
  | "github-dark"
  | "monokai"
  | "solarized-light"
  | "solarized-dark"
  | "dracula"
  | "one-dark";

export interface EditorThemeMeta {
  id: EditorThemeId;
  label: string;
  isDark: boolean;
  swatch: string;
}

interface Palette {
  bg: string;
  fg: string;
  gutterBg: string;
  gutterFg: string;
  activeLine: string;
  activeLineGutter: string;
  selection: string;
  cursor: string;
  border: string;
  heading: string;
  strong: string;
  emphasis: string;
  link: string;
  url: string;
  code: string;
  quote: string;
  list: string;
  meta: string;
  comment: string;
  keyword: string;
  atom: string;
  string: string;
  number: string;
  regexp: string;
  error: string;
}

function buildTheme(p: Palette, dark: boolean): Extension {
  const view = EditorView.theme(
    {
      "&": {
        height: "100%",
        color: p.fg,
        backgroundColor: p.bg,
      },
      ".cm-scroller": {
        fontFamily: "var(--font-mono)",
        fontSize: "13px",
        lineHeight: "1.55",
      },
      ".cm-content": {
        caretColor: p.cursor,
      },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: p.cursor,
      },
      "&.cm-focused .cm-selectionBackground, ::selection": {
        backgroundColor: `${p.selection} !important`,
      },
      ".cm-selectionBackground": {
        backgroundColor: `${p.selection} !important`,
      },
      ".cm-activeLine": {
        backgroundColor: p.activeLine,
      },
      ".cm-activeLineGutter": {
        backgroundColor: "transparent",
        color: p.fg,
      },
      ".cm-gutters": {
        backgroundColor: p.gutterBg,
        color: p.gutterFg,
        borderRight: `1px solid ${p.border}`,
      },
      ".cm-focused": { outline: "none" },
      ".cm-deletedChunk, .cm-changedLine, .cm-insertedLine": {
        backgroundColor: dark
          ? "rgba(255,200,80,0.10)"
          : "rgba(180,120,20,0.10)",
      },
      ".cm-wikilink-bracket, .cm-wikilink-bracket > span": {
        color: `${p.meta} !important`,
      },
      ".cm-wikilink-target, .cm-wikilink-target > span": {
        color: `${p.link} !important`,
      },
      ".cm-wikilink-label, .cm-wikilink-label > span": {
        color: `${p.strong} !important`,
        fontWeight: "600",
      },
    },
    { dark },
  );

  const highlight = HighlightStyle.define([
    { tag: t.heading1, color: p.heading, fontWeight: "700" },
    { tag: t.heading2, color: p.heading, fontWeight: "700" },
    { tag: t.heading3, color: p.heading, fontWeight: "600" },
    {
      tag: [t.heading4, t.heading5, t.heading6],
      color: p.heading,
      fontWeight: "600",
    },
    { tag: t.strong, color: p.strong, fontWeight: "700" },
    { tag: t.emphasis, color: p.emphasis, fontStyle: "italic" },
    { tag: t.strikethrough, color: p.meta, textDecoration: "line-through" },
    { tag: t.link, color: p.link },
    { tag: t.url, color: p.url, textDecoration: "underline" },
    { tag: t.monospace, color: p.code },
    { tag: t.quote, color: p.quote, fontStyle: "italic" },
    { tag: t.processingInstruction, color: p.list },
    { tag: t.meta, color: p.meta },
    { tag: t.comment, color: p.comment, fontStyle: "italic" },
    { tag: t.keyword, color: p.keyword },
    { tag: [t.atom, t.bool, t.special(t.variableName)], color: p.atom },
    { tag: [t.number, t.literal], color: p.number },
    { tag: [t.string, t.special(t.string)], color: p.string },
    { tag: [t.regexp, t.escape], color: p.regexp },
    { tag: t.contentSeparator, color: p.meta },
    { tag: t.invalid, color: p.error },
  ]);

  return [view, syntaxHighlighting(highlight)];
}

function buildVarTheme(): Extension {
  const view = EditorView.theme({
    "&": {
      height: "100%",
      color: "var(--text)",
      backgroundColor: "var(--surface)",
    },
    ".cm-scroller": {
      fontFamily: "var(--font-mono)",
      fontSize: "13px",
      lineHeight: "1.55",
    },
    ".cm-content": { caretColor: "var(--accent)" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--accent)" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "var(--accent-soft) !important",
    },
    ".cm-activeLine": { backgroundColor: "var(--bg-soft)" },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent",
      color: "var(--text)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--bg-elev)",
      color: "var(--text-mute)",
      borderRight: "1px solid var(--border)",
    },
    ".cm-focused": { outline: "none" },
    ".cm-deletedChunk, .cm-changedLine, .cm-insertedLine": {
      backgroundColor: "var(--warn-soft)",
    },
    ".cm-wikilink-bracket, .cm-wikilink-bracket > span": {
      color: "var(--text-mute) !important",
    },
    ".cm-wikilink-target, .cm-wikilink-target > span": {
      color: "var(--info) !important",
    },
    ".cm-wikilink-label, .cm-wikilink-label > span": {
      color: "var(--text) !important",
      fontWeight: "600",
    },
  });

  const highlight = HighlightStyle.define([
    { tag: t.heading1, color: "var(--accent)", fontWeight: "700" },
    { tag: t.heading2, color: "var(--accent)", fontWeight: "700" },
    { tag: t.heading3, color: "var(--accent)", fontWeight: "600" },
    {
      tag: [t.heading4, t.heading5, t.heading6],
      color: "var(--accent)",
      fontWeight: "600",
    },
    { tag: t.strong, color: "var(--text)", fontWeight: "700" },
    { tag: t.emphasis, color: "var(--text)", fontStyle: "italic" },
    {
      tag: t.strikethrough,
      color: "var(--text-mute)",
      textDecoration: "line-through",
    },
    { tag: t.link, color: "var(--info)" },
    { tag: t.url, color: "var(--info)", textDecoration: "underline" },
    { tag: t.monospace, color: "var(--warn)" },
    { tag: t.quote, color: "var(--talk)", fontStyle: "italic" },
    { tag: t.processingInstruction, color: "var(--accent)" },
    { tag: t.meta, color: "var(--text-mute)" },
    { tag: t.comment, color: "var(--text-mute)", fontStyle: "italic" },
    { tag: t.keyword, color: "var(--talk)" },
    { tag: [t.atom, t.bool, t.special(t.variableName)], color: "var(--info)" },
    { tag: [t.number, t.literal], color: "var(--warn)" },
    { tag: [t.string, t.special(t.string)], color: "var(--info)" },
    { tag: [t.regexp, t.escape], color: "var(--warn)" },
    { tag: t.contentSeparator, color: "var(--text-mute)" },
    { tag: t.invalid, color: "var(--text-error)" },
  ]);

  return [view, syntaxHighlighting(highlight)];
}

// --- Palettes (carefully curated to mirror the named themes) -------------

const githubLight: Palette = {
  bg: "#ffffff",
  fg: "#1f2328",
  gutterBg: "#f6f8fa",
  gutterFg: "#8c959f",
  activeLine: "#f6f8fa",
  activeLineGutter: "#eaeef2",
  selection: "rgba(84,174,255,0.30)",
  cursor: "#0969da",
  border: "#d0d7de",
  heading: "#0550ae",
  strong: "#1f2328",
  emphasis: "#1f2328",
  link: "#0969da",
  url: "#0969da",
  code: "#953800",
  quote: "#6f42c1",
  list: "#0550ae",
  meta: "#6e7781",
  comment: "#6e7781",
  keyword: "#cf222e",
  atom: "#0550ae",
  string: "#0a3069",
  number: "#0550ae",
  regexp: "#116329",
  error: "#cf222e",
};

const githubDark: Palette = {
  bg: "#0d1117",
  fg: "#e6edf3",
  gutterBg: "#0d1117",
  gutterFg: "#6e7681",
  activeLine: "#161b22",
  activeLineGutter: "#161b22",
  selection: "rgba(56,139,253,0.30)",
  cursor: "#58a6ff",
  border: "#30363d",
  heading: "#79c0ff",
  strong: "#e6edf3",
  emphasis: "#e6edf3",
  link: "#58a6ff",
  url: "#58a6ff",
  code: "#ffa657",
  quote: "#d2a8ff",
  list: "#79c0ff",
  meta: "#8b949e",
  comment: "#8b949e",
  keyword: "#ff7b72",
  atom: "#79c0ff",
  string: "#a5d6ff",
  number: "#79c0ff",
  regexp: "#7ee787",
  error: "#ff7b72",
};

const monokai: Palette = {
  bg: "#272822",
  fg: "#f8f8f2",
  gutterBg: "#272822",
  gutterFg: "#75715e",
  activeLine: "#3e3d32",
  activeLineGutter: "#3e3d32",
  selection: "rgba(73,72,62,0.99)",
  cursor: "#f8f8f0",
  border: "#3e3d32",
  heading: "#a6e22e",
  strong: "#f8f8f2",
  emphasis: "#f8f8f2",
  link: "#66d9ef",
  url: "#66d9ef",
  code: "#e6db74",
  quote: "#ae81ff",
  list: "#fd971f",
  meta: "#75715e",
  comment: "#75715e",
  keyword: "#f92672",
  atom: "#ae81ff",
  string: "#e6db74",
  number: "#ae81ff",
  regexp: "#fd971f",
  error: "#f92672",
};

const solarizedLight: Palette = {
  bg: "#fdf6e3",
  fg: "#586e75",
  gutterBg: "#eee8d5",
  gutterFg: "#93a1a1",
  activeLine: "#eee8d5",
  activeLineGutter: "#e3dbb6",
  selection: "rgba(7,54,66,0.15)",
  cursor: "#586e75",
  border: "#e3dbb6",
  heading: "#268bd2",
  strong: "#073642",
  emphasis: "#586e75",
  link: "#268bd2",
  url: "#268bd2",
  code: "#d33682",
  quote: "#6c71c4",
  list: "#cb4b16",
  meta: "#93a1a1",
  comment: "#93a1a1",
  keyword: "#859900",
  atom: "#d33682",
  string: "#2aa198",
  number: "#d33682",
  regexp: "#dc322f",
  error: "#dc322f",
};

const solarizedDark: Palette = {
  bg: "#002b36",
  fg: "#93a1a1",
  gutterBg: "#073642",
  gutterFg: "#586e75",
  activeLine: "#073642",
  activeLineGutter: "#0a3a47",
  selection: "rgba(238,232,213,0.15)",
  cursor: "#93a1a1",
  border: "#0a3a47",
  heading: "#268bd2",
  strong: "#fdf6e3",
  emphasis: "#93a1a1",
  link: "#268bd2",
  url: "#268bd2",
  code: "#d33682",
  quote: "#6c71c4",
  list: "#cb4b16",
  meta: "#586e75",
  comment: "#586e75",
  keyword: "#859900",
  atom: "#d33682",
  string: "#2aa198",
  number: "#d33682",
  regexp: "#dc322f",
  error: "#dc322f",
};

const dracula: Palette = {
  bg: "#282a36",
  fg: "#f8f8f2",
  gutterBg: "#282a36",
  gutterFg: "#6272a4",
  activeLine: "#343746",
  activeLineGutter: "#343746",
  selection: "rgba(68,71,90,0.99)",
  cursor: "#f8f8f0",
  border: "#44475a",
  heading: "#bd93f9",
  strong: "#f8f8f2",
  emphasis: "#f8f8f2",
  link: "#8be9fd",
  url: "#8be9fd",
  code: "#f1fa8c",
  quote: "#ff79c6",
  list: "#ffb86c",
  meta: "#6272a4",
  comment: "#6272a4",
  keyword: "#ff79c6",
  atom: "#bd93f9",
  string: "#f1fa8c",
  number: "#bd93f9",
  regexp: "#ffb86c",
  error: "#ff5555",
};

const oneDark: Palette = {
  bg: "#282c34",
  fg: "#abb2bf",
  gutterBg: "#282c34",
  gutterFg: "#495162",
  activeLine: "#2c313a",
  activeLineGutter: "#2c313a",
  selection: "rgba(58,103,178,0.55)",
  cursor: "#528bff",
  border: "#3e4451",
  heading: "#e06c75",
  strong: "#abb2bf",
  emphasis: "#abb2bf",
  link: "#61afef",
  url: "#61afef",
  code: "#98c379",
  quote: "#56b6c2",
  list: "#d19a66",
  meta: "#5c6370",
  comment: "#5c6370",
  keyword: "#c678dd",
  atom: "#d19a66",
  string: "#98c379",
  number: "#d19a66",
  regexp: "#56b6c2",
  error: "#e06c75",
};

const registry: Record<
  EditorThemeId,
  { meta: EditorThemeMeta; build: () => Extension }
> = {
  default: {
    meta: {
      id: "default",
      label: "docgen (matches theme)",
      isDark: true,
      swatch: "var(--accent)",
    },
    build: buildVarTheme,
  },
  "github-light": {
    meta: {
      id: "github-light",
      label: "GitHub Light",
      isDark: false,
      swatch: "#0969da",
    },
    build: () => buildTheme(githubLight, false),
  },
  "github-dark": {
    meta: {
      id: "github-dark",
      label: "GitHub Dark",
      isDark: true,
      swatch: "#58a6ff",
    },
    build: () => buildTheme(githubDark, true),
  },
  monokai: {
    meta: { id: "monokai", label: "Monokai", isDark: true, swatch: "#a6e22e" },
    build: () => buildTheme(monokai, true),
  },
  "solarized-light": {
    meta: {
      id: "solarized-light",
      label: "Solarized Light",
      isDark: false,
      swatch: "#268bd2",
    },
    build: () => buildTheme(solarizedLight, false),
  },
  "solarized-dark": {
    meta: {
      id: "solarized-dark",
      label: "Solarized Dark",
      isDark: true,
      swatch: "#2aa198",
    },
    build: () => buildTheme(solarizedDark, true),
  },
  dracula: {
    meta: { id: "dracula", label: "Dracula", isDark: true, swatch: "#bd93f9" },
    build: () => buildTheme(dracula, true),
  },
  "one-dark": {
    meta: {
      id: "one-dark",
      label: "One Dark",
      isDark: true,
      swatch: "#e06c75",
    },
    build: () => buildTheme(oneDark, true),
  },
};

export const EDITOR_THEMES: EditorThemeMeta[] = Object.values(registry).map(
  (e) => e.meta,
);
export const DEFAULT_EDITOR_THEME: EditorThemeId = "default";

export function buildEditorTheme(id: EditorThemeId): Extension {
  return (registry[id] ?? registry[DEFAULT_EDITOR_THEME]).build();
}

export function isEditorThemeId(value: unknown): value is EditorThemeId {
  return typeof value === "string" && value in registry;
}
