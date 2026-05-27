import {
	createRegistry,
	validateConfig,
	type DocModuleMap,
	type DocRawMap,
	type Registry
} from '@iammaxim/docgen';
import rawConfig from '../../docs-site.config.json' with { type: 'json' };

const modules = import.meta.glob('/docs/**/*.{md,svx}', { eager: true }) as DocModuleMap;
const raw = import.meta.glob('/docs/**/*.{md,svx}', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as DocRawMap;

const config = validateConfig(rawConfig);

export const registry: Registry = createRegistry({ modules, raw, config });
export { config };
