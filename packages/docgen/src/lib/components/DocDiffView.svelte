<script lang="ts">
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import MermaidHydrate from "$lib/components/MermaidHydrate.svelte";
  import CommitHeader from "$lib/components/diff/CommitHeader.svelte";
  import DiffTimelineRail from "$lib/components/diff/DiffTimelineRail.svelte";
  import DiffFileTree from "$lib/components/diff/DiffFileTree.svelte";
  import DiffFileView from "$lib/components/diff/DiffFileView.svelte";
  import { resizable } from "$lib/actions/resizable";
  import { diffRailWidth, diffFilesWidth } from "$lib/stores/ui-prefs";
  import { flattenTree, groupBlockRuns } from "$lib/diff/tree.ts";
  import { groupTimeline } from "$lib/diff/timeline-groups.ts";
  import type {
    DocDiffFile,
    DocDiffRevision,
    DocDiffReport,
    DocDiffTimelinePoint,
  } from "$lib/diff/types.ts";
  import "$lib/styles/diff.css";

  let {
    timelineUrl = "/docs/diff/timeline.json",
    revisionUrlPrefix = "/docs/diff/revisions/",
  }: {
    timelineUrl?: string;
    revisionUrlPrefix?: string;
  } = $props();

  let report = $state<DocDiffReport | null>(null);
  let selectedPointId = $state<string | null>(null);
  let selectedFilePath = $state<string | null>(null);
  let timelineLoading = $state(true);
  let timelineError = $state<string | null>(null);
  let revisionError = $state<string | null>(null);
  let loadingRevisionId = $state<string | null>(null);
  let revisions = $state<Record<string, DocDiffRevision>>({});
  let collapsedGroups = $state<Set<string>>(new Set());
  let timelineOpen = $state(false);

  const selectedSummaryPoint = $derived.by<DocDiffTimelinePoint | null>(
    () =>
      report?.timeline.find((p) => p.id === selectedPointId) ??
      report?.timeline[0] ??
      null,
  );

  const selectedPoint = $derived.by<
    DocDiffRevision | DocDiffTimelinePoint | null
  >(
    () =>
      (selectedPointId ? revisions[selectedPointId] : undefined) ??
      selectedSummaryPoint,
  );

  const selectedFile = $derived.by<DocDiffFile | null>(
    () =>
      selectedPoint?.files.find((f) => f.path === selectedFilePath) ??
      selectedPoint?.files[0] ??
      null,
  );

  const treeRows = $derived.by(() =>
    selectedPoint
      ? flattenTree(selectedPoint.fileTree, 0, collapsedGroups)
      : [],
  );

  const selectedRevisionLoaded = $derived.by(
    () => selectedPointId !== null && revisions[selectedPointId] !== undefined,
  );

  const blockRuns = $derived.by(() =>
    groupBlockRuns(selectedFile?.blocks ?? []),
  );

  const groupedTimeline = $derived.by(() =>
    report ? groupTimeline(report.timeline) : [],
  );

  onMount(() => {
    void loadTimeline();
    const onKey = (e: KeyboardEvent) => handleKey(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  let lastSyncedUrl = $state<string>("");

  function syncUrl() {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (selectedPointId) url.searchParams.set("c", selectedPointId);
    else url.searchParams.delete("c");
    if (selectedFilePath) url.searchParams.set("f", selectedFilePath);
    else url.searchParams.delete("f");
    const next = url.pathname + url.search;
    if (next === lastSyncedUrl) return;
    lastSyncedUrl = next;
    void goto(next, { replaceState: true, keepFocus: true, noScroll: true });
  }

  $effect(() => {
    if (!report) return;
    selectedPointId;
    selectedFilePath;
    syncUrl();
  });

  $effect(() => {
    if (!selectedPoint) return;
    if (!selectedPoint.files.some((f) => f.path === selectedFilePath)) {
      selectedFilePath = selectedPoint.files[0]?.path ?? null;
    }
  });

  $effect(() => {
    if (!selectedPointId || revisions[selectedPointId]) return;
    void loadRevision(selectedPointId);
  });

  $effect(() => {
    if (!selectedRevisionLoaded || !selectedFile) return;
    queueMicrotask(() => {
      window.dispatchEvent(new CustomEvent("docgen-mermaid-rerun"));
    });
  });

  function toggleGroup(id: string) {
    const next = new Set(collapsedGroups);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    collapsedGroups = next;
  }

  const loadTimeline = async () => {
    timelineLoading = true;
    timelineError = null;
    try {
      const r = await fetch(`${base}${timelineUrl}`);
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      report = (await r.json()) as DocDiffReport;
      const params = $page.url.searchParams;
      const wantCommit = params.get("c");
      const wantFile = params.get("f");
      const matchedPoint = wantCommit
        ? report.timeline.find((p) => p.id === wantCommit)
        : undefined;
      selectedPointId =
        matchedPoint?.id ??
        report.selectedPointId ??
        report.timeline[0]?.id ??
        null;
      const initialPoint =
        matchedPoint ??
        report.timeline.find((p) => p.id === selectedPointId) ??
        report.timeline[0] ??
        null;
      const matchedFile = wantFile
        ? initialPoint?.files.find((f) => f.path === wantFile)
        : undefined;
      selectedFilePath =
        matchedFile?.path ??
        report.selectedFilePath ??
        initialPoint?.files[0]?.path ??
        null;
    } catch (e) {
      timelineError = e instanceof Error ? e.message : String(e);
    } finally {
      timelineLoading = false;
    }
  };

  const loadRevision = async (id: string) => {
    loadingRevisionId = id;
    revisionError = null;
    try {
      const r = await fetch(
        `${base}${revisionUrlPrefix}${encodeURIComponent(id)}.json`,
      );
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      revisions = { ...revisions, [id]: (await r.json()) as DocDiffRevision };
    } catch (e) {
      if (selectedPointId === id) {
        revisionError = e instanceof Error ? e.message : String(e);
      }
    } finally {
      if (loadingRevisionId === id) loadingRevisionId = null;
    }
  };

  const selectPoint = (p: DocDiffTimelinePoint) => {
    selectedPointId = p.id;
    selectedFilePath = p.files[0]?.path ?? null;
    timelineOpen = false;
  };

  function handleKey(e: KeyboardEvent) {
    const t = e.target as HTMLElement | null;
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (t?.isContentEditable) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const files = selectedPoint?.files ?? [];
    const timeline = report?.timeline ?? [];
    const fileIdx = files.findIndex((f) => f.path === selectedFile?.path);
    const pointIdx = timeline.findIndex((p) => p.id === selectedPoint?.id);
    if (e.key === "j" && files.length) {
      const next = files[Math.min(files.length - 1, fileIdx + 1)];
      if (next) selectedFilePath = next.path;
      e.preventDefault();
    } else if (e.key === "k" && files.length) {
      const next = files[Math.max(0, fileIdx - 1)];
      if (next) selectedFilePath = next.path;
      e.preventDefault();
    } else if (e.key === "J" && timeline.length) {
      const np = timeline[Math.min(timeline.length - 1, pointIdx + 1)];
      if (np) selectPoint(np);
      e.preventDefault();
    } else if (e.key === "K" && timeline.length) {
      const np = timeline[Math.max(0, pointIdx - 1)];
      if (np) selectPoint(np);
      e.preventDefault();
    } else if (e.key === "]" || e.key === "[") {
      jumpBlock(e.key === "]");
      e.preventDefault();
    }
  }

  function jumpBlock(forward: boolean) {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".diff-page .diff-run--added, .diff-page .diff-run--removed",
      ),
    );
    if (!els.length) return;
    const y = window.scrollY;
    const sorted = els
      .map((el) => ({ el, top: el.getBoundingClientRect().top + y }))
      .sort((a, b) => a.top - b.top);
    const target = forward
      ? (sorted.find((x) => x.top > y + 4) ?? sorted[0])
      : ([...sorted].reverse().find((x) => x.top < y - 4) ??
        sorted[sorted.length - 1]);
    target.el.scrollIntoView({ block: "start", behavior: "smooth" });
  }
</script>

<MermaidHydrate rootSelector=".diff-page .doc-content" />

<article class="diff-page">
  {#if timelineError}
    <section class="warnings" aria-labelledby="diff-load-error">
      <h2 id="diff-load-error">Failed to load timeline</h2>
      <p>{timelineError}</p>
    </section>
  {:else if report && report.warnings.length > 0}
    <section class="warnings" aria-labelledby="diff-warnings">
      <h2 id="diff-warnings">Warnings</h2>
      <ul>
        {#each report.warnings as warning}
          <li>{warning}</li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if timelineLoading}
    <div class="skel skel--page" aria-hidden="true">
      <div class="skel-rail">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <div class="skel-main">
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  {:else if report && report.timeline.length === 0}
    <section class="empty-state">
      <p>No Markdown/SVX changes under docs/.</p>
    </section>
  {:else if report && selectedPoint}
    <CommitHeader
      point={selectedPoint as DocDiffTimelinePoint}
      {timelineOpen}
      onToggleTimeline={() => (timelineOpen = !timelineOpen)}
    />

    <div
      class="diff-workspace"
      class:timeline-open={timelineOpen}
      style:--rail-w={`${$diffRailWidth}px`}
      style:--files-w={`${$diffFilesWidth}px`}
    >
      <DiffTimelineRail
        buckets={groupedTimeline}
        selectedId={selectedPoint?.id ?? null}
        onSelect={selectPoint}
      />

      <div
        class="col-resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize timeline rail"
        use:resizable={{ store: diffRailWidth, min: 140, max: 500 }}
      ></div>

      <DiffFileTree
        rows={treeRows}
        fileCount={selectedPoint.files.length}
        totalAdded={selectedPoint.totalAddedLines}
        totalRemoved={selectedPoint.totalRemovedLines}
        selectedPath={selectedFile?.path ?? null}
        onSelectFile={(path) => (selectedFilePath = path)}
        onToggleGroup={toggleGroup}
      />

      <div
        class="col-resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize file list"
        use:resizable={{ store: diffFilesWidth, min: 140, max: 500 }}
      ></div>

      <DiffFileView
        file={selectedFile}
        revisionLoaded={selectedRevisionLoaded}
        {blockRuns}
        {revisionError}
      />
    </div>
  {/if}
</article>

<style>
  .diff-workspace {
    display: grid;
    grid-template-columns: var(--rail-w) 5px var(--files-w) 5px minmax(0, 1fr);
    gap: 0;
    align-items: start;
    min-width: 0;
  }

  @media (max-width: 1100px) {
    .diff-workspace {
      grid-template-columns: var(--files-w) minmax(0, 1fr);
    }
  }

  @media (max-width: 800px) {
    .diff-workspace {
      grid-template-columns: 1fr;
    }
  }
</style>
