export const PREVIEW_PUBLIC_PREFIX = "virtual:docgen-doc-preview/";
export const PREVIEW_RESOLVED_PREFIX = `\0${PREVIEW_PUBLIC_PREFIX}`;

export function previewBrowserUrl(
  base: string,
  key: string,
  revision: number,
): string {
  return `${base}/@id/__x00__${encodeURI(`${PREVIEW_PUBLIC_PREFIX}${key}`)}?rev=${revision}`;
}
