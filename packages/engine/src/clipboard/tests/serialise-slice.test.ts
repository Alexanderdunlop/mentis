import { describe, expect, it } from "vitest";
import { atomNode, textNode } from "../../model/nodes";
import { serialiseSlice } from "../serialise-slice";

describe("serialiseSlice — text/plain", () => {
  it("shows a mention as its label, which is all another app can use", () => {
    const { text } = serialiseSlice([
      textNode("hi "),
      atomNode("@Alice", "u_1"),
      textNode("!"),
    ]);
    expect(text).toBe("hi @Alice!");
  });
});

describe("serialiseSlice — text/html", () => {
  it("carries the value, not just the label", () => {
    const { html } = serialiseSlice([atomNode("@Alice", "u_1")]);
    expect(html).toContain('data-mention-value="u_1"');
    expect(html).toContain(">@Alice</span>");
  });

  it("declares its whitespace significant, so runs of spaces survive", () => {
    const { html } = serialiseSlice([textNode("a    b")]);
    expect(html).toContain("white-space:pre-wrap");
    expect(html).toContain("a    b");
  });

  it("writes a newline as <br>, the one break every application understands", () => {
    // ADR 0002 governs the engine's own DOM, where `pre-wrap` is guaranteed because
    // `createEditor` sets it. The clipboard is read by applications that guarantee nothing.
    const { html } = serialiseSlice([textNode("one\ntwo")]);
    expect(html).toContain("one<br>two");
  });

  it("escapes text and attributes so markup cannot be smuggled through", () => {
    const { html } = serialiseSlice([
      textNode("<script>alert(1)</script>"),
      atomNode('a "quoted" & <angled> label', 'v"1'),
    ]);
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain('data-mention-value="v&quot;1"');
    expect(html).toContain("a &quot;quoted&quot; &amp; &lt;angled&gt; label");
    expect(html).not.toContain("<script>");
  });
});
