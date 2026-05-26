export type DocDiffMode = 'dev-worktree' | 'build-history';

export type DocDiffLineKind = 'context' | 'added' | 'removed';

export type DocDiffLine = {
	kind: DocDiffLineKind;
	oldLine: number | null;
	newLine: number | null;
	text: string;
};

export type DocDiffHunk = {
	oldStart: number;
	oldLines: number;
	newStart: number;
	newLines: number;
	lines: DocDiffLine[];
};

export type DocDiffFileStatus = 'added' | 'modified' | 'deleted' | 'renamed';

export type DocDiffBlockKind = 'context' | 'added' | 'removed';

export type DocDiffBlock = {
	id: string;
	kind: DocDiffBlockKind;
	raw: string;
	html: string;
	oldIndex: number | null;
	newIndex: number | null;
};

export type DocDiffFile = {
	path: string;
	oldPath?: string;
	status: DocDiffFileStatus;
	addedLines: number;
	removedLines: number;
	hunks: DocDiffHunk[];
	blocks?: DocDiffBlock[];
};

export type DocDiffFileTreeNode =
	| {
			id: string;
			label: string;
			type: 'group';
			children: DocDiffFileTreeNode[];
	  }
	| {
			id: string;
			label: string;
			type: 'file';
			path: string;
			oldPath?: string;
			status: DocDiffFileStatus;
			addedLines: number;
			removedLines: number;
	  };

export type DocDiffTimelinePointKind = 'commit' | 'worktree';

export type DocDiffTimelinePoint = {
	id: string;
	kind: DocDiffTimelinePointKind;
	hash: string | null;
	shortHash: string;
	subject: string;
	author: string | null;
	date: string | null;
	baseRef: string;
	headRef: string;
	files: DocDiffFile[];
	fileTree: DocDiffFileTreeNode[];
	totalAddedLines: number;
	totalRemovedLines: number;
	warnings: string[];
};

export type DocDiffReport = {
	mode: DocDiffMode;
	baseRef: string;
	headRef: string;
	generatedAt: string;
	timeline: DocDiffTimelinePoint[];
	selectedPointId: string | null;
	selectedFilePath: string | null;
	files: DocDiffFile[];
	totalAddedLines: number;
	totalRemovedLines: number;
	warnings: string[];
};

export type DocDiffRevision = DocDiffTimelinePoint;
