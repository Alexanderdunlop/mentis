import type { ModelRange } from "../model/types";

export interface InputIntent {
  /** `InputEvent.inputType`. */
  inputType: string;
  /** `event.data`, or the resolved clipboard/drop text — whichever applies. */
  text: string | null;
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
  docLength: number;
}
