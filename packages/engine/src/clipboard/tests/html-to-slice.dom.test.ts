import { describe, expect, it } from "vitest";
import { docText } from "../../model/doc-text";
import { atomNode, textNode } from "../../model/nodes";
import { htmlToSlice } from "../html-to-slice";

/**
 * The paste rules, exercised through a real parse.
 *
 * This is `dom-smoke` rather than `logic` because `DOMParser` is a DOM API, and the whole
 * point of ADR 0011 is that paste is a genuine parse rather than string surgery. Nothing
 * here touches caret semantics, which is the boundary happy-dom is trusted up to.
 */

const NBSP = "&nbsp;";

const text = (html: string): string => docText({ nodes: htmlToSlice(html) });

describe("htmlToSlice — text", () => {
  it("keeps the text and discards inline structure", () => {
    expect(htmlToSlice("<b>bold</b> and <i>italic</i>")).toEqual([
      textNode("bold and italic"),
    ]);
  });

  it("collapses the indentation real source HTML is full of", () => {
    expect(text("<p>\n    hello    there\n  </p>")).toBe("hello there");
  });

  it("converts a non-breaking space at the model boundary", () => {
    expect(text(`<span>hi${NBSP}there</span>`)).toBe("hi there");
  });

  it("keeps a deliberate nbsp run as two spaces", () => {
    expect(text(`<span>a${NBSP}${NBSP}b</span>`)).toBe("a  b");
  });

  it("decodes entities, because the parser does it for us", () => {
    expect(text("<span>a &amp; b &lt;c&gt;</span>")).toBe("a & b <c>");
  });
});

describe("htmlToSlice — structure", () => {
  it("turns a <br> into one newline", () => {
    expect(text("one<br>two")).toBe("one\ntwo");
  });

  it("puts a newline between blocks and none around the outside", () => {
    expect(text("<div>one</div><div>two</div>")).toBe("one\ntwo");
  });

  it("does not stack blank lines up for nested blocks", () => {
    expect(text("<div><p>one</p></div><div><p>two</p></div>")).toBe("one\ntwo");
  });

  it("gives each list item and table cell its own line", () => {
    expect(text("<ul><li>a</li><li>b</li></ul>")).toBe("a\nb");
    expect(text("<table><tr><td>a</td><td>b</td></tr></table>")).toBe("a\nb");
  });

  it("keeps every explicit <br>, since each one was typed on purpose", () => {
    // Block boundaries are inferred and so deduplicated against each other; a `<br>` is
    // not, which is what makes a blank line survive.
    expect(text("<p>one<br><br>two</p>")).toBe("one\n\ntwo");
  });

  it("does not let a leading <br> swallow the block edge in front of it", () => {
    // Two breaks: the boundary between the divs, and the `<br>` opening the second.
    expect(text("<div>a</div><div><br>b</div>")).toBe("a\n\nb");
  });

  it("does not double a trailing <br> up with the block edge after it", () => {
    expect(text("<p>one<br></p><p>two</p>")).toBe("one\ntwo");
  });
});

describe("htmlToSlice — what does not come through", () => {
  it("drops script and style content entirely, text and all", () => {
    expect(text("<style>p{color:red}</style><p>hi</p><script>x=1</script>")).toBe(
      "hi"
    );
  });

  it("keeps the text of an element it has never heard of", () => {
    expect(text("<o:p><custom-thing>hi</custom-thing></o:p>")).toBe("hi");
  });

  it("survives the wrapper browsers add around a copied fragment", () => {
    expect(
      text("<html><body><!--StartFragment--><p>hi</p><!--EndFragment--></body></html>")
    ).toBe("hi");
  });

  it("yields nothing for markup with no text in it", () => {
    expect(htmlToSlice("<div></div>")).toEqual([]);
    expect(htmlToSlice("")).toEqual([]);
  });
});

describe("htmlToSlice — mentions", () => {
  it("recovers a mention as an atom, with its value", () => {
    expect(
      htmlToSlice('hi <span data-mention-value="u_1">@Alice</span>!')
    ).toEqual([textNode("hi "), atomNode("@Alice", "u_1"), textNode("!")]);
  });

  it("keeps two mentions that share a label distinct", () => {
    // The thing v1 cannot do, and the reason the value travels on the clipboard at all.
    const slice = htmlToSlice(
      '<span data-mention-value="u_1">@Alex</span>' +
        '<span data-mention-value="u_2">@Alex</span>'
    );
    expect(slice).toEqual([atomNode("@Alex", "u_1"), atomNode("@Alex", "u_2")]);
  });

  it("does not descend into a chip and duplicate its label", () => {
    expect(
      htmlToSlice('<span data-mention-value="u_1"><b>@Alice</b></span>')
    ).toEqual([atomNode("@Alice", "u_1")]);
  });
});

describe("htmlToSlice — whitespace-significant sources", () => {
  it("keeps the indentation of pasted code", () => {
    expect(text("<pre>if (x) {\n    go();\n}</pre>")).toBe("if (x) {\n    go();\n}");
  });

  it("honours an inline white-space declaration", () => {
    expect(text('<span style="white-space:pre-wrap;">a    b</span>')).toBe("a    b");
  });

  it("still collapses under pre-line, which only preserves newlines", () => {
    expect(text('<span style="white-space:pre-line">a    b</span>')).toBe("a b");
  });
});
