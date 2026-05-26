export type GraphInputNode = {
	id: string;
	path: string;
	title: string;
	description?: string;
	section: string;
};

export type GraphInputEdge = {
	source: string;
	target: string;
};

export type GraphNode = GraphInputNode & {
	x: number;
	y: number;
	r: number;
	degree: number;
};

export type GraphEdge = GraphInputEdge & {
	sourceNode: GraphNode;
	targetNode: GraphNode;
};

export type LayoutOptions = {
	width: number;
	height: number;
	padding: number;
	iterations?: number;
	sectionOrder?: readonly string[];
};

const DEFAULT_SECTIONS = ['Getting started', 'Overview', 'Game design', 'Developers'] as const;

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function sectionIndex(section: string, order: readonly string[] = DEFAULT_SECTIONS): number {
	const idx = order.indexOf(section);
	return idx === -1 ? order.length : idx;
}

function initialPoint(
	node: GraphInputNode,
	index: number,
	total: number,
	opts: LayoutOptions
): { x: number; y: number } {
	const section = sectionIndex(node.section, opts.sectionOrder);
	const columns = 4;
	const columnWidth = (opts.width - opts.padding * 2) / columns;
	const sectionX =
		opts.padding + Math.min(section, columns - 1) * columnWidth + columnWidth / 2;
	const rank = total <= 1 ? 0 : index / (total - 1);
	const wave = Math.sin((index + 1) * 1.97) * 88;
	return {
		x: sectionX + wave,
		y: opts.padding + rank * (opts.height - opts.padding * 2)
	};
}

export function buildGraph(
	inputNodes: readonly GraphInputNode[],
	inputEdges: readonly GraphInputEdge[],
	opts: LayoutOptions
): { nodes: GraphNode[]; edges: GraphEdge[] } {
	const iterations = opts.iterations ?? 180;
	const degree = new Map<string, number>();
	for (const edge of inputEdges) {
		degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
		degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
	}

	const nodes: GraphNode[] = inputNodes.map((node, index) => {
		const point = initialPoint(node, index, inputNodes.length, opts);
		const nodeDegree = degree.get(node.id) ?? 0;
		return {
			...node,
			...point,
			degree: nodeDegree,
			r: clamp(4.5 + Math.sqrt(nodeDegree) * 1.2, 5, 12)
		};
	});
	const nodeMap = new Map(nodes.map((node) => [node.id, node]));
	const edges = inputEdges
		.map((edge) => {
			const sourceNode = nodeMap.get(edge.source);
			const targetNode = nodeMap.get(edge.target);
			return sourceNode && targetNode ? { ...edge, sourceNode, targetNode } : null;
		})
		.filter((edge): edge is GraphEdge => edge !== null);

	for (let i = 0; i < iterations; i++) {
		for (let a = 0; a < nodes.length; a++) {
			for (let b = a + 1; b < nodes.length; b++) {
				const left = nodes[a];
				const right = nodes[b];
				const dx = right.x - left.x || 0.01;
				const dy = right.y - left.y || 0.01;
				const distSq = dx * dx + dy * dy;
				const dist = Math.sqrt(distSq);
				const strength = Math.min(3.8, 2800 / distSq);
				const pushX = (dx / dist) * strength;
				const pushY = (dy / dist) * strength;
				left.x -= pushX;
				left.y -= pushY;
				right.x += pushX;
				right.y += pushY;
			}
		}

		for (const edge of edges) {
			const dx = edge.targetNode.x - edge.sourceNode.x;
			const dy = edge.targetNode.y - edge.sourceNode.y;
			const distance = Math.sqrt(dx * dx + dy * dy) || 1;
			const targetDistance = 132;
			const pull = (distance - targetDistance) * 0.018;
			const pullX = (dx / distance) * pull;
			const pullY = (dy / distance) * pull;
			edge.sourceNode.x += pullX;
			edge.sourceNode.y += pullY;
			edge.targetNode.x -= pullX;
			edge.targetNode.y -= pullY;
		}

		for (const node of nodes) {
			const anchor = initialPoint(
				node,
				inputNodes.findIndex((candidate) => candidate.id === node.id),
				inputNodes.length,
				opts
			);
			node.x += (anchor.x - node.x) * 0.012;
			node.y += (anchor.y - node.y) * 0.006;
			node.x = clamp(node.x, opts.padding, opts.width - opts.padding);
			node.y = clamp(node.y, opts.padding, opts.height - opts.padding);
		}
	}

	return { nodes, edges };
}
