import { escapeHtml } from "../../text/escape-html";
import { isAtomic, renderableAttrs } from "./attrs";
import {
  boundaryGlyphs,
  previewWithMarkers,
  readMarkers,
  type SelectionMarkers,
} from "./markers";

const indent = (depth: number): string => "  ".repeat(depth);

const span = (className: string, content: string): string =>
  `<span class="${className}">${content}</span>`;

const renderText = (text: Text, markers: SelectionMarkers): string => {
  const { preview, marked } = previewWithMarkers(text, markers);
  const empty = text.data.length === 0;
  return [
    span("t-key", "#text"),
    span(marked ? "t-str t-sel" : "t-str", `"${escapeHtml(preview)}"`),
    span(empty ? "t-warn" : "t-dim", `(${text.data.length}${empty ? " EMPTY" : ""})`),
  ].join(" ");
};

const renderNode = (
  node: Node,
  depth: number,
  markers: SelectionMarkers,
  lines: string[]
): void => {
  const pad = indent(depth);

  if (node.nodeType === Node.TEXT_NODE) {
    lines.push(pad + renderText(node as Text, markers));
    return;
  }

  // Called out loudly: the trailing <br> browsers require in an empty block is a
  // reliable source of off-by-one bugs.
  if (node.nodeName === "BR") {
    lines.push(pad + span("t-br", "&lt;br&gt;"));
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    lines.push(pad + span("t-dim", escapeHtml(node.nodeName)));
    return;
  }

  const element = node as Element;
  const tag = element.nodeName.toLowerCase();
  const open = `&lt;${tag}${escapeHtml(renderableAttrs(element))}&gt;`;

  lines.push(pad + span(isAtomic(element) ? "t-atomic" : "t-tag", open));
  renderChildren(element, depth + 1, markers, lines);
  lines.push(pad + span("t-tag", `&lt;/${tag}&gt;`));
};

const renderChildren = (
  parent: Element,
  depth: number,
  markers: SelectionMarkers,
  lines: string[]
): void => {
  const children = Array.from(parent.childNodes);
  const pad = indent(depth);

  const pushBoundaries = (index: number, label: string): void => {
    for (const glyph of boundaryGlyphs(parent, index, markers)) {
      lines.push(pad + span("t-sel", `${glyph} boundary (${label})`));
    }
  };

  children.forEach((child, index) => {
    pushBoundaries(index, String(index));
    renderNode(child, depth, markers, lines);
  });

  pushBoundaries(
    children.length,
    children.length === 0
      ? `${children.length} — empty`
      : `${children.length} — end`
  );
};

/** The editor's DOM as indented HTML lines, with the selection marked in place. */
export const renderDomTree = (root: Element): string => {
  const markers = readMarkers(root);
  const tag = root.nodeName.toLowerCase();
  const lines = [
    span("t-tag", `&lt;${tag}${escapeHtml(renderableAttrs(root))}&gt;`),
  ];

  renderChildren(root, 1, markers, lines);
  lines.push(span("t-tag", `&lt;/${tag}&gt;`));

  return lines.join("\n");
};
