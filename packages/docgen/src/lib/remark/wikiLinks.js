// @ts-nocheck
import {
  readdirSync,
  statSync,
  writeFileSync,
  mkdirSync,
  readFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";

const WIKI_LINK = /\[\[([^|\]]+?)(?:\|([^\]]+?))?\]\]/g;
const PIPE_SENTINEL = "";

/**
 * @typedef {Object} WikiLinksOptions
 * @property {string} docsDir - Absolute or cwd-relative path to docs directory.
 * @property {string[]} [ignore] - First-level dirs (or `dir/**`) to exclude.
 * @property {string} [baseUrl='/docs'] - URL prefix for resolved wiki paths.
 * @property {string} [linkGraphOutput] - If set, persist link-graph.json to this absolute path on each transform.
 */

/** @param {WikiLinksOptions} options */
export default function createWikiLinks(options) {
  const docsDir = resolve(process.cwd(), options.docsDir);
  const DOC_URL_PREFIX = options.baseUrl ?? "/docs";
  const ignoreRules = options.ignore ?? [];
  const linkGraphOutput = options.linkGraphOutput;

  function isDocPathIgnored(relativeFromDocsRoot) {
    const norm = String(relativeFromDocsRoot)
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");
    for (const rule of ignoreRules) {
      const r = String(rule).replace(/\\/g, "/").replace(/^\/+/, "");
      if (!r) continue;
      if (r.endsWith("/**")) {
        const prefix = r.slice(0, -3).replace(/\/+$/, "");
        if (norm === prefix || norm.startsWith(`${prefix}/`)) return true;
      } else if (norm === r || norm.startsWith(`${r}/`)) return true;
    }
    return false;
  }

  function docRelToCanonical(relNoExt) {
    const norm = relNoExt
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");
    if (norm === "" || norm === "index") {
      return { id: "index", slug: [], treeSlug: [], path: DOC_URL_PREFIX };
    }
    const parts = norm.split("/").filter(Boolean);
    const isFolderIndex =
      parts.length > 0 && parts[parts.length - 1] === "index";
    const routeParts =
      isFolderIndex && parts.length > 1 ? parts.slice(0, -1) : parts;
    const id = routeParts.length ? routeParts.join("/") : "index";
    const slug = routeParts;
    const path =
      slug.length === 0
        ? DOC_URL_PREFIX
        : `${DOC_URL_PREFIX}/${slug.join("/")}`;
    return { id, slug, path, treeSlug: parts };
  }

  const titleByCanonical = new Map();

  function extractTitleFromSource(filePath) {
    try {
      const raw = readFileSync(filePath, "utf8");
      const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
      if (fmMatch) {
        const titleLine = fmMatch[1].match(/^title\s*:\s*(.+)$/m);
        if (titleLine) {
          return titleLine[1].trim().replace(/^['"]|['"]$/g, "");
        }
      }
      const heading = raw.match(/^#\s+(.+)$/m);
      if (heading) return heading[1].trim();
    } catch {
      // ignore
    }
    return null;
  }

  function buildPathMap() {
    const pathMap = new Map();

    function scanDir(dir, basePath = "") {
      try {
        const entries = readdirSync(dir);
        for (const entry of entries) {
          const fullPath = join(dir, entry);
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            const newBase = basePath ? `${basePath}/${entry}` : entry;
            scanDir(fullPath, newBase);
          } else if (entry.endsWith(".svx") || entry.endsWith(".md")) {
            const relFile = basePath ? `${basePath}/${entry}` : entry;
            if (isDocPathIgnored(relFile)) continue;

            const nameWithoutExt = entry
              .replace(/\.svx$/, "")
              .replace(/\.md$/, "");
            const relative = basePath
              ? `${basePath}/${nameWithoutExt}`
              : nameWithoutExt;
            const { path: pathName, id } = docRelToCanonical(relative);

            const title = extractTitleFromSource(fullPath);
            if (title) titleByCanonical.set(pathName, title);

            pathMap.set(id, pathName);
            pathMap.set(pathName, pathName);
            pathMap.set(relative, pathName);
            pathMap.set(`/${relative}`, pathName);

            if (!pathMap.has(nameWithoutExt)) {
              pathMap.set(nameWithoutExt, pathName);
            }

            if (nameWithoutExt === "index" && basePath) {
              if (!pathMap.has(basePath)) {
                pathMap.set(basePath, pathName);
              }
              const dirSegments = basePath.split("/").filter(Boolean);
              const dirName = dirSegments[dirSegments.length - 1];
              if (dirName && !pathMap.has(dirName)) {
                pathMap.set(dirName, pathName);
              }
            }
          }
        }
      } catch {
        // missing
      }
    }

    scanDir(docsDir);
    return pathMap;
  }

  const pathMap = buildPathMap();
  const outgoingLinkMap = new Map();

  function recordResolvedLink(sourcePath, targetPath, recordLinks = true) {
    if (!recordLinks) return;
    if (!sourcePath) return;
    if (!targetPath || targetPath === "#") return;
    if (sourcePath === targetPath) return;
    let existing = outgoingLinkMap.get(sourcePath);
    if (!existing) {
      existing = new Set();
      outgoingLinkMap.set(sourcePath, existing);
    }
    existing.add(targetPath);
  }

  function persistLinkGraph() {
    if (!linkGraphOutput) return;
    try {
      const payload = {};
      for (const [source, targets] of outgoingLinkMap.entries()) {
        payload[source] = { outgoing: Array.from(targets).sort() };
      }
      const next = JSON.stringify(payload, null, 2);
      try {
        if (readFileSync(linkGraphOutput, "utf8") === next) return;
      } catch {
        // missing
      }
      mkdirSync(dirname(linkGraphOutput), { recursive: true });
      writeFileSync(linkGraphOutput, next, "utf8");
    } catch {
      // best-effort
    }
  }

  const slugify = (value) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9/]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/\/+/g, "/");

  function encodePath(path) {
    if (!path || path === "#") return path;
    const segments = path.split("/").filter((s) => s !== "");
    const encoded = segments
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    return path.startsWith("/") ? `/${encoded}` : encoded;
  }

  function resolvePathInfo(targetRaw) {
    const trimmed = targetRaw.trim();
    if (!trimmed)
      return { url: "#", canonical: null, resolved: false, target: trimmed };

    function tryKey(key) {
      const canonical = pathMap.get(key);
      if (canonical) {
        return {
          url: encodePath(canonical),
          canonical,
          resolved: true,
          target: trimmed,
        };
      }
      return null;
    }

    const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    const withoutSlash = trimmed.replace(/^\/+/, "");

    const hit =
      tryKey(trimmed) ||
      tryKey(withSlash) ||
      tryKey(withoutSlash) ||
      tryKey(trimmed.replace(/^docs\/?/i, "")) ||
      tryKey(`docs/${withoutSlash.replace(/^docs\/?/i, "")}`);

    if (hit) return hit;

    const slugified = slugify(trimmed);
    const fallbackPath = slugified
      ? slugified.startsWith("/")
        ? slugified
        : `${DOC_URL_PREFIX}/${slugified}`.replace(/\/+/g, "/")
      : "#";
    return {
      url: encodePath(fallbackPath === "#" ? "#" : fallbackPath),
      canonical: null,
      resolved: false,
      target: trimmed,
    };
  }

  function resolveTitleForPath(canonical) {
    return canonical ? (titleByCanonical.get(canonical) ?? null) : null;
  }

  function resolvedDocHref(url) {
    const raw = String(url || "").trim();
    if (!raw) return null;
    const clean =
      raw.split("#")[0].split("?")[0].replace(/\/+$/, "") || DOC_URL_PREFIX;
    if (clean === DOC_URL_PREFIX || clean.startsWith(`${DOC_URL_PREFIX}/`)) {
      const canonical =
        pathMap.get(clean) || pathMap.get(clean.replace(/^\/+/, ""));
      return canonical || null;
    }
    return null;
  }

  function getCurrentDocPath(file) {
    const filePath = file.path || file.history?.[0];
    if (!filePath) return null;
    const norm = decodeURIComponent(String(filePath).replace(/\\/g, "/"));
    const marker = "/docs/";
    const idx = norm.lastIndexOf(marker);
    if (idx === -1) return null;
    let relative = norm.slice(idx + marker.length);
    if (!relative.endsWith(".svx") && !relative.endsWith(".md")) return null;
    const withoutExt = relative.replace(/\.svx$/, "").replace(/\.md$/, "");
    const { path: pathName } = docRelToCanonical(withoutExt);
    return pathName;
  }

  function isPreviewFile(file) {
    const filePath = String(file.path || file.history?.[0] || "");
    return filePath.includes("docgen-doc-preview");
  }

  function unescapePipe(value) {
    if (typeof value !== "string") return value;
    return value.replace(/\\\|/g, "|").split(PIPE_SENTINEL).join("|");
  }

  function walk(node, currentDocPath, recordLinks) {
    if (!node || !node.children || !Array.isArray(node.children)) {
      return;
    }

    node.children = node.children.flatMap((child) => {
      if (child.type === "linkReference") {
        let raw = unescapePipe((child.label || child.identifier || "").trim());
        const childText = Array.isArray(child.children)
          ? unescapePipe(
              child.children
                .map((c) => (typeof c.value === "string" ? c.value : ""))
                .join("")
                .trim(),
            )
          : "";
        if (!raw && childText) raw = childText;

        let targetRaw = raw;
        let label = childText || raw;
        const pipeIndex = raw.indexOf("|");
        if (pipeIndex !== -1) {
          const targetPart = raw.slice(0, pipeIndex).trim();
          const labelPart = raw.slice(pipeIndex + 1).trim();
          if (targetPart) targetRaw = targetPart;
          if (labelPart) label = labelPart;
          else if (targetPart) label = targetPart;
        }

        const { url, canonical, resolved, target } = resolvePathInfo(targetRaw);
        if (resolved && canonical) {
          recordResolvedLink(currentDocPath, canonical, recordLinks);
        }

        const linkNode = {
          type: "link",
          url,
          children: [{ type: "text", value: label }],
        };
        if (!resolved) {
          linkNode.data = {
            hProperties: {
              className: ["broken-link"],
              title: `Unresolved link: ${target}`,
              href: null,
            },
          };
        } else {
          linkNode.data = {
            hProperties: {
              className: ["wikilink"],
              "data-wikilink-title":
                resolveTitleForPath(canonical) ?? targetRaw,
              "data-wikilink-path": canonical,
            },
          };
        }
        return [linkNode];
      }

      if (child.type === "link" && typeof child.url === "string") {
        const canonical = resolvedDocHref(child.url);
        if (canonical) {
          recordResolvedLink(currentDocPath, canonical, recordLinks);
        }
        walk(child, currentDocPath, recordLinks);
        return [child];
      }

      if (child.type === "text" && typeof child.value === "string") {
        const segments = replaceText(
          unescapePipe(child.value),
          currentDocPath,
          recordLinks,
        );
        return segments.length ? segments : [child];
      }

      walk(child, currentDocPath, recordLinks);
      return [child];
    });

    cleanupBracketArtifacts(node);
  }

  function cleanupBracketArtifacts(node) {
    const children = node.children;
    if (!Array.isArray(children) || children.length === 0) return;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.type !== "link") continue;
      if (i > 0) {
        const prev = children[i - 1];
        if (prev && prev.type === "text" && typeof prev.value === "string") {
          if (prev.value.endsWith("[")) {
            prev.value = prev.value.slice(0, -1);
            if (!prev.value) {
              children.splice(i - 1, 1);
              i--;
            }
          }
        }
      }
      if (i < children.length - 1) {
        const next = children[i + 1];
        if (next && next.type === "text" && typeof next.value === "string") {
          if (next.value.startsWith("]")) {
            next.value = next.value.slice(1);
            if (!next.value) children.splice(i + 1, 1);
          }
        }
      }
    }
  }

  function replaceText(value, currentDocPath, recordLinks) {
    const segments = [];
    let lastIndex = 0;
    let match;
    WIKI_LINK.lastIndex = 0;
    while ((match = WIKI_LINK.exec(value)) !== null) {
      const [fullMatch, targetRaw, labelRaw] = match;
      const start = match.index;
      const { url, canonical, resolved, target } = resolvePathInfo(targetRaw);
      const label =
        labelRaw?.trim() ||
        targetRaw.split("/").pop()?.trim() ||
        targetRaw.trim();
      if (start > lastIndex) {
        segments.push({ type: "text", value: value.slice(lastIndex, start) });
      }
      const linkNode = {
        type: "link",
        url,
        children: [{ type: "text", value: label }],
      };
      if (!resolved) {
        linkNode.data = {
          hProperties: {
            className: ["broken-link"],
            title: `Unresolved link: ${target}`,
            href: null,
          },
        };
      } else if (canonical) {
        recordResolvedLink(currentDocPath, canonical, recordLinks);
      }
      if (resolved && canonical) {
        linkNode.data = {
          hProperties: {
            className: ["wikilink"],
            "data-wikilink-title": resolveTitleForPath(canonical) ?? targetRaw,
            "data-wikilink-path": canonical,
          },
        };
      }
      segments.push(linkNode);
      lastIndex = start + fullMatch.length;
    }
    if (!segments.length) return [];
    if (lastIndex < value.length) {
      segments.push({ type: "text", value: value.slice(lastIndex) });
    }
    return segments;
  }

  return function transformer(tree, file) {
    const currentDocPath = getCurrentDocPath(file);
    const recordLinks = currentDocPath !== null && !isPreviewFile(file);
    walk(tree, currentDocPath, recordLinks);
    if (recordLinks) persistLinkGraph();
  };
}
