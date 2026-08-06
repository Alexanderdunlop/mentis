import { beforeEach, describe, expect, it } from "vitest";
import { insertMention } from "../../commands/insert-mention";
import { docLength } from "../../model/doc-length";
import { docText } from "../../model/doc-text";
import { mentions } from "../../model/mentions";
import { textNode } from "../../model/nodes";
import { replaceWithText } from "../../model/transaction";
import { createEditor } from "../create-editor";
import type { Editor } from "../types";

/**
 * The M3 definition of done: undo and redo survive a mixed session of typing, chip
 * insertion, deletion and paste.
 *
 * Drives the editor through `dispatch` rather than real events — happy-dom cannot produce
 * a trusted `beforeinput`, and this is about the model/history loop rather than about
 * input plumbing, which `transaction-for` covers separately.
 */

let element: HTMLElement;
let clock: number;
let editor: Editor;

const setup = (initialText = ""): Editor => {
  element = document.createElement("div");
  document.body.appendChild(element);
  clock = 1000;
  return createEditor({ element, initialText, now: () => clock });
};

/** One character, as a user edit — the shape that coalesces. */
const type = (char: string, at?: number): void => {
  const position = at ?? docLength(editor.getState().doc);
  editor.dispatch({
    steps: [{ type: "insert", at: position, slice: [textNode(char)] }],
    selection: { anchor: position + 1, head: position + 1 },
    origin: "user",
  });
};

const typeAll = (word: string): void => {
  for (const char of word) {
    type(char);
    clock += 50;
  }
};

const backspace = (): void => {
  const end = docLength(editor.getState().doc);
  editor.dispatch({
    steps: [{ type: "delete", from: end - 1, to: end }],
    selection: { anchor: end - 1, head: end - 1 },
    origin: "user",
  });
};

const text = (): string => docText(editor.getState().doc);

beforeEach(() => {
  document.body.innerHTML = "";
  editor = setup();
});

describe("undo and redo", () => {
  it("collapses a typing run into a single undo", () => {
    typeAll("hello");
    expect(text()).toBe("hello");
    expect(editor.getHistory().depth).toBe(1);

    expect(editor.undo()).toBe(true);
    expect(text()).toBe("");
  });

  it("splits the run at a pause", () => {
    typeAll("hello");
    clock += 5000;
    typeAll("there");

    expect(editor.getHistory().depth).toBe(2);
    editor.undo();
    expect(text()).toBe("hello");
  });

  it("redoes what it undid", () => {
    typeAll("hello");
    editor.undo();
    expect(editor.redo()).toBe(true);
    expect(text()).toBe("hello");
  });

  it("reports nothing to do at the ends", () => {
    expect(editor.undo()).toBe(false);
    typeAll("hi");
    editor.undo();
    expect(editor.undo()).toBe(false);
    editor.redo();
    expect(editor.redo()).toBe(false);
  });

  it("keeps the DOM in step with the model through undo", () => {
    typeAll("hello");
    editor.undo();
    // The DOM is a projection; undo must not leave it showing the old text.
    expect(element.textContent).toBe("");

    editor.redo();
    expect(element.textContent).toBe("hello");
  });

  it("restores the caret to where the user was", () => {
    typeAll("hello");
    editor.undo();
    expect(editor.getState().selection).toEqual({ anchor: 0, head: 0 });
  });

  it("separates typing from deleting", () => {
    typeAll("hey");
    clock += 50;
    backspace();

    expect(text()).toBe("he");
    expect(editor.getHistory().depth).toBe(2);

    editor.undo();
    expect(text()).toBe("hey");
    editor.undo();
    expect(text()).toBe("");
  });

  it("collapses a backspace run", () => {
    typeAll("hello");
    clock += 5000;
    for (let i = 0; i < 3; i += 1) {
      backspace();
      clock += 50;
    }
    expect(text()).toBe("he");

    editor.undo();
    expect(text()).toBe("hello");
  });

  it("treats a mention as its own step and restores its value", () => {
    typeAll("hi ");
    clock += 50;
    editor.dispatch(
      insertMention({ label: "@Alice", value: "user-1", range: { from: 3, to: 3 } })
    );

    expect(mentions(editor.getState().doc)).toHaveLength(1);
    // A programmatic edit never coalesces with the typing before it.
    expect(editor.getHistory().depth).toBe(2);

    editor.undo();
    expect(mentions(editor.getState().doc)).toHaveLength(0);
    expect(text()).toBe("hi ");

    editor.redo();
    expect(mentions(editor.getState().doc)).toEqual([
      { label: "@Alice", value: "user-1", at: 3 },
    ]);
  });

  it("treats a paste as one step, not one per character", () => {
    editor.dispatch({
      steps: replaceWithText(0, 0, "pasted text"),
      selection: { anchor: 11, head: 11 },
      origin: "user",
    });
    expect(editor.getHistory().depth).toBe(1);
    editor.undo();
    expect(text()).toBe("");
  });

  it("survives a mixed session end to end", () => {
    typeAll("hey");
    clock += 5000;
    editor.dispatch(
      insertMention({ label: "@Bob", value: "user-2", range: { from: 3, to: 3 } })
    );
    clock += 5000;
    editor.dispatch({
      steps: replaceWithText(docLength(editor.getState().doc), docLength(editor.getState().doc), "pasted"),
      origin: "user",
    });
    clock += 5000;
    typeAll("!");

    const final = text();
    const depth = editor.getHistory().depth;
    expect(depth).toBe(4);

    // All the way back...
    for (let i = 0; i < depth; i += 1) editor.undo();
    expect(text()).toBe("");
    expect(editor.getHistory().canUndo).toBe(false);

    // ...and all the way forward.
    for (let i = 0; i < depth; i += 1) editor.redo();
    expect(text()).toBe(final);
    expect(mentions(editor.getState().doc)).toHaveLength(1);
  });

  it("drops the redo branch once a new edit lands", () => {
    typeAll("hello");
    editor.undo();
    expect(editor.getHistory().canRedo).toBe(true);

    clock += 5000;
    typeAll("bye");
    expect(editor.getHistory().canRedo).toBe(false);
  });

  it("does not record undo itself, so undo cannot loop", () => {
    typeAll("hi");
    const before = editor.getHistory().depth;
    editor.undo();
    editor.redo();
    expect(editor.getHistory().depth).toBe(before);
  });

  it("restores a document that was emptied", () => {
    editor = setup("start");
    editor.dispatch({
      steps: [{ type: "delete", from: 0, to: 5 }],
      selection: { anchor: 0, head: 0 },
      origin: "user",
    });
    expect(text()).toBe("");

    editor.undo();
    expect(text()).toBe("start");
    expect(element.textContent).toBe("start");
  });
});
