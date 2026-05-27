<script lang="ts">
	import { DocsIndexPage } from '@iammaxim/docgen';
	import { config } from '$lib/docgen-registry';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<DocsIndexPage {data} siteTitle={config.siteTitle} />
