import type { DocDiffHunk, DocDiffLine, DocDiffLineKind } from './types';

type DiffOp = DocDiffLine & {
	oldBefore: number;
	newBefore: number;
};

export function buildLineHunks(oldText: string, newText: string, contextLines = 3): DocDiffHunk[] {
	if (oldText === newText) {
		return [];
	}

	const oldLines = splitLines(oldText);
	const newLines = splitLines(newText);
	const ops = buildDiffOps(oldLines, newLines);
	const hunks = buildHunkRanges(ops, Math.max(0, contextLines));

	return hunks.map(([start, end]) => buildHunk(ops.slice(start, end + 1)));
}

function splitLines(text: string): string[] {
	if (text === '') {
		return [];
	}

	const lines = text.split('\n').map((line) => (line.endsWith('\r') ? line.slice(0, -1) : line));
	if (lines.at(-1) === '') {
		lines.pop();
	}

	return lines;
}

function buildDiffOps(oldLines: string[], newLines: string[]): DiffOp[] {
	const lcs = buildLcsTable(oldLines, newLines);
	const ops: DiffOp[] = [];
	let oldIndex = 0;
	let newIndex = 0;

	while (oldIndex < oldLines.length || newIndex < newLines.length) {
		const oldBefore = oldIndex;
		const newBefore = newIndex;

		if (
			oldIndex < oldLines.length &&
			newIndex < newLines.length &&
			oldLines[oldIndex] === newLines[newIndex]
		) {
			ops.push(
				makeOp('context', oldIndex + 1, newIndex + 1, oldLines[oldIndex], oldBefore, newBefore)
			);
			oldIndex += 1;
			newIndex += 1;
		} else if (
			oldIndex < oldLines.length &&
			(newIndex === newLines.length || lcs[oldIndex + 1][newIndex] >= lcs[oldIndex][newIndex + 1])
		) {
			ops.push(makeOp('removed', oldIndex + 1, null, oldLines[oldIndex], oldBefore, newBefore));
			oldIndex += 1;
		} else {
			ops.push(makeOp('added', null, newIndex + 1, newLines[newIndex], oldBefore, newBefore));
			newIndex += 1;
		}
	}

	return ops;
}

function buildLcsTable(oldLines: string[], newLines: string[]): number[][] {
	const table = Array.from({ length: oldLines.length + 1 }, () =>
		Array<number>(newLines.length + 1).fill(0)
	);

	for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
		for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex -= 1) {
			table[oldIndex][newIndex] =
				oldLines[oldIndex] === newLines[newIndex]
					? table[oldIndex + 1][newIndex + 1] + 1
					: Math.max(table[oldIndex + 1][newIndex], table[oldIndex][newIndex + 1]);
		}
	}

	return table;
}

function makeOp(
	kind: DocDiffLineKind,
	oldLine: number | null,
	newLine: number | null,
	text: string,
	oldBefore: number,
	newBefore: number
): DiffOp {
	return { kind, oldLine, newLine, text, oldBefore, newBefore };
}

function buildHunkRanges(ops: DiffOp[], contextLines: number): Array<[number, number]> {
	const ranges: Array<[number, number]> = [];

	for (let index = 0; index < ops.length; index += 1) {
		if (ops[index].kind === 'context') {
			continue;
		}

		const start = Math.max(0, index - contextLines);
		const end = Math.min(ops.length - 1, index + contextLines);
		const previous = ranges.at(-1);

		if (previous && start <= previous[1] + 1) {
			previous[1] = Math.max(previous[1], end);
		} else {
			ranges.push([start, end]);
		}
	}

	return ranges;
}

function buildHunk(lines: DiffOp[]): DocDiffHunk {
	const oldLines = lines.filter((line) => line.kind !== 'added').length;
	const newLines = lines.filter((line) => line.kind !== 'removed').length;

	return {
		oldStart: hunkStart(lines, 'old'),
		oldLines,
		newStart: hunkStart(lines, 'new'),
		newLines,
		lines: lines.map(({ kind, oldLine, newLine, text }) => ({ kind, oldLine, newLine, text }))
	};
}

function hunkStart(lines: DiffOp[], side: 'old' | 'new'): number {
	const lineKey = side === 'old' ? 'oldLine' : 'newLine';
	const beforeKey = side === 'old' ? 'oldBefore' : 'newBefore';
	const firstLine = lines.find((line) => line[lineKey] !== null)?.[lineKey];

	if (firstLine !== undefined && firstLine !== null) {
		return firstLine;
	}

	return lines[0][beforeKey];
}
