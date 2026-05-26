<script lang="ts">
	import { DocsSlugPage } from '@iammaxim/docgen';
	import { config } from '$lib/docgen-registry';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<DocsSlugPage {data} siteTitle={config.siteTitle} />
