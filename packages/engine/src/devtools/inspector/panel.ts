import { escapeHtml } from "../text/escape-html";

export interface Panel {
  root: HTMLElement;
  body: HTMLElement;
}

export const createPanel = (title: string, legend = ""): Panel => {
  const root = document.createElement("section");
  root.className = "panel";
  root.innerHTML =
    `<header class="panel-head"><span>${escapeHtml(title)}</span>` +
    `<span class="panel-extra">${legend}</span></header>` +
    `<div class="panel-body"></div>`;

  return { root, body: root.querySelector<HTMLElement>(".panel-body")! };
};

/** A labelled value row, as used by the Selection panel. */
export const kvRow = (label: string, value: string, warn = false): string =>
  `<div class="kv"><span class="kv-k">${escapeHtml(label)}</span>` +
  `<span class="kv-v${warn ? " kv-warn" : ""}">${escapeHtml(value)}</span></div>`;

export const preBody = (panel: Panel): HTMLPreElement => {
  const pre = document.createElement("pre");
  pre.className = "tree";
  panel.body.appendChild(pre);
  return pre;
};
