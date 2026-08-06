import { beforeEach, describe, expect, it } from "vitest";
import { createDoc } from "../../model/create-doc";
import { docText } from "../../model/doc-text";
import { domToModel } from "../dom-to-model";
import { modelToDom } from "../model-to-dom";
import { render } from "../render";

let root: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = "";
  root = document.createElement("div");
  document.body.appendChild(root);
});

describe("render", () => {
  it("writes the document text into a single text node", () => {
    render(root, createDoc("hello"));
    expect(root.childNodes).toHaveLength(1);
    expect(root.textContent).toBe("hello");
  });

  it("leaves an empty document with no children", () => {
    render(root, createDoc(""));
    expect(root.childNodes).toHaveLength(0);
  });

  it("renders a newline as a character, not a <br>", () => {
    render(root, createDoc("one\ntwo"));
    expect(root.querySelector("br")).toBeNull();
    expect(root.textContent).toBe("one\ntwo");
  });

  it("appends a trailing <br> when the document ends in a newline", () => {
    render(root, createDoc("one\n"));
    expect(root.querySelector("br")).not.toBeNull();
    // The <br> is a rendering artifact and must not add to the text.
    expect(root.textContent).toBe("one\n");
  });

  it("removes the trailing <br> once the newline goes away", () => {
    render(root, createDoc("one\n"));
    render(root, createDoc("one"));
    expect(root.querySelector("br")).toBeNull();
    expect(root.textContent).toBe("one");
  });

  it("patches the existing text node rather than replacing it", () => {
    render(root, createDoc("hello"));
    const before = root.firstChild;

    render(root, createDoc("hello world"));

    // Node identity is what a live Range points at; replacing it destroys the caret.
    expect(root.firstChild).toBe(before);
    expect(root.textContent).toBe("hello world");
  });

  it("never assigns innerHTML, so injected markup stays text", () => {
    render(root, createDoc("<img onerror=x>"));
    expect(root.querySelector("img")).toBeNull();
    expect(root.textContent).toBe("<img onerror=x>");
  });

  it("clears leftover nodes from a previous render", () => {
    root.append(
      document.createTextNode("junk"),
      document.createElement("span"),
      document.createElement("br")
    );
    render(root, createDoc("clean"));
    expect(root.childNodes).toHaveLength(1);
    expect(root.textContent).toBe("clean");
  });

  it("is idempotent", () => {
    const doc = createDoc("stable\n");
    render(root, doc);
    const html = root.innerHTML;
    render(root, doc);
    expect(root.innerHTML).toBe(html);
  });
});

describe("model ↔ dom position mapping", () => {
  it("round-trips every position in a plain document", () => {
    const doc = createDoc("hello");
    render(root, doc);

    for (let position = 0; position <= docText(doc).length; position += 1) {
      const point = modelToDom(root, doc, position);
      expect(domToModel(root, doc, point.node, point.offset)).toBe(position);
    }
  });

  it("round-trips across a newline", () => {
    const doc = createDoc("one\ntwo");
    render(root, doc);

    for (let position = 0; position <= docText(doc).length; position += 1) {
      const point = modelToDom(root, doc, position);
      expect(domToModel(root, doc, point.node, point.offset)).toBe(position);
    }
  });

  it("puts the caret on the root element for an empty document", () => {
    const doc = createDoc("");
    render(root, doc);

    const point = modelToDom(root, doc, 0);
    expect(point.node).toBe(root);
    expect(point.offset).toBe(0);
    expect(domToModel(root, doc, point.node, point.offset)).toBe(0);
  });

  it("clamps a position past the end", () => {
    const doc = createDoc("ab");
    render(root, doc);
    expect(modelToDom(root, doc, 99).offset).toBe(2);
  });

  it("reports null for a node outside the editor", () => {
    const doc = createDoc("ab");
    render(root, doc);
    const outside = document.createElement("div");
    document.body.appendChild(outside);
    expect(domToModel(root, doc, outside, 0)).toBeNull();
  });

  it("maps the trailing <br> to the end of the document", () => {
    const doc = createDoc("one\n");
    render(root, doc);
    const br = root.querySelector("br")!;
    expect(domToModel(root, doc, br, 0)).toBe(4);
  });
});
