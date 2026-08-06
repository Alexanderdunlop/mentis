export { createInspector, type Inspector } from "./inspector/create-inspector";
export { nullModelProbe, type ModelProbe } from "./model-probe";
export { SCENARIOS, type Scenario } from "./scenarios";

export { parseScript, ReplayParseError } from "./replay/parse-script";
export { runScript, runScriptSource, type RunOptions } from "./replay/run-script";
export type { Modifiers, ReplayStep } from "./replay/types";

export type { EventLog } from "./log/create-event-log";
export type { LogCategory, LogEntry } from "./log/types";
export type { SelectionPoint, SelectionSnapshot } from "./selection/types";
