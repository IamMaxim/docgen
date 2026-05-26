import type { DocDiffTimelinePoint } from './types';

export function ymd(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
		d.getDate()
	).padStart(2, '0')}`;
}

export function formatDate(value: string | null): string {
	if (!value) return '';
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return '';
	return ymd(d);
}

export type TimelineBucket = {
	label: string;
	points: DocDiffTimelinePoint[];
};

export function bucketLabel(point: DocDiffTimelinePoint, now: Date = new Date()): string {
	if (point.kind === 'worktree') return 'Working tree';
	const today = ymd(now);
	const yesterday = ymd(new Date(now.getTime() - 86_400_000));
	const day = point.date ? ymd(new Date(point.date)) : '';
	if (day === today) return 'Today';
	if (day === yesterday) return 'Yesterday';
	return 'Earlier';
}

export function groupTimeline(
	points: readonly DocDiffTimelinePoint[],
	now: Date = new Date()
): TimelineBucket[] {
	const buckets: TimelineBucket[] = [];
	for (const point of points) {
		const label = bucketLabel(point, now);
		const existing = buckets.find((b) => b.label === label);
		if (existing) existing.points.push(point);
		else buckets.push({ label, points: [point] });
	}
	return buckets;
}
