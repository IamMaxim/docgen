import { browser } from "$app/environment";
import { writable, type Writable } from "svelte/store";

export type Theme = "light" | "dark";

export const UI_PREF_KEYS = {
  theme: "doc-theme",
  rightRailCollapsed: "doc-right-rail-collapsed",
  fullWidth: "doc-full-width",
  leftRailWidth: "doc-left-rail-width",
  diffRailWidth: "doc-diff-rail-w",
  diffFilesWidth: "doc-diff-files-w",
} as const;

export const THEME_EVENT = "docgen-theme";

function persisted<T>(
  key: string,
  initial: T,
  parse: (raw: string) => T | undefined,
): Writable<T> {
  const store = writable<T>(initial);
  if (!browser) return store;
  const raw = localStorage.getItem(key);
  if (raw !== null) {
    const parsed = parse(raw);
    if (parsed !== undefined) store.set(parsed);
  }
  store.subscribe((value) => {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      /* ignore quota / privacy errors */
    }
  });
  return store;
}

const parseBool = (raw: string) =>
  raw === "true" ? true : raw === "false" ? false : undefined;
const parseClampedInt = (min: number, max: number) => (raw: string) => {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
};
const parseTheme = (raw: string): Theme | undefined =>
  raw === "light" || raw === "dark" ? raw : undefined;

function initialTheme(): Theme {
  if (!browser) return "dark";
  const stored = localStorage.getItem(UI_PREF_KEYS.theme);
  const parsed = stored ? parseTheme(stored) : undefined;
  if (parsed) return parsed;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export const theme = persisted<Theme>(
  UI_PREF_KEYS.theme,
  initialTheme(),
  parseTheme,
);

if (browser) {
  theme.subscribe((value) => {
    document.documentElement.dataset.theme = value;
    window.dispatchEvent(new CustomEvent(THEME_EVENT));
  });
}

export const rightRailCollapsed = persisted<boolean>(
  UI_PREF_KEYS.rightRailCollapsed,
  false,
  parseBool,
);
export const fullWidth = persisted<boolean>(
  UI_PREF_KEYS.fullWidth,
  false,
  parseBool,
);
export const leftRailWidth = persisted<number>(
  UI_PREF_KEYS.leftRailWidth,
  264,
  parseClampedInt(180, 560),
);
export const diffRailWidth = persisted<number>(
  UI_PREF_KEYS.diffRailWidth,
  200,
  parseClampedInt(140, 500),
);
export const diffFilesWidth = persisted<number>(
  UI_PREF_KEYS.diffFilesWidth,
  200,
  parseClampedInt(140, 500),
);
