import { beforeEach, describe, expect, it } from "vitest";
import { serialiseSlice } from "../../clipboard/serialise-slice";
import { docLength } from "../../model/doc-length";
import { docText } from "../../model/doc-text";
import { mentions } from "../../model/mentions";
import { atomNode, textNode } from "../../model/nodes";
import { replaceRange } from "../../model/transaction";
import { writeSelection } from "../../view/dom-selection";
import { createEditor } from "../create-editor";
import type { Editor } from "../types";

/**
 * Copy, cut and paste through the editor's real event path.
 *
 * Two parts of the environment have to be played by hand, the way the composition tests
 * play an IME:
 *
 *   - **The selection.** happy-dom stores a range but reports `anchorOffset` and
 *     `focusOffset` as 0 whatever it holds, so `readSelection` sees every selection as
 *     collapsed and copy has nothing to write. The stub below reports anchor and focus
 *     off the range, which is what a browser does.
 *   - **`clipboardData`.** A constructed `ClipboardEvent` does not carry a `DataTransfer`
 *     here, which is the same limitation the traps note records for Firefox.
 *
 * So these tests assert **the engine's contract** — what it writes when asked to copy,
 * that it cancels the event so the browser does not write its own, that a cut is one undo
 * step with the clipboard written first. They are not evidence that any browser hands the
 * payload back; only a real copy-and-paste shows that, and ADR 0010 says so.
 */

let element: HTMLElement;
let editor: Editor;

/**
 * A `Selection` that reports anchor and focus. Direction is not modelled — anchor is
 * always the range start — which costs nothing here, because copy and cut reduce the
 * selection to a range before doing anything with it.
 */
const installSelection = (): void => {
  let current: Range | null = null;
  const selection = {
    get rangeCount() {
      return current ? 1 : 0;
    },
    get anchorNode() {
      return current?.startContainer ?? null;
    },
    get anchorOffset() {
      return current?.startOffset ?? 0;
    },
    get focusNode() {
      return current?.endContainer ?? null;
    },
    get focusOffset() {
      return current?.endOffset ?? 0;
    },
    getRangeAt: () => current,
    removeAllRanges: () => void (current = null),
    addRange: (range: Range) => void (current = range),
  };
  window.getSelection = () => selection as unknown as Selection;
};

const setup = (initialText = ""): Editor => {
  element = document.createElement("div");
  document.body.appendChild(element);
  return createEditor({ element, initialText, now: () => 1000 });
};

/** Straight to the DOM, so selecting does not itself land on the undo stack. */
const selectRange = (from: number, to: number): void => {
  writeSelection(element, editor.getState().doc, { anchor: from, head: to });
};

/** A `DataTransfer` the constructed event will actually carry. */
const clipboardEvent = (type: "copy" | "cut"): ClipboardEvent => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const data = new DataTransfer();
  Object.defineProperty(event, "clipboardData", { value: data });
  return event as ClipboardEvent;
};

const pasteEvent = (payload: Record<string, string>): InputEvent => {
  const event = new Event("beforeinput", { bubbles: true, cancelable: true });
  const data = new DataTransfer();
  for (const [type, value] of Object.entries(payload)) data.setData(type, value);
  Object.defineProperties(event, {
    inputType: { value: "insertFromPaste" },
    data: { value: null },
    dataTransfer: { value: data },
    getTargetRanges: { value: () => [] },
  });
  return event as InputEvent;
};

const text = (): string => docText(editor.getState().doc);

beforeEach(() => {
  document.body.innerHTML = "";
  installSelection();
  editor = setup();
});

describe("copy", () => {
  it("writes both flavours, the mention's value only on the HTML one", () => {
    editor = setup("hi ");
    editor.dispatch({
      steps: replaceRange(3, 3, [atomNode("@Alice", "u_1"), textNode("!")]),
      origin: "program",
    });
    selectRange(0, docLength(editor.getState().doc));

    const event = clipboardEvent("copy");
    element.dispatchEvent(event);

    expect(event.clipboardData?.getData("text/plain")).toBe("hi @Alice!");
    expect(event.clipboardData?.getData("text/html")).toContain(
      'data-mention-value="u_1"'
    );
  });

  it("cancels the event, so the browser does not write its own serialisation", () => {
    editor = setup("hello");
    selectRange(0, 5);

    const event = clipboardEvent("copy");
    element.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("leaves a collapsed selection to the browser and changes nothing", () => {
    editor = setup("hello");
    selectRange(2, 2);

    const event = clipboardEvent("copy");
    element.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(event.clipboardData?.getData("text/plain")).toBe("");
    expect(text()).toBe("hello");
  });
});

describe("cut", () => {
  it("writes the clipboard from the document as it was, then deletes", () => {
    editor = setup("hello world");
    selectRange(0, 5);

    const event = clipboardEvent("cut");
    element.dispatchEvent(event);

    expect(event.clipboardData?.getData("text/plain")).toBe("hello");
    expect(text()).toBe(" world");
  });

  it("is a single undo step, and undo brings back what was cut", () => {
    editor = setup("hello world");
    const before = editor.getHistory().depth;
    selectRange(0, 5);

    element.dispatchEvent(clipboardEvent("cut"));

    expect(editor.getHistory().depth).toBe(before + 1);
    expect(editor.undo()).toBe(true);
    expect(text()).toBe("hello world");
  });

  it("restores a cut mention as a mention, because the step carries a slice", () => {
    editor.dispatch({
      steps: replaceRange(0, 0, [textNode("hi "), atomNode("@Alice", "u_1")]),
      origin: "program",
    });
    selectRange(0, docLength(editor.getState().doc));

    element.dispatchEvent(clipboardEvent("cut"));
    expect(mentions(editor.getState().doc)).toHaveLength(0);

    editor.undo();
    expect(mentions(editor.getState().doc)).toEqual([
      { label: "@Alice", value: "u_1", at: 3 },
    ]);
  });

  it("does nothing at a collapsed caret", () => {
    editor = setup("hello");
    selectRange(2, 2);

    const event = clipboardEvent("cut");
    element.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(text()).toBe("hello");
  });
});

describe("paste", () => {
  it("takes the HTML flavour, so a copied mention comes back as a mention", () => {
    const { html } = serialiseSlice([textNode("hi "), atomNode("@Alice", "u_1")]);
    element.dispatchEvent(pasteEvent({ "text/plain": "hi @Alice", "text/html": html }));

    expect(mentions(editor.getState().doc)).toEqual([
      { label: "@Alice", value: "u_1", at: 3 },
    ]);
    // Four positions, nine characters — the two coordinate spaces of ADR 0005.
    expect(docLength(editor.getState().doc)).toBe(4);
    expect(text()).toBe("hi @Alice");
  });

  it("falls back to plain text when there is no HTML", () => {
    element.dispatchEvent(pasteEvent({ "text/plain": "just text" }));
    expect(text()).toBe("just text");
  });

  it("flattens foreign HTML instead of importing its structure", () => {
    element.dispatchEvent(
      pasteEvent({
        "text/plain": "one\ntwo",
        "text/html": "<div><p>one</p><ul><li>two</li></ul></div><script>x=1</script>",
      })
    );

    expect(text()).toBe("one\ntwo");
    expect(element.querySelector("p")).toBeNull();
    expect(element.querySelector("script")).toBeNull();
    // The renderer's invariant holds: one child per model node, plus the trailing <br>
    // only when the document ends in a newline.
    expect(element.childNodes).toHaveLength(1);
  });

  it("replaces the selection it was dropped on", () => {
    editor = setup("hello world");
    selectRange(0, 5);
    element.dispatchEvent(pasteEvent({ "text/plain": "goodbye" }));
    expect(text()).toBe("goodbye world");
  });

  it("is its own undo step even for a single character", () => {
    // `editShapeOf` classifies a one-character insert as typing; dispatching paste as a
    // command is what keeps it out of the run. See transaction-for.ts.
    editor = setup("");
    element.dispatchEvent(pasteEvent({ "text/plain": "x" }));
    const afterPaste = editor.getHistory().depth;

    element.dispatchEvent(pasteEvent({ "text/plain": "y" }));
    expect(editor.getHistory().depth).toBe(afterPaste + 1);

    editor.undo();
    expect(text()).toBe("x");
  });

  it("inserts nothing when the transfer holds nothing it can use", () => {
    editor = setup("hello");
    element.dispatchEvent(pasteEvent({ "text/rtf": "{\\rtf1}" }));
    expect(text()).toBe("hello");
  });
});
