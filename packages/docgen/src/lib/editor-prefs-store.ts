import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const WRAP_KEY = 'doc-editor-wrap';

function readInitialWrap(): boolean {
	if (!browser) return true;
	const stored = localStorage.getItem(WRAP_KEY);
	return stored === null ? true : stored === 'true';
}

export const wordWrap = writable<boolean>(readInitialWrap());

if (browser) {
	wordWrap.subscribe((value) => {
		try {
			localStorage.setItem(WRAP_KEY, String(value));
		} catch {
			/* ignore */
		}
	});
}
