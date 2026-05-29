<script lang="ts">
	import { EditPage } from '@iammaxim/docgen';
	import { config } from '$lib/docgen-registry';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<EditPage
	{data}
	siteTitle={config.siteTitle}
	sourceApiUrl="/editor-api/source.json"
	previewApiUrl="/editor-api/preview.json"
/>
