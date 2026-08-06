import { visibleWhitespace } from "../text/visible-whitespace";

export const CARET = "▮";
export const RANGE_START = "⟦";
export const RANGE_END = "⟧";

interface Boundary {
  node: Node;
  offset: number;
}

export interface SelectionMarkers {
  start: Boundary | null;
  end: Boundary | null;
  collapsed: boolean;
}

export const NO_MARKERS: SelectionMarkers = {
  start: null,
  end: null,
  collapsed: true,
};

/** The current selection, reduced to what the tree renderer needs. */
export const readMarkers = (root: Element): SelectionMarkers => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return NO_MARKERS;

  const range = selection.getRangeAt(0);
  const inside =
    root.contains(range.startContainer) || range.startContainer === root;
  if (!inside) return NO_MARKERS;

  return {
    start: { node: range.startContainer, offset: range.startOffset },
    end: { node: range.endContainer, offset: range.endOffset },
    collapsed: range.collapsed,
  };
};

/**
 * Splice selection glyphs into a text preview.
 *
 * Safe to do by offset because `visibleWhitespace` is 1:1 on characters, so raw
 * offsets still line up with the rendered string.
 */
export const previewWithMarkers = (
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
    const at = Math.max(0, Math.min(offset, preview.length));
    preview = `${preview.slice(0, at)}${glyph}${preview.slice(at)}`;
  }

  return { preview, marked: inserts.length > 0 };
};

/**
 * Glyphs for a boundary sitting *between* children rather than inside text — e.g. the
 * caret in an empty editor, which is `(div, 0)`.
 */
export const boundaryGlyphs = (
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
