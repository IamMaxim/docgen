import type { DocDiffFile, DocDiffReport, DocDiffTimelinePoint } from './types';

export function summarizeFile(file: DocDiffFile): DocDiffFile {
	const { blocks: _blocks, ...rest } = file;
	return {
		...rest,
		hunks: []
	};
}

export function summarizeTimelinePoint(point: DocDiffTimelinePoint): DocDiffTimelinePoint {
	return {
		...point,
		files: point.files.map(summarizeFile)
	};
}

export function summarizeReport(report: DocDiffReport): DocDiffReport {
	return {
		...report,
		timeline: report.timeline.map(summarizeTimelinePoint),
		files: report.files.map(summarizeFile)
	};
}
