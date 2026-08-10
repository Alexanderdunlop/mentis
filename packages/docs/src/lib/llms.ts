import { readFile } from "node:fs/promises";
import { getBlogPosts, source } from "@/lib/source";

/**
 * Strips MDX-only syntax so the output reads as plain Markdown.
 *
 * Import statements and demo components are meaningful to the site build but
 * are noise (or actively misleading) to a model reading the docs, so they are
 * removed. Fenced code blocks are left untouched — they contain `import` lines
 * that are part of the documented API.
 */
function mdxToPlainMarkdown(raw: string): string {
  const withoutFrontmatter = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");

  const lines = withoutFrontmatter.split("\n");
  const output: string[] = [];
  let insideFence = false;
  let insideJsxBlock = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      insideFence = !insideFence;
      output.push(line);
      continue;
    }

    if (insideFence) {
      output.push(line);
      continue;
    }

    // Drop a multi-line JSX demo element once it has been opened.
    if (insideJsxBlock) {
      if (/\/>\s*$|^\s*<\//.test(line)) insideJsxBlock = false;
      continue;
    }

    // Local component imports, e.g. `import { MentisDemo } from "@/components";`
    if (/^\s*import\s.+from\s+["']@\//.test(line)) continue;

    // Self-closing demo elements on one line.
    if (/^\s*<[A-Z][\w.]*[^>]*\/>\s*$/.test(line)) continue;

    // Opening tag of a multi-line demo element.
    if (/^\s*<[A-Z][\w.]*\s*$/.test(line) || /^\s*<[A-Z][\w.]*\s+[^/>]*$/.test(line)) {
      insideJsxBlock = true;
      continue;
    }

    output.push(line);
  }

  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export interface DocEntry {
  title: string;
  description?: string;
  url: string;
  content: string;
}

/**
 * Collects page URLs in the order they appear in the sidebar, so the generated
 * files read top-to-bottom like the docs rather than alphabetically.
 */
function sidebarUrlOrder(): string[] {
  const urls: string[] = [];

  const walk = (nodes: typeof source.pageTree.children) => {
    for (const node of nodes) {
      if (node.type === "page") urls.push(node.url);
      else if (node.type === "folder") walk(node.children);
    }
  };

  walk(source.pageTree.children);
  return urls;
}

/**
 * Loads every documentation page in sidebar order with its Markdown body.
 */
export async function getDocEntries(): Promise<DocEntry[]> {
  const order = sidebarUrlOrder();
  const rank = (url: string) => {
    const index = order.indexOf(url);
    // Pages missing from the sidebar sort last rather than to the front.
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };

  const pages = [...source.getPages()].sort(
    (a, b) => rank(a.url) - rank(b.url),
  );

  const entries = await Promise.all(
    pages.map(async (page) => {
      const raw = await readFile(page.absolutePath, "utf-8");

      return {
        title: page.data.title ?? page.slugs.join("/"),
        description: page.data.description,
        url: page.url,
        content: mdxToPlainMarkdown(raw),
      };
    }),
  );

  return entries;
}

/**
 * Blog posts in the same shape, newest first.
 *
 * The `summary` frontmatter is prepended to the body verbatim: it is a direct
 * answer to the post's title, so a model that truncates still reads the
 * conclusion rather than the introduction.
 */
export async function getBlogEntries(): Promise<DocEntry[]> {
  return Promise.all(
    getBlogPosts().map(async (post) => {
      const raw = await readFile(post.absolutePath, "utf-8");

      return {
        title: post.data.title,
        description: post.data.description,
        url: post.url,
        content: `In short: ${post.data.summary}\n\n${mdxToPlainMarkdown(raw)}`,
      };
    }),
  );
}
