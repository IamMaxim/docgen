import { base } from '$app/paths';
import type {
	DocEditorApiError,
	DocEditorPreviewResponse,
	DocEditorSaveRequest,
	DocEditorSaveResponse,
	DocEditorSourcePayload
} from './types';

async function parseJsonError(response: Response): Promise<string> {
	try {
		const body = (await response.json()) as DocEditorApiError;
		return body.error || `${response.status} ${response.statusText}`;
	} catch {
		return `${response.status} ${response.statusText}`;
	}
}

export async function fetchSource(
	slug: string,
	sourceApiUrl = '/docs/editor-api/source.json'
): Promise<DocEditorSourcePayload> {
	const url = `${base}${sourceApiUrl}?slug=${encodeURIComponent(slug)}`;
	const response = await fetch(url);
	if (!response.ok) throw new Error(await parseJsonError(response));
	return (await response.json()) as DocEditorSourcePayload;
}

export async function fetchPreview(
	docPath: string,
	source: string,
	previewApiUrl = '/docs/editor-api/preview.json'
): Promise<DocEditorPreviewResponse> {
	const response = await fetch(`${base}${previewApiUrl}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ docPath, source })
	});
	if (!response.ok) throw new Error(await parseJsonError(response));
	return (await response.json()) as DocEditorPreviewResponse;
}

export async function saveSource(
	payload: DocEditorSaveRequest,
	sourceApiUrl = '/docs/editor-api/source.json'
): Promise<DocEditorSaveResponse> {
	const response = await fetch(`${base}${sourceApiUrl}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!response.ok) throw new Error(await parseJsonError(response));
	return (await response.json()) as DocEditorSaveResponse;
}
