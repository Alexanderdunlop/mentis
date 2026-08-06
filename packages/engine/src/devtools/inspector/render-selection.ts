import type { SelectionSnapshot } from "../selection/types";
import { kvRow } from "./panel";

const spanLabel = (snapshot: SelectionSnapshot): string =>
  snapshot.charStart === snapshot.charEnd
    ? `${snapshot.charStart}`
    : `${snapshot.charStart}–${snapshot.charEnd} (${snapshot.charEnd - snapshot.charStart} selected)`;

interface Options {
  modelOffset?: number | null;
  showModelOffset?: boolean;
}

export const renderSelection = (
  snapshot: SelectionSnapshot,
  { modelOffset = null, showModelOffset = false }: Options = {}
): string => {
  if (!snapshot.exists) return kvRow("selection", "none");
  if (!snapshot.insideEditor) return kvRow("selection", "outside editor", true);

  return [
    kvRow("char offset", spanLabel(snapshot), snapshot.charStart < 0),
    kvRow("collapsed", String(snapshot.isCollapsed)),
    kvRow("editor length", String(snapshot.editorLength)),
    kvRow(
      "anchor",
      snapshot.anchor ? `${snapshot.anchor.path} @ ${snapshot.anchor.offset}` : "—"
    ),
    kvRow(
      "focus",
      snapshot.focus ? `${snapshot.focus.path} @ ${snapshot.focus.offset}` : "—"
    ),
    showModelOffset
      ? kvRow(
          "model offset",
          modelOffset === null ? "unmappable" : String(modelOffset),
          modelOffset === null
        )
      : "",
  ].join("");
};
