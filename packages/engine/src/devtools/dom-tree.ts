import { escapeHtml, visibleWhitespace } from "./format";

interface Boundary {
  node: Node;
  offset: number;
}

interface SelectionMarkers {
  start: Boundary | null;
  end: Boundary | null;
  collapsed: boolean;
}

const CARET = "▮";
const RANGE_START = "⟦";
const RANGE_END = "⟧";

const indent = (depth: number): string => "  ".repeat(depth);

const attrsOf = (element: Element): string => {
  const interesting = Array.from(element.attributes).filter(
    (attr) =>
      attr.name === "class" ||
      attr.name === "contenteditable" ||
      attr.name.startsWith("data-")
  );
  if (interesting.length === 0) return "";
  return interesting.map((attr) => ` ${attr.name}="${attr.value}"`).join("");
};

/**
 * Splice selection glyphs into a text preview.
 *
 * Safe to do by offset because `visibleWhitespace` is 1:1 on characters, so raw
 * offsets still line up with the rendered string.
 */
const withMarkers = (
  text: Text,
  markers: SelectionMarkers
): { preview: string; marked: boolean } => {
  const inserts: { offset: number; glyph: string }[] = [];

  if (markers.start?.node === text) {
    inserts.push({
      offset: markers.start.offset,
      glyph: markers.collapsed ? CARET : RANGE_START,
    });
  }
  if (!markers.collapsed && markers.end?.node === text) {
    inserts.push({ offset: markers.end.offset, glyph: RANGE_END });
  }

  let preview = visibleWhitespace(text.data);
  // Descending, so earlier splices don't shift later offsets.
  for (const { offset, glyph } of inserts.sort((a, b) => b.offset - a.offset)) {
    const clamped = Math.max(0, Math.min(offset, preview.length));
    preview = `${preview.slice(0, clamped)}${glyph}${preview.slice(clamped)}`;
  }

  return { preview, marked: inserts.length > 0 };
};

/** A boundary sitting *between* children, e.g. the caret in an empty editor: `(div, 0)`. */
const elementBoundaryGlyphs = (
  parent: Node,
  childIndex: number,
  markers: SelectionMarkers
): string[] => {
  const glyphs: string[] = [];
  if (markers.start?.node === parent && markers.start.offset === childIndex) {
    glyphs.push(markers.collapsed ? CARET : RANGE_START);
  }
  if (
    !markers.collapsed &&
    markers.end?.node === parent &&
    markers.end.offset === childIndex
  ) {
    glyphs.push(RANGE_END);
  }
  return glyphs;
};

const renderNode = (
  node: Node,
  depth: number,
  markers: SelectionMarkers,
  lines: string[]
): void => {
  const pad = indent(depth);

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node as Text;
    const { preview, marked } = withMarkers(text, markers);
    const empty = text.data.length === 0;
    lines.push(
      `${pad}<span class="t-key">#text</span> ` +
        `<span class="${marked ? "t-str t-sel" : "t-str"}">"${escapeHtml(preview)}"</span> ` +
        `<span class="${empty ? "t-warn" : "t-dim"}">(${text.data.length}${empty ? " EMPTY" : ""})</span>`
    );
    return;
  }

  if (node.nodeName === "BR") {
    // Called out loudly: the trailing <br> browsers require in an empty block is a
    // reliable source of off-by-one bugs.
    lines.push(`${pad}<span class="t-br">&lt;br&gt;</span>`);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    lines.push(`${pad}<span class="t-dim">${escapeHtml(node.nodeName)}</span>`);
    return;
  }

  const element = node as Element;
  const tag = element.nodeName.toLowerCase();
  const atomic = element.getAttribute("contenteditable") === "false";
  lines.push(
    `${pad}<span class="${atomic ? "t-atomic" : "t-tag"}">&lt;${tag}${escapeHtml(attrsOf(element))}&gt;</span>`
  );

  renderChildren(element, depth + 1, markers, lines);

  lines.push(`${pad}<span class="t-tag">&lt;/${tag}&gt;</span>`);
};

const renderChildren = (
  parent: Element,
  depth: number,
  markers: SelectionMarkers,
  lines: string[]
): void => {
  const children = Array.from(parent.childNodes);
  const pad = indent(depth);

  children.forEach((child, index) => {
    for (const glyph of elementBoundaryGlyphs(parent, index, markers)) {
      lines.push(`${pad}<span class="t-sel">${glyph} boundary (${index})</span>`);
    }
    renderNode(child, depth, markers, lines);
  });

  for (const glyph of elementBoundaryGlyphs(parent, children.length, markers)) {
    lines.push(
      `${pad}<span class="t-sel">${glyph} boundary (${children.length}${children.length === 0 ? " — empty" : " — end"})</span>`
    );
  }
};

export const renderDomTree = (root: Element): string => {
  const selection = window.getSelection();
  const markers: SelectionMarkers = { start: null, end: null, collapsed: true };

  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const inside =
      root.contains(range.startContainer) || range.startContainer === root;
    if (inside) {
      markers.start = {
        node: range.startContainer,
        offset: range.startOffset,
      };
      markers.end = { node: range.endContainer, offset: range.endOffset };
      markers.collapsed = range.collapsed;
    }
  }

  const lines: string[] = [
    `<span class="t-tag">&lt;${root.nodeName.toLowerCase()}${escapeHtml(attrsOf(root))}&gt;</span>`,
  ];
  renderChildren(root, 1, markers, lines);
  lines.push(`<span class="t-tag">&lt;/${root.nodeName.toLowerCase()}&gt;</span>`);

  return lines.join("\n");
};
