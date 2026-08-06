import { beforeEach, describe, expect, it } from "vitest";
import { renderDomTree } from "../dom-tree";
import { textLength } from "../format";

/**
 * Smoke coverage for the inspector's renderers: they must not throw, and must
 * surface the structures that cause bugs (stray `<br>`, empty text nodes, nbsp,
 * atomic nodes). Anything caret-related is deliberately absent — happy-dom's
 * Selection is not a source of truth. See vitest.config.ts.
 */

let editor: HTMLElement;

const setup = (html: string): string => {
  editor.innerHTML = html;
  return renderDomTree(editor);
};

beforeEach(() => {
  document.body.innerHTML = "";
  editor = document.createElement("div");
  editor.setAttribute("contenteditable", "true");
  document.body.appendChild(editor);
});

describe("renderDomTree", () => {
  it("renders the root element and its tag", () => {
    const output = setup("");
    expect(output).toContain("&lt;div");
    expect(output).toContain("contenteditable=&quot;true&quot;");
  });

  it("renders a text node with its content and length", () => {
    const output = setup("hello");
    expect(output).toContain("#text");
    expect(output).toContain('"hello"');
    expect(output).toContain("(5)");
  });

  it("makes spaces visible", () => {
    expect(setup("a b")).toContain('"a·b"');
  });

  it("distinguishes a non-breaking space", () => {
    expect(setup("a&nbsp;b")).toContain('"a⍽b"');
  });

  it("calls out a br, since a stray trailing one is a classic off-by-one", () => {
    const output = setup("one<br>two");
    expect(output).toContain("&lt;br&gt;");
    expect(output).toContain("t-br");
  });

  it("flags empty text nodes", () => {
    editor.replaceChildren(document.createTextNode(""));
    expect(renderDomTree(editor)).toContain("EMPTY");
  });

  it("marks an atomic node distinctly from a normal element", () => {
    const output = setup(
      '<span class="chip" contenteditable="false" data-value="1">@Alice</span>'
    );
    expect(output).toContain("t-atomic");
    expect(output).toContain("contenteditable=&quot;false&quot;");
    expect(output).toContain("data-value=&quot;1&quot;");
  });

  it("nests children under their parent", () => {
    const lines = setup("<span>hi</span>").split("\n");
    const spanLine = lines.findIndex((line) => line.includes("&lt;span"));
    const textLine = lines.findIndex((line) => line.includes('"hi"'));
    expect(spanLine).toBeGreaterThanOrEqual(0);
    expect(textLine).toBe(spanLine + 1);
    // Child is indented relative to its parent.
    expect(lines[textLine]!.match(/^ */)![0].length).toBeGreaterThan(
      lines[spanLine]!.match(/^ */)![0].length
    );
  });

  it("escapes content so the inspector cannot be broken by editor text", () => {
    const output = setup("");
    editor.replaceChildren(document.createTextNode("<img onerror=x>"));
    const escaped = renderDomTree(editor);
    expect(output).not.toContain("<img");
    // Escaped, and the space rendered as a visible-whitespace glyph.
    expect(escaped).toContain("&lt;img·onerror=x&gt;");
    expect(escaped).not.toContain("<img");
  });

  it("does not throw on an empty editor", () => {
    expect(() => setup("")).not.toThrow();
  });
});

describe("textLength", () => {
  it("counts text characters", () => {
    editor.innerHTML = "hello";
    expect(textLength(editor)).toBe(5);
  });

  it("counts a br as one newline, unlike Range.toString()", () => {
    editor.innerHTML = "one<br>two";
    expect(textLength(editor)).toBe(7);
  });

  it("descends into nested elements", () => {
    editor.innerHTML = 'a<span class="chip">bc</span>d';
    expect(textLength(editor)).toBe(4);
  });

  it("is zero for an empty editor", () => {
    editor.innerHTML = "";
    expect(textLength(editor)).toBe(0);
  });
});
