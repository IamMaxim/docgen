<script lang="ts">
  import { setDocgenRegistry } from '$lib/context.ts';
  import type { Registry } from '$lib/registry.ts';

  let { registry, children }: { registry: Registry; children: import('svelte').Snippet } = $props();

  setDocgenRegistry(registry);
</script>

{@render children()}
