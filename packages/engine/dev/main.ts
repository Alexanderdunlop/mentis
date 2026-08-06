import { createInspector } from "../src/devtools/index";
import type { Editor } from "../src/editor/types";
import { bindContentPresets } from "./content-presets";
import { engineProbe } from "./engine-probe";
import { bindEngineToggle } from "./engine-toggle";
import { bindLogControls } from "./log-controls";
import { need } from "./need";
import { bindReplayControls } from "./replay-controls";
import "./styles.css";

const element = need<HTMLDivElement>("#editor");

let editor: Editor | null = null;

const inspector = createInspector({
  editor: element,
  mount: need("#inspector"),
  modelProbe: engineProbe(() => editor),
});

const presets = bindContentPresets({
  element,
  getEditor: () => editor,
  onApplied: inspector.refresh,
});

need("#ua").textContent = `${navigator.userAgent} · ${navigator.platform}`;

bindEngineToggle(element, (next) => {
  editor = next;
  presets.syncAvailability(next !== null);
  inspector.refresh();
});

bindLogControls(inspector.log);
bindReplayControls(element);

element.focus();
