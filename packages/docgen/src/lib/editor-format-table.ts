import type { Command } from '@codemirror/view';

type Align = 'none' | 'left' | 'right' | 'center';

function splitCells(inner: string): string[] {
	const cells: string[] = [];
	let buf = '';
	let wikilinkDepth = 0;
	let inCode = false;
	for (let i = 0; i < inner.length; i++) {
		const c = inner[i];
		if (c === '\\' && inner[i + 1] === '|') {
			buf += '\\|';
			i++;
			continue;
		}
		if (!inCode && c === '[' && inner[i + 1] === '[') {
			wikilinkDepth++;
			buf += '[[';
			i++;
			continue;
		}
		if (!inCode && c === ']' && inner[i + 1] === ']' && wikilinkDepth > 0) {
			wikilinkDepth--;
			buf += ']]';
			i++;
			continue;
		}
		if (c === '`' && wikilinkDepth === 0) {
			inCode = !inCode;
			buf += c;
			continue;
		}
		if (c === '|' && wikilinkDepth === 0 && !inCode) {
			cells.push(buf);
			buf = '';
			continue;
		}
		buf += c;
	}
	cells.push(buf);
	return cells;
}

function isSeparatorCell(cell: string): boolean {
	return /^:?-{1,}:?$/.test(cell.trim());
}

function detectAlign(cell: string): Align {
	const c = cell.trim();
	const left = c.startsWith(':');
	const right = c.endsWith(':');
	if (left && right) return 'center';
	if (right) return 'right';
	if (left) return 'left';
	return 'none';
}

function isTableLine(line: string): boolean {
	const trimmed = line.trim();
	return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length >= 2;
}

function stripFence(text: string): string {
	const t = text.trim();
	return t.slice(1, -1);
}

function padCell(text: string, width: number, align: Align): string {
	const need = width - text.length;
	if (need <= 0) return text;
	if (align === 'right') return ' '.repeat(need) + text;
	if (align === 'center') {
		const left = Math.floor(need / 2);
		return ' '.repeat(left) + text + ' '.repeat(need - left);
	}
	return text + ' '.repeat(need);
}

function buildSeparatorCell(width: number, align: Align): string {
	const w = Math.max(width, align === 'center' ? 4 : align === 'none' ? 3 : 3);
	if (align === 'center') return ':' + '-'.repeat(w - 2) + ':';
	if (align === 'left') return ':' + '-'.repeat(w - 1);
	if (align === 'right') return '-'.repeat(w - 1) + ':';
	return '-'.repeat(w);
}

export const formatTableAtCursor: Command = (view) => {
	const state = view.state;
	const cursorPos = state.selection.main.head;
	const cursorLineNo = state.doc.lineAt(cursorPos).number;

	if (!isTableLine(state.doc.line(cursorLineNo).text)) return false;

	let startLine = cursorLineNo;
	let endLine = cursorLineNo;
	while (startLine > 1 && isTableLine(state.doc.line(startLine - 1).text)) startLine--;
	while (endLine < state.doc.lines && isTableLine(state.doc.line(endLine + 1).text)) endLine++;
	if (endLine - startLine < 1) return false;

	const rawRows: string[][] = [];
	for (let n = startLine; n <= endLine; n++) {
		const text = stripFence(state.doc.line(n).text);
		rawRows.push(splitCells(text).map((c) => c.trim().replace(/\s+/g, ' ')));
	}

	let sepIdx = -1;
	for (let i = 0; i < rawRows.length; i++) {
		if (rawRows[i].length > 0 && rawRows[i].every(isSeparatorCell)) {
			sepIdx = i;
			break;
		}
	}
	if (sepIdx < 1) return false;

	const sepRow = rawRows[sepIdx];
	const aligns: Align[] = sepRow.map(detectAlign);
	const colCount = Math.max(...rawRows.map((r) => r.length));
	for (const r of rawRows) while (r.length < colCount) r.push('');
	while (aligns.length < colCount) aligns.push('none');

	const widths: number[] = new Array(colCount).fill(0);
	for (let i = 0; i < rawRows.length; i++) {
		if (i === sepIdx) continue;
		rawRows[i].forEach((c, j) => {
			if (c.length > widths[j]) widths[j] = c.length;
		});
	}
	for (let j = 0; j < colCount; j++) {
		const minSep = aligns[j] === 'center' ? 4 : 3;
		if (widths[j] < minSep) widths[j] = minSep;
	}

	const outLines: string[] = [];
	for (let i = 0; i < rawRows.length; i++) {
		if (i === sepIdx) {
			const sepCells = widths.map((w, j) => buildSeparatorCell(w, aligns[j]));
			outLines.push('| ' + sepCells.join(' | ') + ' |');
		} else {
			const cells = rawRows[i].map((c, j) => padCell(c, widths[j], aligns[j]));
			outLines.push('| ' + cells.join(' | ') + ' |');
		}
	}

	const from = state.doc.line(startLine).from;
	const to = state.doc.line(endLine).to;
	const insert = outLines.join('\n');
	if (insert === state.doc.sliceString(from, to)) return true;

	view.dispatch({
		changes: { from, to, insert },
		userEvent: 'format.table'
	});
	return true;
};

export const formatTableKeymap = [
	{ key: 'Mod-Alt-l', run: formatTableAtCursor, preventDefault: true }
];
