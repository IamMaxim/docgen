<script lang="ts">
  import DocDiffView from '$lib/components/DocDiffView.svelte';
  let {
    siteTitle = 'Wiki',
    timelineUrl,
    revisionUrlPrefix
  }: { siteTitle?: string; timelineUrl?: string; revisionUrlPrefix?: string } = $props();
</script>

<svelte:head>
  <title>Documentation diff · {siteTitle}</title>
</svelte:head>

<DocDiffView {timelineUrl} {revisionUrlPrefix} />
