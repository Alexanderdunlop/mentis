/**
 * The seam the model plugs into at M1.
 *
 * M0 deliberately has no model — the editor is a bare contenteditable, and the point
 * of this milestone is to watch what the browser does to it unaided. The slot exists
 * now so that M1 is a one-line wiring change rather than a panel rewrite.
 */
export interface ModelProbe {
  /** Shown in the panel header. */
  label: string;
  /** Anything JSON-serialisable; rendered pretty-printed. */
  getState: () => unknown;
  /** Model offset for a DOM boundary, once there is a model to ask. */
  domToModel?: (node: Node, offset: number) => number | null;
}

export const nullModelProbe: ModelProbe = {
  label: "no model — arrives in M1",
  getState: () => null,
};
