import { createInspector } from "../src/devtools/index";
import type { Editor } from "../src/editor/types";
import { bindContentPresets } from "./content-presets";
import { bindDirectionToggle } from "./direction-toggle";
import { engineProbe } from "./engine-probe";
import { bindHistoryControls } from "./history-controls";
import { bindEngineToggle } from "./engine-toggle";
import { bindLogControls } from "./log-controls";
import { bindMentionControls } from "./mention-controls";
import { bindMentionFlow } from "./mention-flow";
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

// Independent of the engine toggle: direction is the container's either way, which is
// itself the demonstration — RTL looks the same attached and detached.
bindDirectionToggle(element);

const mentionControls = bindMentionControls(() => editor);
const mentionFlow = bindMentionFlow(element);
const historyControls = bindHistoryControls(() => editor);

need("#ua").textContent = `${navigator.userAgent} · ${navigator.platform}`;

bindEngineToggle(element, (next) => {
  editor = next;
  presets.syncAvailability(next !== null);
  // Mentions are model nodes, so there is nothing to insert them into when detached.
  mentionControls.setEnabled(next !== null);
  mentionFlow.onEditorChanged(next);
  historyControls.refresh();
  next?.subscribe(historyControls.refresh);
  inspector.refresh();
});

bindLogControls(inspector.log);
bindReplayControls(element);

element.focus();
