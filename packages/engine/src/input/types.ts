import type { Doc, ModelRange, Slice } from "../model/types";

export interface InputIntent {
  /** `InputEvent.inputType`. */
  inputType: string;
  /** `event.data`, or the resolved clipboard/drop text — whichever applies. */
  text: string | null;
  /**
   * What a paste or a drop is inserting, parsed from its `dataTransfer`.
   *
   * A slice rather than a string, because that is the only shape that can carry a
   * mention's `value` — pasting a chip back as `text` would degrade it to its label, the
   * exact round-trip loss ADR 0005 flagged as M5's job to prevent. Null for every other
   * `inputType`, and for a transfer holding nothing usable.
   */
  slice?: Slice | null;
  /**
   * The range the edit applies to, in model coordinates.
   *
   * Taken from `InputEvent.getTargetRanges()` where the browser supplies it, because the
   * browser has already worked out the right range for grapheme clusters, word deletes
   * and autocorrect replacements. Falling back to the current selection is a fallback,
   * not the intent.
   */
  range: ModelRange;
  /** Whether `range` came from the browser rather than from our own selection read. */
  rangeFromBrowser: boolean;
  /**
   * The document the edit applies to.
   *
   * The whole document rather than just its length, because the fallback delete cannot be
   * decided without it: "one character backwards" is one position for an atom and two for
   * `👍`, and only the text can say which. This stays pure — a `Doc` is plain data — so
   * `transactionFor` remains a function of its argument with no DOM and no engine state.
   */
  doc: Doc;
}
