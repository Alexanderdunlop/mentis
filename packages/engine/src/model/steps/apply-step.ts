import { normalise } from "../normalise";
import { nodeLength } from "../node-length";
import { clampPosition, resolvePosition } from "../resolve-position";
import { textBetween } from "../text-between";
import type { Doc, InlineNode } from "../types";
import type { AppliedStep, Step } from "./types";

const insertText = (doc: Doc, at: number, text: string): Doc => {
  const { index, offset } = resolvePosition(doc, at);
  const nodes = [...doc.nodes];
  const target = nodes[index];

  if (target) {
    nodes[index] = {
      type: "text",
      text: target.text.slice(0, offset) + text + target.text.slice(offset),
    };
  } else {
    // Empty doc, or a position past the last node.
    nodes.push({ type: "text", text });
  }

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
    } else {
      const keptLeft = node.text.slice(0, Math.max(0, from - start));
      const keptRight = node.text.slice(Math.max(0, to - start));
      nodes.push({ type: "text", text: keptLeft + keptRight });
    }

    start = end;
  }

  return normalise({ nodes });
};

/**
 * Apply a step, returning the new doc alongside the step that undoes it.
 *
 * The inverse is computed here rather than by the caller because only this function has
 * the pre-application doc in hand — a delete cannot be inverted after the fact, since
 * the text it removed is gone.
 */
export const applyStep = (doc: Doc, step: Step): AppliedStep => {
  if (step.type === "insert") {
    const at = clampPosition(doc, step.at);
    return {
      doc: insertText(doc, at, step.text),
      inverse: { type: "delete", from: at, to: at + step.text.length },
    };
  }

  const from = clampPosition(doc, Math.min(step.from, step.to));
  const to = clampPosition(doc, Math.max(step.from, step.to));

  return {
    doc: deleteRange(doc, from, to),
    inverse: { type: "insert", at: from, text: textBetween(doc, from, to) },
  };
};
