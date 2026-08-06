import { escapeHtml } from "../text/escape-html";
import type { LogEntry } from "./types";

export const renderRow = (entry: LogEntry): HTMLElement => {
  const row = document.createElement("div");
  row.className = `log-row log-${entry.category}`;
  row.innerHTML =
    `<span class="log-seq">${entry.seq}</span>` +
    `<span class="log-time">+${entry.t}</span>` +
    `<span class="log-type">${escapeHtml(entry.type)}</span>` +
    `<span class="log-summary">${escapeHtml(entry.summary)}</span>`;
  return row;
};
