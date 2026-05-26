import { RangeSetBuilder } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view';

// [[target]] or [[target|label]]
const WIKILINK_RE = /\[\[([^\]\n|]+?)(?:\|([^\]\n]+?))?\]\]/g;

const bracketMark = Decoration.mark({ class: 'cm-wikilink-bracket' });
const targetMark = Decoration.mark({ class: 'cm-wikilink-target' });
const labelMark = Decoration.mark({ class: 'cm-wikilink-label' });

function buildDecorations(view: EditorView): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();
	for (const { from, to } of view.visibleRanges) {
		const text = view.state.doc.sliceString(from, to);
		WIKILINK_RE.lastIndex = 0;
		let m: RegExpExecArray | null;
		while ((m = WIKILINK_RE.exec(text))) {
			const matchStart = from + m.index;
			const matchEnd = matchStart + m[0].length;
			const targetStart = matchStart + 2;
			const targetEnd = targetStart + m[1].length;
			builder.add(matchStart, targetStart, bracketMark); // [[
			builder.add(targetStart, targetEnd, targetMark);
			if (m[2] !== undefined) {
				const pipeStart = targetEnd;
				const pipeEnd = pipeStart + 1;
				const labelStart = pipeEnd;
				const labelEnd = labelStart + m[2].length;
				builder.add(pipeStart, pipeEnd, bracketMark);
				builder.add(labelStart, labelEnd, labelMark);
			}
			builder.add(matchEnd - 2, matchEnd, bracketMark); // ]]
		}
	}
	return builder.finish();
}

export const wikilinkHighlighter = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;
		constructor(view: EditorView) {
			this.decorations = buildDecorations(view);
		}
		update(u: ViewUpdate) {
			if (u.docChanged || u.viewportChanged) {
				this.decorations = buildDecorations(u.view);
			}
		}
	},
	{ decorations: (v) => v.decorations }
);
