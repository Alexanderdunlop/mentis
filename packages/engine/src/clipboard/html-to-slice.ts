import { atomNode, isText, textNode } from "../model/nodes";
import { normalise } from "../model/normalise";
import type { InlineNode, Slice } from "../model/types";
import { isAtomElement, VALUE_ATTR } from "../view/atom-element";
import { collapseWhitespace } from "./collapse-whitespace";
import { nbspToSpace } from "./nbsp-to-space";
import { normaliseText } from "./normalise-text";
import { preservesWhitespace } from "./preserves-whitespace";
import { tagRole } from "./tag-role";
import { tidySlice } from "./tidy-slice";

/**
 * Parse pasted HTML into a slice.
 *
 * **This is a parse, not a reconciliation.** `view/read-dom-state.ts` looks like it would
 * do and is the wrong tool: it recovers a model from DOM the engine itself rendered and
 * the browser then edited, so it assumes canonical structure and keeps every character
 * verbatim. Here the markup is arbitrary and from an unknown application, we know exactly
 * what arrived, and the interesting work is deciding what each element *means*. See
 * docs/adr/0011-paste-is-a-parse-not-a-recovery.md.
 *
 * The whole vocabulary is in `tag-role.ts`: text comes through, blocks become newlines, a
 * handful of elements are dropped whole, and everything else is transparent.
 */
export const htmlToSlice = (html: string): Slice => {
  const { body } = new DOMParser().parseFromString(html, "text/html");
  if (!body) return [];

  const nodes: InlineNode[] = [];
  let preserved = false;
  /**
   * A block edge seen but not yet committed.
   *
   * Deferring it is what keeps a fragment's own outer edges from becoming content: a
   * `<pre>` copied on its own would otherwise arrive wrapped in newlines nobody selected.
   * A pending edge that nothing follows is simply never written.
   */
  let pendingBreak = false;

  const emit = (node: InlineNode): void => {
    if (pendingBreak) {
      pendingBreak = false;
      const last = nodes[nodes.length - 1];
      // Nested blocks close and open together; one edge, not one per level.
      if (!(last && isText(last) && last.text.endsWith("\n"))) {
        nodes.push(textNode("\n"));
      }
    }
    nodes.push(node);
  };

  const pushText = (text: string): void => {
    if (text === "") return;
    emit(textNode(text));
  };

  /** Nothing yet written means nothing to separate from. */
  const markBreak = (): void => {
    if (nodes.length > 0) pendingBreak = true;
  };

  const visit = (node: Node, preserving: boolean): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const data = (node as Text).data;
      pushText(normaliseText(preserving ? data : collapseWhitespace(data)));
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as Element;

    // An explicit break is always meant, so it is written rather than deduplicated
    // against another `<br>` — `one<br><br>two` really does have a blank line in it. It
    // goes through `emit` so that a block edge waiting in front of it still lands:
    // `<div>a</div><div><br>b</div>` is two breaks, not one.
    if (element.tagName.toUpperCase() === "BR") {
      emit(textNode("\n"));
      return;
    }

    if (isAtomElement(element)) {
      emit(
        atomNode(element.textContent ?? "", element.getAttribute(VALUE_ATTR) ?? "")
      );
      return;
    }

    const role = tagRole(element.tagName);
    if (role === "skip") return;

    const preservesHere =
      preserving ||
      preservesWhitespace(element.tagName, element.getAttribute("style"));
    preserved ||= preservesHere;

    if (role === "break") markBreak();
    for (const child of Array.from(element.childNodes)) visit(child, preservesHere);
    if (role === "break") markBreak();
  };

  for (const child of Array.from(body.childNodes)) visit(child, false);

  const parsed = normalise({ nodes }).nodes;

  // A source that declared its whitespace significant is taken at its word — which is
  // also how the engine's own copy survives a round trip with its spaces intact.
  const tidied = preserved ? parsed : tidySlice(parsed);

  // Last, so that every rule above saw a non-breaking space as the non-collapsing
  // character it is. See `nbsp-to-space.ts`.
  return tidied.map((node) =>
    isText(node) ? textNode(nbspToSpace(node.text)) : node
  );
};
