import { nodeLength } from "../node-length";
import { isAtom } from "../nodes";
import { normalise } from "../normalise";
import { clampPosition, resolvePosition } from "../resolve-position";
import { sliceBetween, sliceLength } from "../slice-between";
import type { Doc, InlineNode, Slice } from "../types";
import type { AppliedStep, Step } from "./types";

const insertSlice = (doc: Doc, at: number, slice: Slice): Doc => {
  const { index, offset } = resolvePosition(doc, at);
  const nodes = [...doc.nodes];
  const target = nodes[index];

  if (!target) {
    // Empty document, or a position past the last node.
    nodes.push(...slice);
    return normalise({ nodes });
  }

  if (isAtom(target)) {
    // An atom cannot be split; offset 0 means before it, 1 means after.
    nodes.splice(index + offset, 0, ...slice);
    return normalise({ nodes });
  }

  nodes.splice(
    index,
    1,
    { type: "text", text: target.text.slice(0, offset) },
    ...slice,
    { type: "text", text: target.text.slice(offset) }
  );
  return normalise({ nodes });
};

const deleteRange = (doc: Doc, from: number, to: number): Doc => {
  const nodes: InlineNode[] = [];
  let start = 0;

  for (const node of doc.nodes) {
    const end = start + nodeLength(node);
    const untouched = end <= from || start >= to;

    if (untouched) {
      nodes.push(node);
    } else if (!isAtom(node)) {
      nodes.push({
        type: "text",
        text:
          node.text.slice(0, Math.max(0, from - start)) +
          node.text.slice(Math.max(0, to - start)),
      });
    }
    // An atom is indivisible: any overlap removes it entirely.

    start = end;
  }

  return normalise({ nodes });
};

/**
 * Apply a step, returning the new doc alongside the step that undoes it.
 *
 * The inverse is computed here because only this function holds the pre-application doc.
 * A delete cannot be inverted after the fact — the nodes it removed are gone, and for an
 * atom that would mean losing its `value` as well as its label.
 */
export const applyStep = (doc: Doc, step: Step): AppliedStep => {
  if (step.type === "insert") {
    const at = clampPosition(doc, step.at);
    return {
      doc: insertSlice(doc, at, step.slice),
      inverse: {
        type: "delete",
        from: at,
        to: at + sliceLength(step.slice),
      },
    };
  }

  const from = clampPosition(doc, Math.min(step.from, step.to));
  const to = clampPosition(doc, Math.max(step.from, step.to));

  return {
    doc: deleteRange(doc, from, to),
    inverse: { type: "insert", at: from, slice: sliceBetween(doc, from, to) },
  };
};
