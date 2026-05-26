import type { DocMeta } from '../registry';

export type DocEditorSourcePayload = {
	doc: DocMeta;
	docPath: string;
	viewPath: string;
	source: string;
	headSource: string;
	diskHash: string;
};

export type DocEditorSaveRequest = {
	slug: string;
	source: string;
	diskHash: string;
};

export type DocEditorSaveResponse = {
	docPath: string;
	source: string;
	diskHash: string;
	savedAt: string;
};

export type DocEditorPreviewRequest = {
	docPath: string;
	source: string;
};

export type DocEditorPreviewResponse = {
	moduleUrl: string;
	revision: number;
};

export type DocEditorApiError = {
	error: string;
};
