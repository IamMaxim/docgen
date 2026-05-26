import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import {
	DEFAULT_EDITOR_THEME,
	isEditorThemeId,
	type EditorThemeId
} from './editor-themes';

const STORAGE_KEY = 'doc-editor-theme';

function readInitial(): EditorThemeId {
	if (!browser) return DEFAULT_EDITOR_THEME;
	const stored = localStorage.getItem(STORAGE_KEY);
	return isEditorThemeId(stored) ? stored : DEFAULT_EDITOR_THEME;
}

export const editorThemeId = writable<EditorThemeId>(readInitial());

if (browser) {
	editorThemeId.subscribe((value) => {
		try {
			localStorage.setItem(STORAGE_KEY, value);
		} catch {
			/* ignore quota / privacy errors */
		}
	});
}
