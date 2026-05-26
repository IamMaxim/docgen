// Svelte preprocessor: swap `|` inside [[wikilink|label]] patterns for a
// private-use sentinel (U+E000) so the markdown table parser does not split
// table cells on that pipe. The wikilink remark plugin restores the sentinel
// to `|` before parsing the target/label split. The sentinel never appears in
// rendered output because the remark plugin consumes the `[[...]]` segment.
// @ts-check

export const WIKILINK_PIPE_SENTINEL = '';
const WIKILINK_RE = /\[\[([^\]\n]+)\]\]/g;

export default function escapeWikilinkPipes() {
	return {
		name: 'escape-wikilink-pipes',
		/** @param {{ content: string; filename?: string }} input */
		markup({ content, filename }) {
			if (filename && !/\.(md|svx)$/.test(filename)) return;
			let changed = false;
			/** @param {string} match @param {string} inner */
			const next = content.replace(WIKILINK_RE, (match, inner) => {
				if (!inner.includes('|')) return match;
				changed = true;
				return `[[${inner.replace(/\|/g, WIKILINK_PIPE_SENTINEL)}]]`;
			});
			if (!changed) return;
			return { code: next };
		}
	};
}
