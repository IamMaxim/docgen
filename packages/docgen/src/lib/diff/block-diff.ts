import type { DocDiffBlock, DocDiffBlockKind } from './types';

type BlockOp = {
	kind: DocDiffBlockKind;
	raw: string;
	oldIndex: number | null;
	newIndex: number | null;
};

export function splitMarkdownBlocks(markdown: string): string[] {
	const body = stripInvisibleDocumentParts(markdown);
	const lines = body.split('\n');
	const blocks: string[] = [];
	let index = 0;

	while (index < lines.length) {
		while (index < lines.length && lines[index].trim() === '') index += 1;
		if (index >= lines.length) break;

		const line = lines[index];

		if (/^```/.test(line.trim())) {
			const start = index;
			index += 1;
			while (index < lines.length && !/^```/.test(lines[index].trim())) index += 1;
			if (index < lines.length) index += 1;
			blocks.push(trimBlock(lines.slice(start, index)));
			continue;
		}

		if (/^\|/.test(line.trim())) {
			const start = index;
			while (index < lines.length && /^\|/.test(lines[index].trim())) index += 1;
			blocks.push(trimBlock(lines.slice(start, index)));
			continue;
		}

		if (/^(#{1,6})\s+/.test(line)) {
			blocks.push(line.trimEnd());
			index += 1;
			continue;
		}

		if (/^>\s?/.test(line)) {
			const start = index;
			while (index < lines.length && /^>\s?/.test(lines[index])) index += 1;
			blocks.push(trimBlock(lines.slice(start, index)));
			continue;
		}

		if (/^(\s{0,3}[-*+]\s+|\s{0,3}\d+\.\s+)/.test(line)) {
			const start = index;
			index += 1;
			while (
				index < lines.length &&
				(lines[index].trim() === '' ||
					/^(\s{0,3}[-*+]\s+|\s{0,3}\d+\.\s+|\s{2,}\S)/.test(lines[index]))
			) {
				index += 1;
			}
			blocks.push(trimBlock(lines.slice(start, index)));
			continue;
		}

		if (/^\s*<[A-Z][\s\S]*>/.test(line)) {
			blocks.push(line.trimEnd());
			index += 1;
			continue;
		}

		const start = index;
		index += 1;
		while (index < lines.length && lines[index].trim() !== '') index += 1;
		blocks.push(trimBlock(lines.slice(start, index)));
	}

	return blocks.filter((block) => block.trim().length > 0);
}

export function stripInvisibleDocumentParts(markdown: string): string {
	return markdown
		.replace(/^---[\s\S]*?---\s*/, '')
		.replace(/<script[\s\S]*?<\/script>\s*/gi, '')
		.trim();
}

export function buildBlockDiff(oldMarkdown: string, newMarkdown: string): DocDiffBlock[] {
	const oldBlocks = splitMarkdownBlocks(oldMarkdown);
	const newBlocks = splitMarkdownBlocks(newMarkdown);
	const ops = buildBlockOps(oldBlocks, newBlocks);

	return ops.map((op, index) => ({
		id: `block-${index}`,
		kind: op.kind,
		raw: op.raw,
		html: '',
		oldIndex: op.oldIndex,
		newIndex: op.newIndex
	}));
}

function trimBlock(lines: string[]): string {
	return lines.join('\n').replace(/\s+$/g, '');
}

function normalizeBlock(block: string): string {
	return block.trim().replace(/\s+/g, ' ');
}

function buildBlockOps(oldBlocks: string[], newBlocks: string[]): BlockOp[] {
	const lcs = buildLcsTable(
		oldBlocks.map(normalizeBlock),
		newBlocks.map(normalizeBlock)
	);
	const ops: BlockOp[] = [];
	let oldIndex = 0;
	let newIndex = 0;

	while (oldIndex < oldBlocks.length || newIndex < newBlocks.length) {
		if (
			oldIndex < oldBlocks.length &&
			newIndex < newBlocks.length &&
			normalizeBlock(oldBlocks[oldIndex]) === normalizeBlock(newBlocks[newIndex])
		) {
			ops.push({
				kind: 'context',
				raw: newBlocks[newIndex],
				oldIndex,
				newIndex
			});
			oldIndex += 1;
			newIndex += 1;
		} else if (
			oldIndex < oldBlocks.length &&
			(newIndex === newBlocks.length || lcs[oldIndex + 1][newIndex] >= lcs[oldIndex][newIndex + 1])
		) {
			ops.push({
				kind: 'removed',
				raw: oldBlocks[oldIndex],
				oldIndex,
				newIndex: null
			});
			oldIndex += 1;
		} else {
			ops.push({
				kind: 'added',
				raw: newBlocks[newIndex],
				oldIndex: null,
				newIndex
			});
			newIndex += 1;
		}
	}

	return ops;
}

function buildLcsTable(oldBlocks: string[], newBlocks: string[]): number[][] {
	const table = Array.from({ length: oldBlocks.length + 1 }, () =>
		Array<number>(newBlocks.length + 1).fill(0)
	);

	for (let oldIndex = oldBlocks.length - 1; oldIndex >= 0; oldIndex -= 1) {
		for (let newIndex = newBlocks.length - 1; newIndex >= 0; newIndex -= 1) {
			table[oldIndex][newIndex] =
				oldBlocks[oldIndex] === newBlocks[newIndex]
					? table[oldIndex + 1][newIndex + 1] + 1
					: Math.max(table[oldIndex + 1][newIndex], table[oldIndex][newIndex + 1]);
		}
	}

	return table;
}
