import { createEventLog, type EventLog } from "../log/create-event-log";
import { nullModelProbe, type ModelProbe } from "../model-probe";
import { readSelection } from "../selection/read-selection";
import { escapeHtml } from "../text/escape-html";
import { renderDomTree } from "../tree/render-tree";
import { createPanel, preBody } from "./panel";
import { renderSelection } from "./render-selection";

const TREE_LEGEND =
  '<span class="legend">▮ caret · ⟦⟧ range · · space · ⍽ nbsp · ⏎ newline</span>';
const LOG_LEGEND =
  '<span class="legend">beforeinput · input · composition · clipboard</span>';

export interface Inspector {
  log: EventLog;
  refresh: () => void;
  destroy: () => void;
}

interface Options {
  editor: HTMLElement;
  /** Container the inspector fills with its panels. */
  mount: HTMLElement;
  modelProbe?: ModelProbe;
}

export const createInspector = ({
  editor,
  mount,
  modelProbe = nullModelProbe,
}: Options): Inspector => {
  const selectionPanel = createPanel("Selection");
  const treePanel = createPanel("DOM", TREE_LEGEND);
  const modelPanel = createPanel(
    "Model",
    `<span class="legend">${escapeHtml(modelProbe.label)}</span>`
  );
  const logPanel = createPanel("Events", LOG_LEGEND);
  logPanel.body.classList.add("log-body");

  mount.append(
    selectionPanel.root,
    treePanel.root,
    modelPanel.root,
    logPanel.root
  );

  const treePre = preBody(treePanel);
  const modelPre = preBody(modelPanel);

  const modelOffset = (): number | null => {
    const selection = window.getSelection();
    if (!modelProbe.domToModel || !selection?.anchorNode) return null;
    return modelProbe.domToModel(selection.anchorNode, selection.anchorOffset);
  };

  const render = (): void => {
    selectionPanel.body.innerHTML = renderSelection(readSelection(editor), {
      modelOffset: modelOffset(),
      showModelOffset: Boolean(modelProbe.domToModel),
    });
    treePre.innerHTML = renderDomTree(editor);

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
      render();
    });
  };

  const log = createEventLog({ editor, mount: logPanel.body, onEntry: refresh });

  // Selection can move with no event we listen for (mouse drag, caret browsing), and
  // the DOM can change with no input event (engine writes, paste fixups).
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
