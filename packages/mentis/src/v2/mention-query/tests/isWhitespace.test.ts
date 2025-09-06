import { describe, it, expect } from "vitest";
import { isWhitespace } from "../isWhitespace";

describe("isWhitespace", () => {
  it("should return true for space character", () => {
    expect(isWhitespace(" ")).toBe(true);
  });

  it("should return true for newline character", () => {
    expect(isWhitespace("\n")).toBe(true);
  });

  it("should return true for tab character", () => {
    expect(isWhitespace("\t")).toBe(true);
  });

  it("should return false for regular letters", () => {
    expect(isWhitespace("a")).toBe(false);
    expect(isWhitespace("z")).toBe(false);
    expect(isWhitespace("A")).toBe(false);
    expect(isWhitespace("Z")).toBe(false);
  });

  it("should return false for numbers", () => {
    expect(isWhitespace("0")).toBe(false);
    expect(isWhitespace("9")).toBe(false);
    expect(isWhitespace("5")).toBe(false);
  });

  it("should return false for special characters", () => {
    expect(isWhitespace("@")).toBe(false);
    expect(isWhitespace("#")).toBe(false);
    expect(isWhitespace("!")).toBe(false);
    expect(isWhitespace("?")).toBe(false);
    expect(isWhitespace(".")).toBe(false);
    expect(isWhitespace(",")).toBe(false);
    expect(isWhitespace(";")).toBe(false);
    expect(isWhitespace(":")).toBe(false);
  });

  it("should return false for punctuation", () => {
    expect(isWhitespace("(")).toBe(false);
    expect(isWhitespace(")")).toBe(false);
    expect(isWhitespace("[")).toBe(false);
    expect(isWhitespace("]")).toBe(false);
    expect(isWhitespace("{")).toBe(false);
    expect(isWhitespace("}")).toBe(false);
  });

  it("should return false for symbols", () => {
    expect(isWhitespace("+")).toBe(false);
    expect(isWhitespace("-")).toBe(false);
    expect(isWhitespace("*")).toBe(false);
    expect(isWhitespace("/")).toBe(false);
    expect(isWhitespace("=")).toBe(false);
    expect(isWhitespace("&")).toBe(false);
    expect(isWhitespace("%")).toBe(false);
    expect(isWhitespace("$")).toBe(false);
  });

  it("should return false for underscore and hyphen", () => {
    expect(isWhitespace("_")).toBe(false);
    expect(isWhitespace("-")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isWhitespace("")).toBe(false);
  });

  it("should return false for multi-character strings", () => {
    expect(isWhitespace("  ")).toBe(false);
    expect(isWhitespace("\n\n")).toBe(false);
    expect(isWhitespace("\t\t")).toBe(false);
    expect(isWhitespace("ab")).toBe(false);
    expect(isWhitespace("a ")).toBe(false);
  });

  it("should return false for other whitespace-like characters", () => {
    expect(isWhitespace("\r")).toBe(false);
    expect(isWhitespace("\f")).toBe(false);
    expect(isWhitespace("\v")).toBe(false);
  });

  it("should return false for unicode characters", () => {
    expect(isWhitespace("ñ")).toBe(false);
    expect(isWhitespace("é")).toBe(false);
    expect(isWhitespace("中")).toBe(false);
    expect(isWhitespace("🚀")).toBe(false);
  });
});
