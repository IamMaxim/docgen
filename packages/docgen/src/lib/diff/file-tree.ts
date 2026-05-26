import type { DocDiffFile, DocDiffFileTreeNode } from './types';

type MutableGroupNode = Extract<DocDiffFileTreeNode, { type: 'group' }>;

export function buildFileTree(files: DocDiffFile[]): DocDiffFileTreeNode[] {
	const roots: MutableGroupNode[] = [];

	for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
		const segments = file.path.split('/').filter(Boolean);
		const displaySegments = segments[0] === 'docs' ? segments.slice(1) : segments;
		const fileName = displaySegments.at(-1) ?? file.path;
		const groupSegments = displaySegments.slice(0, -1);
		let cursor: DocDiffFileTreeNode[] = roots;
		let idPrefix = 'docs';

		for (const segment of groupSegments) {
			idPrefix = `${idPrefix}/${segment}`;
			let group = cursor.find(
				(node): node is MutableGroupNode => node.type === 'group' && node.id === idPrefix
			);
			if (!group) {
				group = { id: idPrefix, label: segment, type: 'group', children: [] };
				cursor.push(group);
			}
			cursor = group.children;
		}

		const leaf: Extract<DocDiffFileTreeNode, { type: 'file' }> = {
			id: file.path,
			label: fileName,
			type: 'file',
			path: file.path,
			status: file.status,
			addedLines: file.addedLines,
			removedLines: file.removedLines
		};
		if (file.oldPath) leaf.oldPath = file.oldPath;
		cursor.push(leaf);
	}

	return roots;
}
