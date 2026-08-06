import { createInspector } from "../src/devtools/index";
import { bindContentPresets } from "./content-presets";
import { bindIntercept } from "./intercept";
import { bindLogControls } from "./log-controls";
import { need } from "./need";
import { bindReplayControls } from "./replay-controls";
import "./styles.css";

const editor = need<HTMLDivElement>("#editor");
const inspector = createInspector({ editor, mount: need("#inspector") });

need("#ua").textContent = `${navigator.userAgent} · ${navigator.platform}`;

bindIntercept(editor);
bindLogControls(inspector.log);
bindReplayControls(editor);
bindContentPresets(editor, inspector.refresh);

editor.focus();
