<script lang="ts">
  import DocPageView from '$lib/components/DocPageView.svelte';
  import type { DocMeta } from '$lib/registry.ts';

  type Data = { currentDoc: DocMeta; slug: string[]; backlinks: DocMeta[] };
  let { data, siteTitle = 'Wiki' }: { data: Data; siteTitle?: string } = $props();
</script>

<svelte:head>
  <title>{data.currentDoc.title} · {siteTitle}</title>
  {#if data.currentDoc.description}
    <meta name="description" content={data.currentDoc.description} />
  {/if}
</svelte:head>

<DocPageView currentDoc={data.currentDoc} />
