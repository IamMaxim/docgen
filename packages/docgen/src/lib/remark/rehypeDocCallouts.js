import { visit } from 'unist-util-visit';

/** @param {import('hast').Element} el @returns {string} */
function elementText(el) {
	if (!el.children?.length) return '';
	return el.children
		.map((/** @type {import('hast').Content} */ c) => {
			if (c.type === 'text') return c.value ?? '';
			if (c.type === 'element') return elementText(c);
			return '';
		})
		.join('');
}

/** @param {import('hast').Element} blockquote @param {readonly string[]} additions */
function mergeClassNames(blockquote, additions) {
	const props = blockquote.properties ?? (blockquote.properties = {});
	let cur = props.className;
	if (!cur) cur = [];
	else if (typeof cur === 'string') cur = cur.trim().split(/\s+/).filter(Boolean);
	else if (!Array.isArray(cur)) cur = [String(cur)];
	const set = new Set([...cur, ...additions]);
	props.className = [...set];
}

/**
 * @param {import('hast').Root} tree
 */
function runDocCallouts(tree) {
	visit(tree, 'element', (/** @type {import('hast').Element} */ node) => {
		if (node.tagName !== 'blockquote') return;
		const firstP = node.children?.find(
			(/** @type {import('hast').Content} */ c) => c.type === 'element' && c.tagName === 'p'
		);
		if (!firstP || firstP.type !== 'element') return;
		const lead = elementText(firstP).trim();
		if (!lead) return;

		let kind = null;
		if (/^OPEN QUESTION:/i.test(lead)) kind = 'open-question';
		else if (/^DISCUSSION:/i.test(lead)) kind = 'discussion';
		else if (/^CONTENT TODO:/i.test(lead)) kind = 'content-todo';
		else if (/^TODO:/i.test(lead)) kind = 'todo';
		if (!kind) return;

		mergeClassNames(node, ['doc-callout', `doc-callout-${kind}`]);
		node.properties ??= {};
		node.properties.dataCallout = kind;
	});
}

/**
 * Classify wiki blockquotes: first direct child `<p>` text starts with
 * OPEN QUESTION:, DISCUSSION:, or TODO: (covers **TODO:** in markdown).
 */
export default function rehypeDocCallouts() {
	return runDocCallouts;
}
