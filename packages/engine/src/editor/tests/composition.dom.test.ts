import { beforeEach, describe, expect, it } from "vitest";
import { docText } from "../../model/doc-text";
import { mentions } from "../../model/mentions";
import { atomNode, textNode } from "../../model/nodes";
import { replaceRange } from "../../model/transaction";
import { createEditor } from "../create-editor";
import type { Editor } from "../types";

/**
 * Composition, simulated.
 *
 * happy-dom has no IME, so these tests play the browser's part by hand: fire
 * `compositionstart`, write to the DOM the way an IME would, then fire `compositionend`
 * and assert the model caught up.
 *
 * That verifies the reconciliation contract — the model ends up matching the DOM, the DOM
 * ends up canonical, mentions survive, and the whole composition is one undo step. It does
 * **not** verify that real IMEs emit the events in this order or write this shape of DOM.
 * Only a real IME can, and that is stated as unverified in ADR 0009.
 */

let element: HTMLElement;
let editor: Editor;

const setup = (initialText = ""): Editor => {
  element = document.createElement("div");
  document.body.appendChild(element);
  return createEditor({ element, initialText, now: () => 1000 });
};

const compositionStart = (): void => {
  element.dispatchEvent(
    new CompositionEvent("compositionstart", { bubbles: true, data: "" })
  );
};

const compositionEnd = (data: string): void => {
  element.dispatchEvent(
    new CompositionEvent("compositionend", { bubbles: true, data })
  );
};

/** What an IME does while it owns the DOM: writes directly, bypassing the engine. */
const browserWrites = (mutate: () => void): void => mutate();

const text = (): string => docText(editor.getState().doc);

beforeEach(() => {
  document.body.innerHTML = "";
  editor = setup();
});

describe("composition", () => {
  it("reports composing state between the events", () => {
    expect(editor.isComposing()).toBe(false);
    compositionStart();
    expect(editor.isComposing()).toBe(true);
    compositionEnd("");
    expect(editor.isComposing()).toBe(false);
  });

  it("lets beforeinput through while composing, so an IME can work at all", () => {
    compositionStart();

    const event = new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "insertCompositionText",
      data: "に",
    });
    element.dispatchEvent(event);

    // Prevented, an IME cannot render its own pre-edit text and composition dies.
    expect(event.defaultPrevented).toBe(false);
  });

  it("still prevents beforeinput outside composition", () => {
    const event = new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: "a",
    });
    element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("catches the model up to what the browser wrote", () => {
    compositionStart();
    browserWrites(() => {
      element.textContent = "日本語";
    });
    compositionEnd("日本語");

    expect(text()).toBe("日本語");
    expect(element.textContent).toBe("日本語");
  });

  it("composes into the middle of existing text", () => {
    editor = setup("ab");
    compositionStart();
    browserWrites(() => {
      element.textContent = "aXYb";
    });
    compositionEnd("XY");

    expect(text()).toBe("aXYb");
  });

  it("discards structure the browser invented, keeping only its text", () => {
    compositionStart();
    browserWrites(() => {
      // Chrome and Safari wrap pre-edit text in their own element.
      element.replaceChildren();
      const wrapper = document.createElement("span");
      wrapper.textContent = "にほん";
      element.appendChild(wrapper);
    });
    compositionEnd("にほん");

    expect(text()).toBe("にほん");
    // Re-rendered into canonical form: one text node, no wrapper.
    expect(element.querySelector("span")).toBeNull();
    expect(element.childNodes).toHaveLength(1);
  });

  it("keeps a mention and its value across a composition", () => {
    editor = setup("");
    editor.dispatch({
      steps: replaceRange(0, 0, [atomNode("@Alice", "user-1"), textNode(" ")]),
      selection: { anchor: 2, head: 2 },
      origin: "program",
    });

    compositionStart();
    browserWrites(() => {
      // The IME appends after the chip; the chip element itself is untouched.
      element.appendChild(document.createTextNode("日本"));
    });
    compositionEnd("日本");

    expect(mentions(editor.getState().doc)).toEqual([
      { label: "@Alice", value: "user-1", at: 0 },
    ]);
    expect(text()).toBe("@Alice 日本");
  });

  it("records a whole composition as one undo step", () => {
    compositionStart();
    browserWrites(() => {
      element.textContent = "にほんご";
    });
    compositionEnd("にほんご");

    expect(editor.getHistory().depth).toBe(1);
    editor.undo();
    expect(text()).toBe("");
    expect(element.textContent).toBe("");
  });

  it("does nothing when a composition was cancelled without changing anything", () => {
    editor = setup("abc");
    const before = editor.getHistory().depth;

    compositionStart();
    compositionEnd("");

    expect(text()).toBe("abc");
    expect(editor.getHistory().depth).toBe(before);
  });

  it("restores canonical DOM even when the text did not change", () => {
    editor = setup("abc");

    compositionStart();
    browserWrites(() => {
      // Same text, but split across nodes the way a browser might leave it.
      element.replaceChildren(
        document.createTextNode("a"),
        document.createTextNode("bc")
      );
    });
    compositionEnd("");

    expect(text()).toBe("abc");
    expect(element.childNodes).toHaveLength(1);
  });

  it("replaces a selection the IME composed over", () => {
    editor = setup("hello");
    compositionStart();
    browserWrites(() => {
      element.textContent = "日";
    });
    compositionEnd("日");

    expect(text()).toBe("日");
    editor.undo();
    expect(text()).toBe("hello");
  });

  it("does not track selection while the DOM is out of step", () => {
    editor = setup("abc");
    compositionStart();
    browserWrites(() => {
      element.replaceChildren(document.createElement("span"));
    });

    // A selectionchange here would map through a DOM that no longer matches the model.
    document.dispatchEvent(new Event("selectionchange"));
    expect(text()).toBe("abc");
  });
});
