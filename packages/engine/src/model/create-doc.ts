import { normalise } from "./normalise";
import type { Doc } from "./types";

export const emptyDoc = (): Doc => ({ nodes: [] });

/** An empty string yields a doc with no nodes, not one empty node — see `normalise`. */
export const createDoc = (text = ""): Doc =>
  normalise({ nodes: [{ type: "text", text }] });
