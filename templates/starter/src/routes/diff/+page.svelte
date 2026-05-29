<script lang="ts">
	import { DiffPage } from '@iammaxim/docgen';
	import { config } from '$lib/docgen-registry';
</script>

<DiffPage
	siteTitle={config.siteTitle}
	timelineUrl="/diff/timeline.json"
	revisionUrlPrefix="/diff/revisions/"
/>
