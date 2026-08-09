import { describe, expect, it } from "vitest";
import { atomNode, textNode } from "../../model/nodes";
import { sliceLength, sliceText } from "../../model/slice-between";
import type { Slice } from "../../model/types";
import { htmlToSlice } from "../html-to-slice";
import { serialiseSlice } from "../serialise-slice";

/**
 * The milestone's "done when": copy a selection containing a mention, paste it back, and
 * get the mention — with its `value` — rather than its label as plain text.
 *
 * Serialise then parse is the whole round trip minus the operating system, which is the
 * most of it that can be checked without a real browser and a real clipboard. What this
 * cannot show is whether an engine hands back the `text/html` it was given; that is
 * stated as unverified in ADR 0010 and is on the by-hand list.
 */
const roundTrip = (slice: Slice): Slice => htmlToSlice(serialiseSlice(slice).html);

describe("copy → paste, within this editor", () => {
  it("brings a mention back as a mention, not as its label", () => {
    const slice = [textNode("hi "), atomNode("@Alice", "u_1"), textNode("!")];
    expect(roundTrip(slice)).toEqual(slice);
  });

  it("keeps two mentions with the same label distinct", () => {
    const slice = [atomNode("@Alex", "u_1"), textNode(" and "), atomNode("@Alex", "u_2")];
    expect(roundTrip(slice)).toEqual(slice);
  });

  it("preserves position space, so the caret lands where it should", () => {
    // Four positions, eleven characters. A round trip that quietly turned the atom into
    // its label would keep the text identical and change the length — ADR 0005.
    const slice = [textNode("hi "), atomNode("@Alice", "u_1")];
    expect(sliceLength(roundTrip(slice))).toBe(4);
    expect(sliceText(roundTrip(slice))).toBe("hi @Alice");
  });

  it("keeps deliberate runs of spaces, which the pre-wrap wrapper is there for", () => {
    const slice = [textNode("a    b")];
    expect(roundTrip(slice)).toEqual(slice);
  });

  it("keeps leading and trailing spaces in the selection", () => {
    // The tidy pass would have trimmed these; declaring the whitespace significant is
    // what tells the parser this fragment meant them.
    const slice = [textNode("  hi  ")];
    expect(roundTrip(slice)).toEqual(slice);
  });

  it("survives newlines", () => {
    const slice = [textNode("one\ntwo\n\nthree")];
    expect(roundTrip(slice)).toEqual(slice);
  });

  it("survives a label made entirely of markup", () => {
    const slice = [atomNode('<b>@A "quoted" & odd</b>', "u_1")];
    expect(roundTrip(slice)).toEqual(slice);
  });

  it("survives a value containing an ampersand and a quote", () => {
    // Deliberately not `<` or `>`: happy-dom decodes `&amp;` and `&quot;` in an attribute
    // value but leaves `&lt;`/`&gt;` encoded, where a real browser decodes all four. The
    // serialiser escapes all of them (see serialise-slice.test.ts); what a real parser
    // does with them is on the by-hand list, not assertable here.
    // → docs/notes/contenteditable-traps.md
    const slice = [atomNode("@Alice", 'v&1"2')];
    expect(roundTrip(slice)).toEqual(slice);
  });

  it("survives the wrapper a browser adds around the fragment", () => {
    const slice = [textNode("hi "), atomNode("@Alice", "u_1")];
    const wrapped =
      "<html><body><!--StartFragment-->" +
      serialiseSlice(slice).html +
      "<!--EndFragment--></body></html>";
    expect(htmlToSlice(wrapped)).toEqual(slice);
  });
});
