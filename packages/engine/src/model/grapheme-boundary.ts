/**
 * Where one *user-perceived character* ends and the next begins.
 *
 * A JavaScript string is a sequence of UTF-16 code units, and almost nothing a reader
 * would call "a character" is one of them. `"👍".length` is 2. `"👨‍👩‍👧".length` is 8.
 * `"é"` is 2 when it was typed as `e` plus a combining accent. Every offset in this
 * package is a code-unit offset — deliberately, so model positions and DOM offsets are
 * the same unit (docs/adr/0013-positions-stay-code-units.md) — which means the engine has
 * to know where it is *allowed* to cut.
 *
 * Four questions, and the difference between them is only whether `at` itself counts:
 *
 * | | answer |
 * |---|---|
 * | `snapBack` | greatest boundary **≤** `at` — repair an offset, staying put if valid |
 * | `snapForward` | least boundary **≥** `at` — the same, the other way |
 * | `stepBack` | greatest boundary **<** `at` — one character backwards |
 * | `stepForward` | least boundary **>** `at` — one character forwards |
 *
 * Which is why there are only two primitives below, each used twice with `at` or `at + 1`.
 */

/** Built once and lazily: `Intl.Segmenter` is expensive to construct and cheap to reuse. */
let segmenter: Intl.Segmenter | null = null;

/** Null where `Intl.Segmenter` is unavailable, which is the caller's cue to degrade. */
const segmentsOf = (text: string): Intl.Segments | null => {
  if (typeof Intl.Segmenter !== "function") return null;

  // No locale: grapheme segmentation is locale-independent in practice. The
  // locale-sensitive granularities are word and sentence, which this package never wants.
  segmenter ??= new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return segmenter.segment(text);
};

/**
 * Every boundary in `text`, ascending, always including 0 and `text.length`.
 *
 * Where `Intl.Segmenter` is missing this degrades to **code points** — `for…of` over a
 * string iterates those rather than code units, which is the whole trick. Strictly worse:
 * it still cuts a combining accent off its letter and still splits a ZWJ emoji into its
 * parts. But it never produces a lone surrogate, which is the failure that renders as `�`
 * and cannot be typed away, so it degrades honestly rather than silently.
 *
 * The whole string is segmented rather than a window around the offset. Clusters are
 * short, so a window would *nearly* always be right — and "nearly always" is how you ship
 * a bug that reproduces in one script only. These run once per fallback delete and once
 * per composition, never per keystroke, so there is nothing to optimise for.
 */
const boundaries = (text: string): number[] => {
  const found = [0];
  const segments = segmentsOf(text);

  if (segments) {
    for (const { index, segment } of segments) found.push(index + segment.length);
    return found;
  }

  let at = 0;
  for (const character of text) {
    at += character.length;
    found.push(at);
  }
  return found;
};

const clamp = (at: number, length: number): number =>
  Math.max(0, Math.min(at, length));

/** Greatest boundary strictly below `limit`. */
const lastBefore = (found: number[], limit: number): number => {
  let best = 0;
  for (const boundary of found) {
    if (boundary >= limit) break;
    best = boundary;
  }
  return best;
};

/** Least boundary at or above `limit`, or the end of the text when there is none. */
const firstFrom = (found: number[], limit: number): number =>
  found.find((boundary) => boundary >= limit) ?? found[found.length - 1] ?? 0;

/** Greatest boundary **≤** `at`. Returns `at` unchanged when it is already one. */
export const snapBack = (text: string, at: number): number =>
  lastBefore(boundaries(text), clamp(at, text.length) + 1);

/** Least boundary **≥** `at`. Returns `at` unchanged when it is already one. */
export const snapForward = (text: string, at: number): number =>
  firstFrom(boundaries(text), clamp(at, text.length));

/** Greatest boundary **<** `at` — one user-perceived character backwards. */
export const stepBack = (text: string, at: number): number =>
  lastBefore(boundaries(text), clamp(at, text.length));

/** Least boundary **>** `at` — one user-perceived character forwards. */
export const stepForward = (text: string, at: number): number =>
  firstFrom(boundaries(text), clamp(at, text.length) + 1);

/**
 * Is this text exactly one user-perceived character?
 *
 * Undo coalescing asks, because it groups typing runs. `text.length === 1` classifies a
 * typed emoji as "not typing" and hands it its own undo step, so `hi 👍` undoes in three
 * pieces rather than as the single run it looks like.
 *
 * Deliberately not `boundaries(text).length === 2`: this runs on every recorded edit, and
 * a large one — an autocorrect replacement, or a consumer dispatching a paste-sized user
 * insert — would segment the whole string only to learn "more than one". Reading the first
 * segment answers it outright.
 */
export const isSingleGrapheme = (text: string): boolean => {
  if (text === "") return false;

  const segments = segmentsOf(text);
  if (!segments) return [...text].length === 1;

  for (const { segment } of segments) return segment.length === text.length;
  return false;
};
