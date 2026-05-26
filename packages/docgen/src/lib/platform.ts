export const IS_MAC =
	typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export function shortcutLabel(mac: string, other: string): string {
	return IS_MAC ? mac : other;
}
