<script lang="ts">
	import { base } from '$app/paths';
	import {
		buildGraph,
		clamp,
		type GraphInputEdge,
		type GraphInputNode,
		type GraphNode
	} from '$lib/graph.ts';

	const WIDTH = 1420;
	const HEIGHT = 760;
	const PADDING = 74;

	type HoveredNode = GraphNode & { left: number; top: number };

	let {
		nodes,
		edges
	}: {
		nodes: GraphInputNode[];
		edges: GraphInputEdge[];
	} = $props();

	let pan = $state({ x: 0, y: 0 });
	let dragging = $state<{ id: number; x: number; y: number } | null>(null);
	let hovered = $state<HoveredNode | null>(null);

	const graph = $derived.by(() =>
		buildGraph(nodes, edges, { width: WIDTH, height: HEIGHT, padding: PADDING })
	);

	const activeIds = $derived.by(() => {
		if (!hovered) return new Set<string>();
		const ids = new Set([hovered.id]);
		for (const edge of graph.edges) {
			if (edge.source === hovered.id) ids.add(edge.target);
			if (edge.target === hovered.id) ids.add(edge.source);
		}
		return ids;
	});

	function tooltipPosition(event: PointerEvent | FocusEvent) {
		const target = event.currentTarget as Element | null;
		const frame = target?.closest('.graph-frame');
		const rect = frame?.getBoundingClientRect();
		if (!rect) return { left: 24, top: 24 };
		if ('clientX' in event && event.clientX !== 0) {
			return {
				left: clamp(event.clientX - rect.left + 14, 12, rect.width - 288),
				top: clamp(event.clientY - rect.top + 14, 12, rect.height - 132)
			};
		}
		return { left: 24, top: 24 };
	}

	function showNode(node: GraphNode, event: PointerEvent | FocusEvent) {
		hovered = { ...node, ...tooltipPosition(event) };
	}

	function moveTooltip(event: PointerEvent) {
		if (!hovered) return;
		hovered = { ...hovered, ...tooltipPosition(event) };
	}

	function onPointerDown(event: PointerEvent) {
		if ((event.target as Element | null)?.closest('a')) return;
		dragging = { id: event.pointerId, x: event.clientX, y: event.clientY };
		(event.currentTarget as Element).setPointerCapture(event.pointerId);
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging || dragging.id !== event.pointerId) return;
		const dx = event.clientX - dragging.x;
		const dy = event.clientY - dragging.y;
		pan = {
			x: clamp(pan.x + dx, -620, 620),
			y: clamp(pan.y + dy, -360, 360)
		};
		dragging = { ...dragging, x: event.clientX, y: event.clientY };
	}

	function onPointerUp(event: PointerEvent) {
		if (dragging?.id !== event.pointerId) return;
		dragging = null;
	}

	function onWheel(event: WheelEvent) {
		event.preventDefault();
		pan = {
			x: clamp(pan.x - event.deltaX, -620, 620),
			y: clamp(pan.y - event.deltaY, -360, 360)
		};
	}
</script>

<section class="panel graph-panel">
	<div class="panel__title">
		<span>Doc graph</span>
		<span>{graph.nodes.length} nodes · {graph.edges.length} links</span>
	</div>
	<div
		class="graph-frame"
		class:dragging={dragging !== null}
		role="application"
		aria-label="Interactive documentation graph"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		onwheel={onWheel}
	>
		<svg
			class="docgraph"
			viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
			role="img"
			aria-label="Documentation pages connected by internal links"
		>
			<g transform={`translate(${pan.x} ${pan.y})`}>
				<g class="graph-links">
					{#each graph.edges as edge}
						<line
							x1={edge.sourceNode.x}
							y1={edge.sourceNode.y}
							x2={edge.targetNode.x}
							y2={edge.targetNode.y}
							class:active={activeIds.has(edge.source) && activeIds.has(edge.target)}
						/>
					{/each}
				</g>
				<g class="graph-nodes">
					{#each graph.nodes as node}
						<a
							href={`${base}${node.path}`}
							aria-label={`${node.title}: ${node.description ?? node.section}`}
							onpointerenter={(event) => showNode(node, event)}
							onpointermove={moveTooltip}
							onpointerleave={() => (hovered = null)}
							onfocus={(event) => showNode(node, event)}
							onblur={() => (hovered = null)}
						>
							<circle
								cx={node.x}
								cy={node.y}
								r={node.r}
								class:accent={node.section === 'Developers'}
								class:dimmed={hovered !== null && !activeIds.has(node.id)}
								class:active={activeIds.has(node.id)}
							/>
						</a>
					{/each}
				</g>
			</g>
		</svg>
		{#if hovered}
			<div class="graph-tip" style={`left:${hovered.left}px;top:${hovered.top}px`}>
				<div class="graph-tip__section">{hovered.section}</div>
				<div class="graph-tip__title">{hovered.title}</div>
				<p>{hovered.description ?? hovered.path}</p>
			</div>
		{/if}
	</div>
	<p class="graph-note">
		Drag or scroll to pan. Links come from internal wiki and <code class="inline">/docs</code>
		references.
	</p>
</section>

<style>
	.panel {
		padding: 16px 18px 14px;
		border: 1px solid var(--border);
		border-radius: var(--r-md);
		background: var(--bg-elev);
	}
	.panel__title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 10.5px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.graph-panel {
		padding-bottom: 16px;
	}

	.graph-frame {
		position: relative;
		height: min(620px, 66vh);
		min-height: 430px;
		overflow: hidden;
		border: 1px solid var(--hairline);
		border-radius: var(--r-sm);
		background:
			linear-gradient(var(--hairline) 1px, transparent 1px),
			linear-gradient(90deg, var(--hairline) 1px, transparent 1px), var(--surface);
		background-size: 42px 42px;
		cursor: grab;
		touch-action: none;
	}

	.graph-frame.dragging {
		cursor: grabbing;
	}

	.docgraph {
		display: block;
		width: 100%;
		height: 100%;
		color: var(--text-mute);
	}

	.graph-links line {
		stroke: var(--text-mute);
		stroke-linecap: round;
		stroke-opacity: 0.42;
		stroke-width: 2.2px;
	}

	.graph-links line.active {
		stroke: var(--accent);
		stroke-opacity: 0.92;
		stroke-width: 3px;
	}

	.graph-nodes circle {
		fill: var(--text-dim);
		stroke: var(--surface);
		stroke-width: 2.4px;
		transition:
			fill 0.16s,
			opacity 0.16s,
			stroke 0.16s;
	}

	.graph-nodes circle.accent {
		fill: var(--accent);
	}

	.graph-nodes circle.dimmed {
		opacity: 0.34;
	}

	.graph-nodes circle.active,
	.graph-nodes a:hover circle,
	.graph-nodes a:focus-visible circle {
		fill: var(--accent);
		stroke: var(--text);
	}

	.graph-tip {
		position: absolute;
		z-index: 3;
		width: min(280px, calc(100% - 24px));
		padding: 12px 13px;
		border: 1px solid var(--border-strong);
		border-radius: var(--r-sm);
		background: color-mix(in oklch, var(--bg-elev) 94%, transparent);
		box-shadow: 0 18px 48px #00000055;
		pointer-events: none;
	}

	.graph-tip__section {
		margin-bottom: 4px;
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.graph-tip__title {
		color: var(--text);
		font-weight: 600;
		line-height: 1.25;
	}

	.graph-tip p {
		margin: 6px 0 0;
		color: var(--text-dim);
		font-size: 12.5px;
		line-height: 1.45;
	}

	.graph-note {
		margin: 10px 0 0;
		color: var(--text-mute);
		font-family: var(--font-mono);
		font-size: 10.5px;
		line-height: 1.6;
	}

	code.inline {
		padding: 1px 6px;
		border: 1px solid var(--code-border);
		border-radius: 4px;
		background: var(--code-bg);
		font-family: var(--font-mono);
		font-size: 0.86em;
	}

	@media (max-width: 640px) {
		.graph-frame {
			min-height: 360px;
		}
	}
</style>
