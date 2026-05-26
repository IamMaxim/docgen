import type { Writable } from 'svelte/store';

export type ResizableOptions = {
	store: Writable<number>;
	min: number;
	max: number;
	axis?: 'x' | 'y';
};

type DragState = {
	pointerId: number;
	start: number;
	startValue: number;
};

export function resizable(node: HTMLElement, options: ResizableOptions) {
	let opts = options;
	let drag: DragState | null = null;

	const currentValue = () => {
		let v = 0;
		const unsub = opts.store.subscribe((x) => (v = x));
		unsub();
		return v;
	};

	const onDown = (event: PointerEvent) => {
		drag = {
			pointerId: event.pointerId,
			start: opts.axis === 'y' ? event.clientY : event.clientX,
			startValue: currentValue()
		};
		node.setPointerCapture(event.pointerId);
	};

	const onMove = (event: PointerEvent) => {
		if (!drag || drag.pointerId !== event.pointerId) return;
		const delta = (opts.axis === 'y' ? event.clientY : event.clientX) - drag.start;
		const next = Math.max(opts.min, Math.min(opts.max, drag.startValue + delta));
		opts.store.set(next);
	};

	const onUp = (event: PointerEvent) => {
		if (!drag || drag.pointerId !== event.pointerId) return;
		node.releasePointerCapture(drag.pointerId);
		drag = null;
	};

	node.addEventListener('pointerdown', onDown);
	node.addEventListener('pointermove', onMove);
	node.addEventListener('pointerup', onUp);
	node.addEventListener('pointercancel', onUp);

	return {
		update(next: ResizableOptions) {
			opts = next;
		},
		destroy() {
			node.removeEventListener('pointerdown', onDown);
			node.removeEventListener('pointermove', onMove);
			node.removeEventListener('pointerup', onUp);
			node.removeEventListener('pointercancel', onUp);
		}
	};
}
