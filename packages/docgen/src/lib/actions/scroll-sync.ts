export type ScrollSyncOptions = {
	/** Element whose scroll position should mirror this node's. */
	partner: () => HTMLElement | null;
	/** Optional: receives a handle with `.sync()` to trigger a one-shot partner→node sync. */
	bindHandle?: (handle: { sync: () => void }) => void;
};

function scrollRatio(el: HTMLElement) {
	const max = el.scrollHeight - el.clientHeight;
	return max <= 0 ? 0 : el.scrollTop / max;
}

function setScrollRatio(el: HTMLElement, ratio: number) {
	const max = el.scrollHeight - el.clientHeight;
	el.scrollTop = max <= 0 ? 0 : max * ratio;
}

/**
 * Pair-scroll two elements. Apply this action to one element and pass `partner: () => other`.
 * Either element can drive — locking prevents feedback loops. Apply on only one side.
 */
export function scrollSync(node: HTMLElement, options: ScrollSyncOptions) {
	let opts = options;
	let locked = false;
	let raf = 0;

	const pair = (source: HTMLElement, target: HTMLElement) => {
		if (locked) return;
		locked = true;
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(() => {
			setScrollRatio(target, scrollRatio(source));
			requestAnimationFrame(() => {
				locked = false;
			});
		});
	};

	const onNode = () => {
		const partner = opts.partner();
		if (partner) pair(node, partner);
	};
	const onPartner = () => {
		const partner = opts.partner();
		if (partner) pair(partner, node);
	};

	let attachedPartner: HTMLElement | null = null;

	const attach = () => {
		const partner = opts.partner();
		if (partner === attachedPartner) return;
		if (attachedPartner) attachedPartner.removeEventListener('scroll', onPartner);
		attachedPartner = partner;
		if (partner) partner.addEventListener('scroll', onPartner, { passive: true });
	};

	const handle = {
		/** One-shot sync: pull partner's ratio into node. */
		sync() {
			const partner = opts.partner();
			if (partner) pair(partner, node);
		}
	};

	node.addEventListener('scroll', onNode, { passive: true });
	attach();
	const reattach = setInterval(attach, 200);
	opts.bindHandle?.(handle);

	return {
		update(next: ScrollSyncOptions) {
			opts = next;
			attach();
			opts.bindHandle?.(handle);
		},
		destroy() {
			clearInterval(reattach);
			cancelAnimationFrame(raf);
			node.removeEventListener('scroll', onNode);
			if (attachedPartner) attachedPartner.removeEventListener('scroll', onPartner);
		}
	};
}
