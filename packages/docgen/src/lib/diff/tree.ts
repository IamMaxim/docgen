import type { DocDiffBlock, DocDiffFileTreeNode } from './types';

export type FileRow = Extract<DocDiffFileTreeNode, { type: 'file' }> & {
	rowType: 'file';
	depth: number;
};

export type GroupRow = {
	rowType: 'group';
	id: string;
	label: string;
	depth: number;
	fileCount: number;
	addedLines: number;
	removedLines: number;
	collapsed: boolean;
};

export type TreeRow = FileRow | GroupRow;

export type TreeStats = { files: number; added: number; removed: number };

export function collectStats(node: DocDiffFileTreeNode): TreeStats {
	if (node.type === 'file') {
		return { files: 1, added: node.addedLines, removed: node.removedLines };
	}
	let files = 0;
	let added = 0;
	let removed = 0;
	for (const child of node.children) {
		const s = collectStats(child);
		files += s.files;
		added += s.added;
		removed += s.removed;
	}
	return { files, added, removed };
}

export function flattenTree(
	nodes: DocDiffFileTreeNode[],
	depth: number,
	collapsed: Set<string>
): TreeRow[] {
	const out: TreeRow[] = [];
	for (const node of nodes) {
		if (node.type === 'file') {
			out.push({ ...node, rowType: 'file', depth });
			continue;
		}
		const stats = collectStats(node);
		const isCollapsed = collapsed.has(node.id);
		out.push({
			rowType: 'group',
			id: node.id,
			label: node.label,
			depth,
			fileCount: stats.files,
			addedLines: stats.added,
			removedLines: stats.removed,
			collapsed: isCollapsed
		});
		if (!isCollapsed) out.push(...flattenTree(node.children, depth + 1, collapsed));
	}
	return out;
}

export type BlockRun = { kind: DocDiffBlock['kind']; blocks: DocDiffBlock[] };

export function groupBlockRuns(blocks: readonly DocDiffBlock[]): BlockRun[] {
	const runs: BlockRun[] = [];
	for (const block of blocks) {
		const last = runs[runs.length - 1];
		if (last && last.kind === block.kind) last.blocks.push(block);
		else runs.push({ kind: block.kind, blocks: [block] });
	}
	return runs;
}
