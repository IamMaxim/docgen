import { browser } from '$app/environment';
import { base } from '$app/paths';
import {
	autocompletion,
	type Completion,
	type CompletionContext,
	type CompletionResult
} from '@codemirror/autocomplete';
import type { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

interface WikilinkEntry {
	id: string;
	title: string;
	path: string;
	titleLower: string;
	idLower: string;
	pathLower: string;
}

interface MatchResult {
	score: number;
	titleIndices: number[];
	pathIndices: number[];
}

let entriesCache: WikilinkEntry[] | null = null;
let entriesPromise: Promise<WikilinkEntry[]> | null = null;

async function loadEntries(): Promise<WikilinkEntry[]> {
	if (entriesCache) return entriesCache;
	if (!entriesPromise) {
		entriesPromise = fetch(`${base}/search-index.json`)
			.then((r) => r.json())
			.then((arr: Array<{ id: string; title: string; path: string }>) => {
				const out: WikilinkEntry[] = arr.map((d) => ({
					id: d.id,
					title: d.title,
					path: d.path,
					titleLower: d.title.toLowerCase(),
					idLower: d.id.toLowerCase(),
					pathLower: d.path.toLowerCase()
				}));
				entriesCache = out;
				return out;
			});
	}
	return entriesPromise;
}

if (browser) {
	loadEntries().catch(() => {
		entriesPromise = null;
	});
}

function fuzzyScan(query: string, target: string): { score: number; indices: number[] } | null {
	if (!query) return { score: 0, indices: [] };
	const indices: number[] = [];
	let q = 0;
	let lastPos = -2;
	let run = 0;
	let score = 0;
	for (let t = 0; t < target.length && q < query.length; t++) {
		if (target[t] === query[q]) {
			indices.push(t);
			run = t === lastPos + 1 ? run + 1 : 1;
			const prev = t > 0 ? target[t - 1] : '/';
			if (/[\\/\-_ .]/.test(prev)) score += 6;
			if (t === 0) score += 8;
			score += run * 2;
			lastPos = t;
			q++;
		}
	}
	if (q < query.length) return null;
	score -= target.length * 0.04;
	return { score, indices };
}

function matchEntry(query: string, entry: WikilinkEntry): MatchResult | null {
	if (!query) {
		return { score: 0, titleIndices: [], pathIndices: [] };
	}
	const q = query.toLowerCase();
	const titleMatch = fuzzyScan(q, entry.titleLower);
	const pathMatch = fuzzyScan(q, entry.idLower) ?? fuzzyScan(q, entry.pathLower);
	if (!titleMatch && !pathMatch) return null;
	const titleScore = titleMatch ? titleMatch.score + 5 : -Infinity;
	const pathScore = pathMatch ? pathMatch.score : -Infinity;
	const best = Math.max(titleScore, pathScore);
	return {
		score: best,
		titleIndices: titleMatch ? titleMatch.indices : [],
		pathIndices: pathMatch ? pathMatch.indices : []
	};
}

function renderHighlighted(text: string, indices: number[], extraClass: string): HTMLElement {
	const wrapper = document.createElement('span');
	wrapper.className = extraClass;
	if (!indices.length) {
		wrapper.textContent = text;
		return wrapper;
	}
	let cursor = 0;
	for (const idx of indices) {
		if (idx > cursor) {
			wrapper.appendChild(document.createTextNode(text.slice(cursor, idx)));
		}
		const mark = document.createElement('span');
		mark.className = 'cm-wikilink-suggestion__match';
		mark.textContent = text[idx];
		wrapper.appendChild(mark);
		cursor = idx + 1;
	}
	if (cursor < text.length) {
		wrapper.appendChild(document.createTextNode(text.slice(cursor)));
	}
	return wrapper;
}

function buildCompletion(
	entry: WikilinkEntry,
	match: MatchResult,
	from: number,
	to: number
): Completion {
	return {
		label: entry.title,
		boost: match.score,
		apply(view, _completion, applyFrom, applyTo) {
			const state = view.state;
			let end = applyTo;
			// Swallow auto-closed `]]` (or single `]`) if it follows the replacement range.
			const tail = state.doc.sliceString(end, Math.min(end + 2, state.doc.length));
			if (tail.startsWith(']]')) end += 2;
			else if (tail.startsWith(']')) end += 1;
			const insert = `${entry.id}|${entry.title}]]`;
			view.dispatch({
				changes: { from: applyFrom, to: end, insert },
				selection: { anchor: applyFrom + insert.length }
			});
		},
		info() {
			const el = document.createElement('div');
			el.className = 'cm-wikilink-suggestion__info';
			el.textContent = entry.path;
			return el;
		},
		// Stash data for the custom renderer.
		_wikilink: { entry, match, from, to }
	} as Completion & {
		_wikilink: { entry: WikilinkEntry; match: MatchResult; from: number; to: number };
	};
}

async function wikilinkSource(context: CompletionContext): Promise<CompletionResult | null> {
	// Match the wikilink "open bracket" prefix at the cursor.
	const line = context.state.doc.lineAt(context.pos);
	const beforeCursor = line.text.slice(0, context.pos - line.from);
	const openMatch = /\[\[([^\]\n|]*)$/.exec(beforeCursor);
	if (!openMatch) return null;
	const queryRaw = openMatch[1];
	const queryStart = context.pos - queryRaw.length;
	const queryEnd = context.pos;
	if (!context.explicit && queryRaw.length === 0) {
		// Trigger on `[[` without typing yet only when typed (explicit also covered).
	}
	const entries = await loadEntries();
	const scored: Array<{ entry: WikilinkEntry; match: MatchResult }> = [];
	for (const entry of entries) {
		const match = matchEntry(queryRaw, entry);
		if (match) scored.push({ entry, match });
	}
	scored.sort((a, b) => b.match.score - a.match.score);
	// For non-empty queries drop weak matches so the popup stays signal-heavy.
	const minScore = queryRaw.length >= 2 ? queryRaw.length * 3 : -Infinity;
	const filtered = queryRaw ? scored.filter((s) => s.match.score >= minScore) : scored;
	const top = filtered.slice(0, 30);
	return {
		from: queryStart,
		to: queryEnd,
		filter: false,
		options: top.map((s) => buildCompletion(s.entry, s.match, queryStart, queryEnd))
	};
}

function renderWikilinkOption(
	completion: Completion,
	_state: EditorState,
	_view: EditorView
): Node | null {
	const data = (
		completion as Completion & {
			_wikilink?: { entry: WikilinkEntry; match: MatchResult };
		}
	)._wikilink;
	if (!data) return null;
	const wrap = document.createElement('div');
	wrap.className = 'cm-wikilink-suggestion';
	wrap.appendChild(
		renderHighlighted(data.entry.title, data.match.titleIndices, 'cm-wikilink-suggestion__title')
	);
	wrap.appendChild(
		renderHighlighted(data.entry.id, data.match.pathIndices, 'cm-wikilink-suggestion__path')
	);
	return wrap;
}

export const wikilinkAutocompletion = autocompletion({
	override: [wikilinkSource],
	activateOnTyping: true,
	closeOnBlur: true,
	maxRenderedOptions: 30,
	defaultKeymap: true,
	icons: false,
	addToOptions: [
		{
			render: renderWikilinkOption,
			position: 20
		}
	]
});
