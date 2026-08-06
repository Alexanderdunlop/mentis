import { createInspector } from "../src/devtools/index";
import type { Editor } from "../src/editor/types";
import { bindContentPresets } from "./content-presets";
import { engineProbe } from "./engine-probe";
import { bindEngineToggle } from "./engine-toggle";
import { bindLogControls } from "./log-controls";
import { bindMentionControls } from "./mention-controls";
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

const mentionControls = bindMentionControls(() => editor);

need("#ua").textContent = `${navigator.userAgent} · ${navigator.platform}`;

bindEngineToggle(element, (next) => {
  editor = next;
  presets.syncAvailability(next !== null);
  // Mentions are model nodes, so there is nothing to insert them into when detached.
  mentionControls.setEnabled(next !== null);
  inspector.refresh();
});

bindLogControls(inspector.log);
bindReplayControls(element);

element.focus();
