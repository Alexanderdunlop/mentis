import { beforeEach, describe, expect, it } from "vitest";
import { docLength } from "../../model/doc-length";
import { atomNode, textNode } from "../../model/nodes";
import type { Doc } from "../../model/types";
import { VALUE_ATTR } from "../atom-element";
import { domToModel } from "../dom-to-model";
import { modelToDom } from "../model-to-dom";
import { render } from "../render";

let root: HTMLElement;

const doc = (...nodes: Doc["nodes"]): Doc => ({ nodes });
const chip = () => atomNode("@Alice", "user-1");

beforeEach(() => {
  document.body.innerHTML = "";
  root = document.createElement("div");
  document.body.appendChild(root);
});

describe("render — atoms", () => {
  it("renders an atom as a contenteditable=false span carrying its value", () => {
    render(root, doc(chip()));

    const span = root.querySelector("span")!;
    expect(span.getAttribute("contenteditable")).toBe("false");
    expect(span.getAttribute(VALUE_ATTR)).toBe("user-1");
    expect(span.textContent).toBe("@Alice");
  });

  it("keeps one DOM child per model node, in order", () => {
    render(root, doc(textNode("hi "), chip(), textNode(" there")));

    expect(root.childNodes).toHaveLength(3);
    expect(root.childNodes[0]!.nodeType).toBe(Node.TEXT_NODE);
    expect(root.childNodes[1]!.nodeName).toBe("SPAN");
    expect(root.childNodes[2]!.nodeType).toBe(Node.TEXT_NODE);
  });

  it("patches an atom in place rather than replacing the element", () => {
    render(root, doc(chip()));
    const before = root.querySelector("span");

    render(root, doc(atomNode("@Alice Smith", "user-1")));

    expect(root.querySelector("span")).toBe(before);
    expect(before!.textContent).toBe("@Alice Smith");
  });

  it("updates the value when only the value changes", () => {
    render(root, doc(chip()));
    render(root, doc(atomNode("@Alice", "user-9")));
    expect(root.querySelector("span")!.getAttribute(VALUE_ATTR)).toBe("user-9");
  });

  it("renders two atoms with the same label as separate elements", () => {
    render(root, doc(atomNode("@Alex", "user-1"), atomNode("@Alex", "user-2")));

    const spans = root.querySelectorAll("span");
    expect(spans).toHaveLength(2);
    expect(spans[0]!.getAttribute(VALUE_ATTR)).toBe("user-1");
    expect(spans[1]!.getAttribute(VALUE_ATTR)).toBe("user-2");
  });

  it("replaces a text node with an atom at the same index", () => {
    render(root, doc(textNode("x")));
    render(root, doc(chip()));

    expect(root.childNodes).toHaveLength(1);
    expect(root.childNodes[0]!.nodeName).toBe("SPAN");
  });

  it("replaces an atom with a text node at the same index", () => {
    render(root, doc(chip()));
    render(root, doc(textNode("x")));

    expect(root.childNodes).toHaveLength(1);
    expect(root.childNodes[0]!.nodeType).toBe(Node.TEXT_NODE);
    expect(root.textContent).toBe("x");
  });

  it("is idempotent", () => {
    const document_ = doc(textNode("hi "), chip(), textNode(" there"));
    render(root, document_);
    const html = root.innerHTML;
    render(root, document_);
    expect(root.innerHTML).toBe(html);
  });
});

describe("position mapping — atoms", () => {
  const withAtom = () => doc(textNode("hi "), chip(), textNode("there"));

  it("round-trips every position across an atom", () => {
    const document_ = withAtom();
    render(root, document_);

    for (let position = 0; position <= docLength(document_); position += 1) {
      const point = modelToDom(root, document_, position);
      expect(domToModel(root, document_, point.node, point.offset)).toBe(position);
    }
  });

  it("treats an atom as one position wide", () => {
    const document_ = withAtom();
    // "hi " is 3, the atom is 1, "there" is 5 — nine positions, not fourteen characters.
    expect(docLength(document_)).toBe(9);
  });

  it("maps a caret inside the atom's label to its nearer edge", () => {
    const document_ = withAtom();
    render(root, document_);
    const label = root.querySelector("span")!.firstChild!;

    // There is no model position inside an atom to return — ADR 0005 — so interior DOM
    // positions snap out rather than needing a correction pass.
    expect(domToModel(root, document_, label, 0)).toBe(3);
    expect(domToModel(root, document_, label, 3)).toBe(4);
  });

  it("maps a boundary on the atom element itself to an edge", () => {
    const document_ = withAtom();
    render(root, document_);
    const span = root.querySelector("span")!;

    expect(domToModel(root, document_, span, 0)).toBe(3);
    expect(domToModel(root, document_, span, 1)).toBe(4);
  });

  it("prefers an adjacent text position over an element boundary", () => {
    const document_ = withAtom();
    render(root, document_);

    // Position 4 is just after the atom; browsers paint a caret in a text node far more
    // reliably than between two elements.
    const point = modelToDom(root, document_, 4);
    expect(point.node.nodeType).toBe(Node.TEXT_NODE);
    expect(point.offset).toBe(0);
  });

  it("falls back to an element boundary when an atom has no text neighbour", () => {
    const document_ = doc(chip());
    render(root, document_);

    expect(modelToDom(root, document_, 0)).toEqual({ node: root, offset: 0 });
    expect(modelToDom(root, document_, 1)).toEqual({ node: root, offset: 1 });
  });

  it("round-trips a document that is only atoms", () => {
    const document_ = doc(atomNode("a", "1"), atomNode("b", "2"));
    render(root, document_);

    for (let position = 0; position <= docLength(document_); position += 1) {
      const point = modelToDom(root, document_, position);
      expect(domToModel(root, document_, point.node, point.offset)).toBe(position);
    }
  });
});
