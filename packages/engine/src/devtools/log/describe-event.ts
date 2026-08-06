import { truncate } from "../text/truncate";
import {
  clipboardSummary,
  modifierGlyphs,
  quoted,
  targetRangeSummary,
} from "./summarise";
import type { EventDescription } from "./types";

/**
 * One function per event kind, each turning an event into a loggable description.
 *
 * Kept separate from the log's listener wiring so the interesting part — what actually
 * gets reported — is readable and testable without attaching to a live editor.
 */

export const describeKeydown = (event: KeyboardEvent): EventDescription => ({
  category: "key",
  summary: `${modifierGlyphs(event)}${event.key}${event.isComposing ? " (composing)" : ""}`,
  detail: {
    key: event.key,
    code: event.code,
    ctrl: event.ctrlKey,
    meta: event.metaKey,
    shift: event.shiftKey,
    alt: event.altKey,
    isComposing: event.isComposing,
    isTrusted: event.isTrusted,
  },
});

export const describeBeforeInput = (
  event: InputEvent,
  root: Element
): EventDescription => {
  const textBefore = root.textContent ?? "";
  return {
    category: "input",
    summary:
      `${event.inputType} data=${quoted(event.data)}` +
      targetRangeSummary(root, event) +
      (event.isComposing ? " composing" : "") +
      // Set by the harness's capture-phase listener when "intercept all" is on.
      (event.defaultPrevented ? " PREVENTED" : ""),
    detail: {
      inputType: event.inputType,
      data: event.data,
      isComposing: event.isComposing,
      defaultPrevented: event.defaultPrevented,
      dataTransfer: event.dataTransfer
        ? clipboardSummary(event.dataTransfer)
        : null,
      textBefore,
    },
  };
};

export const describeInput = (
  event: InputEvent,
  root: Element,
  textBefore: string | null
): EventDescription => {
  const textAfter = root.textContent ?? "";
  const changed = textBefore !== null && textBefore !== textAfter;
  return {
    category: "input",
    summary:
      `${event.inputType} → ${quoted(truncate(textAfter, 48))}` +
      (changed ? "" : " (no text change)"),
    detail: {
      inputType: event.inputType,
      data: event.data,
      textBefore,
      textAfter,
    },
  };
};

export const describeComposition = (
  event: CompositionEvent,
  root: Element
): EventDescription => ({
  category: "composition",
  summary: `data=${quoted(event.data)}`,
  detail: { data: event.data, textContent: root.textContent },
});

export const describeClipboard = (event: ClipboardEvent): EventDescription => ({
  category: "clipboard",
  summary: clipboardSummary(event.clipboardData),
  detail: {
    types: event.clipboardData ? Array.from(event.clipboardData.types) : [],
    plain: event.clipboardData?.getData("text/plain") ?? null,
    html: event.clipboardData?.getData("text/html") ?? null,
  },
});

export const describeFocus = (): EventDescription => ({
  category: "focus",
  summary: "",
  detail: {},
});

export const describeSelectionChange = (): EventDescription => {
  const selection = window.getSelection();
  return {
    category: "selection",
    summary: selection ? "" : "no selection",
    detail: {
      isCollapsed: selection?.isCollapsed ?? null,
      anchorOffset: selection?.anchorOffset ?? null,
      focusOffset: selection?.focusOffset ?? null,
    },
  };
};
