import { beforeEach, describe, expect, it } from "vitest";
import { docLength } from "../../model/doc-length";
import { docText } from "../../model/doc-text";
import { atomNode, textNode } from "../../model/nodes";
import { replaceRange } from "../../model/transaction";
import { createEditor } from "../create-editor";
import type { Editor } from "../types";

/**
 * M6's gauntlet, through the real input pipeline.
 *
 * Every event here reports **no target ranges**, which is deliberate: that is the fallback
 * path, the one where the engine has to work out "one character" for itself rather than
 * being handed the answer. It is also what happy-dom produces, so it is the path these
 * tests can actually reach — a real browser supplies `getTargetRanges()` and resolves
 * grapheme boundaries itself (ADR 0004), which is why this is a belt for the braces.
 *
 * Characters are written as escapes, never typed: two of them contain a zero-width joiner
 * that no reviewer could see.
 */

const THUMBS_UP = "\u{1F44D}";
const THUMBS_DOWN = "\u{1F44E}";
const FAMILY = "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}";
const FLAG_NZ = "\u{1F1F3}\u{1F1FF}";
const E_COMBINING = "e\u{0301}";

let element: HTMLElement;
let editor: Editor;

const setup = (initialText = ""): Editor => {
  element = document.createElement("div");
  document.body.appendChild(element);
  return createEditor({ element, initialText, now: () => 1000 });
};

/** A `beforeinput` with no target ranges — the engine's own fallback path. */
const fire = (inputType: string, data: string | null = null): void => {
  const event = new Event("beforeinput", { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    inputType: { value: inputType },
    data: { value: data },
    dataTransfer: { value: null },
    getTargetRanges: { value: () => [] },
  });
  element.dispatchEvent(event);
};

const caretToEnd = (): void => {
  const end = docLength(editor.getState().doc);
  editor.dispatch({
    steps: [],
    selection: { anchor: end, head: end },
    origin: "program",
  });
};

const text = (): string => docText(editor.getState().doc);

/** A lone surrogate renders as `?` and the user can neither select nor delete it. */
const hasLoneSurrogate = (value: string): boolean => {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(i + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      i += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
};

beforeEach(() => {
  document.body.innerHTML = "";
  editor = setup();
});

describe("backspace over one user-perceived character", () => {
  const cases: [string, string][] = [
    ["a surrogate pair", THUMBS_UP],
    ["a ZWJ sequence", FAMILY],
    ["a flag", FLAG_NZ],
    ["a combining accent", E_COMBINING],
  ];

  for (const [name, character] of cases) {
    it(`deletes ${name} whole, leaving nothing behind`, () => {
      editor = setup(`hi ${character}`);
      caretToEnd();

      fire("deleteContentBackward");

      expect(text()).toBe("hi ");
      expect(hasLoneSurrogate(text())).toBe(false);
      expect(element.textContent).toBe("hi ");
    });
  }

  it("never leaves a lone surrogate, whatever it is asked to eat", () => {
    editor = setup(`${THUMBS_UP}${FAMILY}${FLAG_NZ}${E_COMBINING}`);
    caretToEnd();

    for (let i = 0; i < 8; i += 1) {
      fire("deleteContentBackward");
      expect(hasLoneSurrogate(text())).toBe(false);
      expect(hasLoneSurrogate(element.textContent ?? "")).toBe(false);
    }

    expect(text()).toBe("");
  });

  it("still deletes a whole mention in one press, which is also one position", () => {
    editor.dispatch({
      steps: replaceRange(0, 0, [textNode("hi "), atomNode("@Alice", "u_1")]),
      origin: "program",
    });
    caretToEnd();

    fire("deleteContentBackward");

    expect(text()).toBe("hi ");
    expect(element.querySelector("[data-mention-value]")).toBeNull();
  });
});

describe("delete forward over one user-perceived character", () => {
  it("takes the whole character, not its first code unit", () => {
    editor = setup(`${THUMBS_UP}x`);
    editor.dispatch({ steps: [], selection: { anchor: 0, head: 0 }, origin: "program" });

    fire("deleteContentForward");

    expect(text()).toBe("x");
    expect(hasLoneSurrogate(text())).toBe(false);
  });
});

describe("undo across nasty input", () => {
  it("restores a deleted emoji intact", () => {
    editor = setup(`hi ${THUMBS_UP}`);
    caretToEnd();

    fire("deleteContentBackward");
    expect(text()).toBe("hi ");

    editor.undo();
    expect(text()).toBe(`hi ${THUMBS_UP}`);
    expect(hasLoneSurrogate(text())).toBe(false);
  });

  it("groups typed emoji into the typing run around them", () => {
    // One undo step, because an emoji is one character for coalescing even though it is
    // two positions. Measured in code units it would be three separate steps.
    editor = setup("");
    for (const character of ["h", "i", THUMBS_UP, THUMBS_DOWN]) {
      const at = docLength(editor.getState().doc);
      editor.dispatch({
        steps: [{ type: "insert", at, slice: [textNode(character)] }],
        selection: {
          anchor: at + character.length,
          head: at + character.length,
        },
        origin: "user",
      });
    }

    expect(text()).toBe(`hi${THUMBS_UP}${THUMBS_DOWN}`);
    expect(editor.getHistory().depth).toBe(1);

    editor.undo();
    expect(text()).toBe("");
  });
});
