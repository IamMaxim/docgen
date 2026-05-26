export const EMPTY_TREE_REF = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

export function baseRefForCommitParents(_hash: string, parents: string): string {
	const firstParent = parents.trim().split(/\s+/).filter(Boolean)[0];
	return firstParent ?? EMPTY_TREE_REF;
}
