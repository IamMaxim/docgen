<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import type { Mermaid } from "mermaid";

  let { rootSelector = ".doc-content" }: { rootSelector?: string } = $props();
  const PRE_SEL = "pre.language-mermaid";
  const CODE_SEL = "pre code.language-mermaid";

  let mermaidPromise: Promise<Mermaid> | null = null;

  function loadMermaid() {
    mermaidPromise ??= import("mermaid").then((m) => m.default);
    return mermaidPromise;
  }

  function ensureSourceOnPres(root: ParentNode) {
    for (const el of root.querySelectorAll(PRE_SEL)) {
      if (!(el instanceof HTMLPreElement)) continue;
      if ((el.dataset.mermaidSource ?? "").trim()) continue;
      const code = el.querySelector("code.language-mermaid");
      const text = code?.textContent ?? "";
      if (text.trim()) el.dataset.mermaidSource = text;
    }
  }

  function restorePres(root: ParentNode) {
    for (const el of root.querySelectorAll(PRE_SEL)) {
      if (!(el instanceof HTMLPreElement)) continue;
      const src = el.dataset.mermaidSource;
      if (!src?.trim()) continue;
      el.classList.add("doc-mermaid");
      const firstLine =
        src
          .split(/\r?\n/)
          .find((l) => l.trim())
          ?.trim() ?? "Mermaid diagram";
      el.setAttribute("role", "img");
      el.setAttribute(
        "aria-label",
        firstLine.length > 120 ? `${firstLine.slice(0, 117)}…` : firstLine,
      );
      el.replaceChildren();
      const code = document.createElement("code");
      code.className = "language-mermaid";
      code.textContent = src;
      el.appendChild(code);
    }
  }

  async function applyTheme(mermaid: Mermaid) {
    const dark = document.documentElement.dataset.theme === "dark";
    mermaid.initialize({
      startOnLoad: false,
      theme: dark ? "dark" : "default",
      securityLevel: "strict",
      fontFamily: "system-ui, sans-serif",
    });
  }

  let raf = 0;

  async function runMermaid() {
    if (!browser) return;
    const root = document.querySelector(rootSelector);
    if (!root) return;
    ensureSourceOnPres(root);
    restorePres(root);
    const mermaid = await loadMermaid();
    await applyTheme(mermaid);
    try {
      await mermaid.run({
        nodes: Array.from(root.querySelectorAll(CODE_SEL)),
        suppressErrors: true,
      });
    } catch (e) {
      console.error("[mermaid]", e);
    }
  }

  function scheduleMermaid() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => void runMermaid());
  }

  afterNavigate(() => scheduleMermaid());

  onMount(() => {
    const onTheme = () => scheduleMermaid();
    const onRerun = () => scheduleMermaid();
    window.addEventListener("docgen-theme", onTheme);
    window.addEventListener("docgen-mermaid-rerun", onRerun);
    scheduleMermaid();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("docgen-theme", onTheme);
      window.removeEventListener("docgen-mermaid-rerun", onRerun);
    };
  });
</script>
