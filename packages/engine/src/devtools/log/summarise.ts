import { charRangeOf } from "../selection/char-offset";
import { truncate } from "../text/truncate";
import { visibleWhitespace } from "../text/visible-whitespace";

export const modifierGlyphs = (event: KeyboardEvent): string =>
  [
    event.metaKey ? "⌘" : "",
    event.ctrlKey ? "⌃" : "",
    event.altKey ? "⌥" : "",
    event.shiftKey ? "⇧" : "",
  ].join("");

/** Quote a value with whitespace made visible, so `null` and `""` stay distinguishable. */
export const quoted = (value: string | null): string =>
  value === null ? "null" : `"${visibleWhitespace(value)}"`;

export const clipboardSummary = (data: DataTransfer | null): string => {
  if (!data) return "no dataTransfer";
  const types = Array.from(data.types);
  const plain = types.includes("text/plain")
    ? ` text/plain=${quoted(truncate(data.getData("text/plain"), 40))}`
    : "";
  return `${types.join(", ") || "no types"}${plain}`;
};

export const targetRangeSummary = (root: Element, event: InputEvent): string => {
  if (typeof event.getTargetRanges !== "function") return "";

  const ranges = event.getTargetRanges();
  if (ranges.length === 0) return " ranges:none";

  const rendered = ranges.map((range) => {
    const { start, end } = charRangeOf(root, range);
    return start === end ? `[${start}]` : `[${start},${end}]`;
  });
  return ` ranges:${rendered.join(",")}`;
};
