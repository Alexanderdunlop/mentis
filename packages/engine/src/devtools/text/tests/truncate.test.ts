import { describe, expect, it } from "vitest";
import { truncate } from "../truncate";

describe("truncate", () => {
  it("leaves short strings untouched", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("appends the full length when truncating", () => {
    expect(truncate("abcdef", 3)).toBe("abc…(6)");
  });

  it("does not truncate at exactly the limit", () => {
    expect(truncate("abc", 3)).toBe("abc");
  });
});
