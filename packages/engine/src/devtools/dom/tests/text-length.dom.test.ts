import { beforeEach, describe, expect, it } from "vitest";
import { textLength } from "../text-length";

let editor: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = "";
  editor = document.createElement("div");
  document.body.appendChild(editor);
});

describe("textLength", () => {
  it("counts text characters", () => {
    editor.innerHTML = "hello";
    expect(textLength(editor)).toBe(5);
  });

  it("counts a br as one newline, unlike Range.toString()", () => {
    editor.innerHTML = "one<br>two";
    expect(textLength(editor)).toBe(7);
  });

  it("counts a trailing br", () => {
    editor.innerHTML = "one<br>";
    expect(textLength(editor)).toBe(4);
  });

  it("descends into nested elements", () => {
    editor.innerHTML = 'a<span class="chip">bc</span>d';
    expect(textLength(editor)).toBe(4);
  });

  it("counts a text node passed directly", () => {
    expect(textLength(document.createTextNode("abcd"))).toBe(4);
  });

  it("is zero for an empty editor", () => {
    editor.innerHTML = "";
    expect(textLength(editor)).toBe(0);
  });
});
