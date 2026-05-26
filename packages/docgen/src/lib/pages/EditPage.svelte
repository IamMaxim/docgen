<script lang="ts">
  import DocEditorView from '$lib/components/DocEditorView.svelte';
  import type { DocMeta } from '$lib/registry.ts';

  type Data = {
    currentDoc: DocMeta;
    slug: string[];
    editor: { slug: string; docPath: string };
    [key: string]: unknown;
  };
  let {
    data,
    siteTitle = 'Wiki',
    sourceApiUrl,
    previewApiUrl
  }: {
    data: Data;
    siteTitle?: string;
    sourceApiUrl?: string;
    previewApiUrl?: string;
  } = $props();
</script>

<svelte:head>
  <title>Edit {data.currentDoc.title} · {siteTitle}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<DocEditorView {data} {sourceApiUrl} {previewApiUrl} />
