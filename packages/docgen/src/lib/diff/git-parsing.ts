import type { DocDiffFileStatus } from './types';

export type NameStatusEntry = { status: DocDiffFileStatus; path: string; oldPath?: string };

export function parseNameStatus(stdout: string): NameStatusEntry[] {
	return stdout
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.flatMap(parseNameStatusLine);
}

export function parseUntrackedDocs(stdout: string): string[] {
	return stdout
		.split('\n')
		.map((line) => line.trim())
		.filter((path) => isDocPath(path));
}

function parseNameStatusLine(line: string): NameStatusEntry[] {
	const [rawStatus, firstPath, secondPath] = line.split('\t');

	if (rawStatus === 'A') {
		return entry('added', firstPath);
	}

	if (rawStatus === 'M') {
		return entry('modified', firstPath);
	}

	if (rawStatus === 'D') {
		return entry('deleted', firstPath);
	}

	if (rawStatus.startsWith('R')) {
		const oldIsDoc = isDocPath(firstPath);
		const newIsDoc = isDocPath(secondPath);

		if (oldIsDoc && newIsDoc) {
			return [{ status: 'renamed', oldPath: firstPath, path: secondPath }];
		}

		if (oldIsDoc) {
			return [{ status: 'deleted', path: firstPath }];
		}

		if (newIsDoc) {
			return [{ status: 'added', path: secondPath }];
		}
	}

	return [];
}

function entry(status: DocDiffFileStatus, path: string | undefined): NameStatusEntry[] {
	if (!isDocPath(path)) {
		return [];
	}

	return [{ status, path }];
}

function isDocPath(path: string | undefined): path is string {
	return (
		path !== undefined &&
		path.startsWith('docs/') &&
		(path.endsWith('.md') || path.endsWith('.svx'))
	);
}
