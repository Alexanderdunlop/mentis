import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The plan's one hard architectural rule, enforced instead of merely stated:
 *
 * > **nothing below `adapters/` may import a framework.** This costs nothing to maintain
 * > as a discipline and is what makes Milestone 7 a victory lap instead of a rewrite.
 *
 * A discipline that nothing checks is a discipline until the first hurried afternoon. The
 * whole layering claim rests on this, and the cost of proving it is one file.
 *
 * This is deliberately a *source* test rather than a dependency-graph or bundler check: it
 * catches the mistake at the moment someone types the import, names the file, and needs no
 * build step to run.
 */

const SRC = new URL("..", import.meta.url).pathname;
const ADAPTERS = join(SRC, "adapters");

/**
 * Frameworks, by package prefix. A match on `react` also catches `react-dom` and
 * `react/jsx-runtime`, which is the point — an adapter's whole job is to be the only place
 * any of these appear.
 */
const FRAMEWORKS = [
  "react",
  "preact",
  "vue",
  "svelte",
  "solid-js",
  "@angular/",
];

/**
 * Module specifiers in `from "x"`, `import("x")`, `require("x")` and a bare `import "x"`.
 *
 * Regex rather than a parse, and worth being honest about the limit: a specifier inside a
 * string literal or a comment would be a false positive. Nothing in this package writes
 * one, and a false positive here fails loudly rather than passing quietly — the safe
 * direction for a rule like this.
 */
const SPECIFIER =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)["']([^"']+)["']|^\s*import\s+["']([^"']+)["']/gm;

const sourceFiles = (directory: string): string[] => {
  const found: string[] = [];
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isDirectory()) {
      found.push(...sourceFiles(path));
    } else if (/\.tsx?$/.test(item.name)) {
      found.push(path);
    }
  }
  return found;
};

const frameworkImportsIn = (path: string): string[] => {
  const source = readFileSync(path, "utf8");
  const hits: string[] = [];
  for (const match of source.matchAll(SPECIFIER)) {
    const specifier = match[1] ?? match[2];
    if (!specifier) continue;
    const framework = FRAMEWORKS.find(
      (name) => specifier === name || specifier.startsWith(`${name}/`) || specifier.startsWith(name)
    );
    if (framework) hits.push(specifier);
  }
  return hits;
};

const isUnderAdapters = (path: string): boolean => path.startsWith(ADAPTERS);

describe("the layering rule", () => {
  it("finds source files to check at all", () => {
    // Guards against the walk silently returning nothing — which would make every
    // assertion below pass for the worst possible reason.
    const all = sourceFiles(SRC);
    expect(all.length).toBeGreaterThan(50);
  });

  it("keeps every framework import inside src/adapters/", () => {
    const offenders = sourceFiles(SRC)
      .filter((path) => !isUnderAdapters(path))
      .map((path) => ({ path: relative(SRC, path), imports: frameworkImportsIn(path) }))
      .filter(({ imports }) => imports.length > 0);

    expect(
      offenders,
      offenders.length === 0
        ? ""
        : `A framework was imported below src/adapters/, which breaks the plan's one hard ` +
          `architectural rule:\n` +
          offenders
            .map(({ path, imports }) => `  ${path} imports ${imports.join(", ")}`)
            .join("\n") +
          `\n\nThe model, view, input, history and query layers must stay framework-free. ` +
          `If an adapter needs something from them, the thing to move is the *need*, not ` +
          `the import.`
    ).toEqual([]);
  });

  it("is not vacuous — the adapters themselves do import a framework", () => {
    // Without this, deleting every adapter would make the rule above pass perfectly while
    // proving nothing. The rule is only meaningful while there is something for it to
    // have caught.
    const adapterImports = sourceFiles(ADAPTERS).flatMap(frameworkImportsIn);
    expect(adapterImports.length).toBeGreaterThan(0);
  });
});
