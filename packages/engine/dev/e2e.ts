import { insertMention } from "../src/commands/insert-mention";
import { createEditor } from "../src/editor/create-editor";
import type { Editor } from "../src/editor/types";
import { docLength } from "../src/model/doc-length";
import { docText } from "../src/model/doc-text";
import { mentions } from "../src/model/mentions";
import { replaceRange } from "../src/model/transaction";
import { atomNode, textNode } from "../src/model/nodes";
import type { InlineNode } from "../src/model/types";

/**
 * The e2e harness page — **not** the inspector.
 *
 * The inspector (`dev/index.html`) is a scratchpad that changes whenever a milestone
 * needs a new panel, and specs must never depend on it. This page exists only to be
 * asserted against, which is the same split `packages/mentis/playground/e2e.html` makes
 * for v1 and for the same reason.
 *
 * Everything a spec needs is reachable from `window.engineHarness`. If a spec starts
 * reaching into the DOM to reconstruct model state, a method is missing here.
 *
 * The one thing this deliberately does **not** expose is the `Editor` object itself.
 * Specs drive the editor the way a user does — real keys, real clipboard — and read the
 * model to check the result. Handing them `dispatch` would let a spec set up state the
 * input pipeline could never produce, which is how a suite ends up proving something
 * about itself.
 */

const element = document.querySelector<HTMLElement>("#editor");
if (!element) throw new Error("harness: #editor missing");

let editor: Editor | null = null;
const unhandled: string[] = [];

/** A serialisable view of a node, so a spec can assert structure without the DOM. */
export interface HarnessNode {
  type: "text" | "atom";
  text: string;
  value?: string;
}

/** What `reset` accepts: a run of plain text, or a mention. */
export type Content = string | { label: string; value: string };

const describeNode = (node: InlineNode): HarnessNode =>
  node.type === "atom"
    ? { type: "atom", text: node.label, value: node.value }
    : { type: "text", text: node.text };

export interface HarnessModel {
  /** Visible text — atom labels included. What the DOM's `textContent` should equal. */
  text: string;
  /** **Position** space: an atom is 1 wide however long its label. Not `text.length`. */
  length: number;
  selection: { anchor: number; head: number } | null;
  nodes: HarnessNode[];
  mentions: { label: string; value: string; at: number }[];
  composing: boolean;
  history: { canUndo: boolean; canRedo: boolean; depth: number };
}

const harness = {
  /** Rebuild the editor. `content` accepts plain text or a mention spec, in order. */
  reset(content: Content[] = []): void {
    editor?.destroy();
    element.replaceChildren();
    unhandled.length = 0;

    editor = createEditor({
      element,
      onUnhandledInput: (inputType) => unhandled.push(inputType),
    });

    const slice: InlineNode[] = content.map((item) =>
      typeof item === "string" ? textNode(item) : atomNode(item.label, item.value)
    );
    if (slice.length > 0) {
      editor.dispatch({ steps: replaceRange(0, 0, slice), origin: "program" });
    }
  },

  model(): HarnessModel {
    if (!editor) throw new Error("harness: reset() first");
    const { doc, selection } = editor.getState();
    return {
      text: docText(doc),
      length: docLength(doc),
      selection,
      nodes: doc.nodes.map(describeNode),
      mentions: mentions(doc),
      composing: editor.isComposing(),
      history: editor.getHistory(),
    };
  },

  /** Insert a mention at the caret, the way the dropdown does. */
  insertMention(label: string, value: string): void {
    if (!editor) throw new Error("harness: reset() first");
    const { selection } = editor.getState();
    const at = selection?.head ?? 0;
    editor.dispatch(insertMention({ label, value, range: { from: at, to: at } }));
  },

  /** Put the caret at a model position, for setting up an edit under test. */
  setCaret(anchor: number, head: number = anchor): void {
    if (!editor) throw new Error("harness: reset() first");
    editor.dispatch({ steps: [], selection: { anchor, head }, origin: "program" });
  },

  /** `inputType`s the engine had no rule for — should be empty in every passing spec. */
  unhandledInput(): string[] {
    return [...unhandled];
  },
};

/** The surface specs drive. Declared once, here, and imported by the fixture. */
export type HarnessApi = typeof harness;

declare global {
  interface Window {
    engineHarness: HarnessApi;
  }
}

window.engineHarness = harness;
harness.reset();
element.focus();
