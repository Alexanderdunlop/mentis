import { nodeLength } from "./node-length";
import type { Doc } from "./types";

export const docLength = (doc: Doc): number =>
  doc.nodes.reduce((total, node) => total + nodeLength(node), 0);
