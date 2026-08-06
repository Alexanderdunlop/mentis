import type { Editor } from "../src/editor/types";
import { docLength } from "../src/model/doc-length";
import { docText } from "../src/model/doc-text";
import { domToModel } from "../src/view/dom-to-model";
import type { ModelProbe } from "../src/devtools/index";

/**
 * Adapts an `Editor` to the inspector's `ModelProbe` seam.
 *
 * Takes a getter rather than an editor because the harness can attach and detach the
 * engine at runtime, and the inspector reads its probe once at construction.
 *
 * Lives in `dev/` so that nothing in the engine imports the devtools — the dependency
 * only ever points this way.
 */
export const engineProbe = (getEditor: () => Editor | null): ModelProbe => ({
  label: "M1 — text only · uncheck “engine” for a bare contentEditable",

  getState: () => {
    const editor = getEditor();
    if (!editor) return null;

    const { doc, selection } = editor.getState();
    const text = docText(doc);
    return {
      text,
      // Visible characters vs positions — these differ once a mention exists (ADR 0005).
      characters: text.length,
      positions: docLength(doc),
      selection,
      history: editor.getHistory(),
      nodes: doc.nodes,
    };
  },

  domToModel: (node, offset) => {
    const editor = getEditor();
    if (!editor) return null;
    return domToModel(editor.element, editor.getState().doc, node, offset);
  },
});
