import { renderDomTree } from "./dom-tree";
import { createEventLog, type EventLog } from "./event-log";
import { escapeHtml } from "./format";
import { nullModelProbe, type ModelProbe } from "./model-probe";
import { readSelection } from "./selection-probe";

export type { EventLog, LogEntry } from "./event-log";
export type { ModelProbe } from "./model-probe";
export type { ReplayStep, Modifiers } from "./replay";
export {
  parseScript,
  runScript,
  runScriptSource,
  ReplayParseError,
} from "./replay";
export { SCENARIOS } from "./scenarios";

interface CreateInspectorOptions {
  editor: HTMLElement;
  /** Container the inspector fills with its panels. */
  mount: HTMLElement;
  modelProbe?: ModelProbe;
}

export interface Inspector {
  log: EventLog;
  refresh: () => void;
  destroy: () => void;
}

const panel = (title: string, extra = ""): HTMLElement => {
  const section = document.createElement("section");
  section.className = "panel";
  section.innerHTML =
    `<header class="panel-head"><span>${escapeHtml(title)}</span>` +
    `<span class="panel-extra">${extra}</span></header>` +
    `<div class="panel-body"></div>`;
  return section;
};

const bodyOf = (section: HTMLElement): HTMLElement =>
  section.querySelector<HTMLElement>(".panel-body")!;

const row = (label: string, value: string, warn = false): string =>
  `<div class="kv"><span class="kv-k">${escapeHtml(label)}</span>` +
  `<span class="kv-v${warn ? " kv-warn" : ""}">${escapeHtml(value)}</span></div>`;

export const createInspector = ({
  editor,
  mount,
  modelProbe = nullModelProbe,
}: CreateInspectorOptions): Inspector => {
  const selectionPanel = panel("Selection");
  const treePanel = panel("DOM", '<span class="legend">▮ caret · ⟦⟧ range · · space · ⍽ nbsp · ⏎ newline</span>');
  const modelPanel = panel("Model", `<span class="legend">${escapeHtml(modelProbe.label)}</span>`);
  const logPanel = panel(
    "Events",
    '<span class="legend">beforeinput · input · composition · clipboard</span>'
  );

  mount.append(selectionPanel, treePanel, modelPanel, logPanel);

  const treePre = document.createElement("pre");
  treePre.className = "tree";
  bodyOf(treePanel).appendChild(treePre);

  const modelPre = document.createElement("pre");
  modelPre.className = "tree";
  bodyOf(modelPanel).appendChild(modelPre);

  const logBody = bodyOf(logPanel);
  logBody.classList.add("log-body");

  const renderSelection = (): void => {
    const snapshot = readSelection(editor);

    if (!snapshot.exists) {
      bodyOf(selectionPanel).innerHTML = row("selection", "none");
      return;
    }
    if (!snapshot.insideEditor) {
      bodyOf(selectionPanel).innerHTML = row("selection", "outside editor", true);
      return;
    }

    const span =
      snapshot.charStart === snapshot.charEnd
        ? `${snapshot.charStart}`
        : `${snapshot.charStart}–${snapshot.charEnd} (${snapshot.charEnd - snapshot.charStart} selected)`;

    const modelOffset = modelProbe.domToModel && snapshot.anchor
      ? modelProbe.domToModel(
          window.getSelection()!.anchorNode!,
          window.getSelection()!.anchorOffset
        )
      : null;

    bodyOf(selectionPanel).innerHTML = [
      row("char offset", span, snapshot.charStart < 0),
      row("collapsed", String(snapshot.isCollapsed)),
      row("editor length", String(snapshot.editorLength)),
      row(
        "anchor",
        snapshot.anchor
          ? `${snapshot.anchor.path} @ ${snapshot.anchor.offset}`
          : "—"
      ),
      row(
        "focus",
        snapshot.focus ? `${snapshot.focus.path} @ ${snapshot.focus.offset}` : "—"
      ),
      modelProbe.domToModel
        ? row("model offset", modelOffset === null ? "unmappable" : String(modelOffset), modelOffset === null)
        : "",
    ].join("");
  };

  const renderTree = (): void => {
    treePre.innerHTML = renderDomTree(editor);
  };

  const renderModel = (): void => {
    const state = modelProbe.getState();
    modelPre.textContent =
      state === null ? `— ${modelProbe.label} —` : JSON.stringify(state, null, 2);
  };

  let queued = false;
  const refresh = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      renderSelection();
      renderTree();
      renderModel();
    });
  };

  const log = createEventLog({ editor, mount: logBody, onEntry: refresh });

  // Selection can move without any event we listen for (mouse drag, caret browsing),
  // and the DOM can change without an input event (engine writes, paste fixups).
  const observer = new MutationObserver(refresh);
  observer.observe(editor, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
  });
  document.addEventListener("selectionchange", refresh);

  refresh();

  return {
    log,
    refresh,
    destroy: () => {
      observer.disconnect();
      document.removeEventListener("selectionchange", refresh);
      log.destroy();
      mount.replaceChildren();
    },
  };
};
