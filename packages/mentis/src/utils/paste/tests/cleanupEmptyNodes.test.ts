import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { cleanupEmptyNodes } from "../cleanupEmptyNodes";

describe("cleanupEmptyNodes", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should remove empty div elements", () => {
    container.innerHTML = `
      <div>Hello</div>
      <div></div>
      <div>World</div>
      <div>  </div>
    `;

    cleanupEmptyNodes(container);

    expect(container.children).toHaveLength(2);
    expect(container.children[0].textContent).toBe("Hello");
    expect(container.children[1].textContent).toBe("World");
  });

  it("should not remove void elements even if empty", () => {
    container.innerHTML = `
      <div>Hello</div>
      <br>
      <img src="test.jpg">
      <hr>
      <input type="text">
      <div>World</div>
    `;

    cleanupEmptyNodes(container);

    expect(container.querySelector("br")).toBeTruthy();
    expect(container.querySelector("img")).toBeTruthy();
    expect(container.querySelector("hr")).toBeTruthy();
    expect(container.querySelector("input")).toBeTruthy();
  });

  it("should remove nested empty elements", () => {
    const div = document.createElement("div");
    const span1 = document.createElement("span");
    span1.textContent = "Hello";
    const span2 = document.createElement("span");
    const span3 = document.createElement("span");
    span3.textContent = "World";

    div.appendChild(span1);
    div.appendChild(span2);
    div.appendChild(span3);
    container.appendChild(div);

    // Call cleanupEmptyNodes on the div that contains the spans
    cleanupEmptyNodes(div);

    expect(div.children).toHaveLength(2);
    expect(div.children[0].textContent).toBe("Hello");
    expect(div.children[1].textContent).toBe("World");
  });
});
