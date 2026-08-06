export type LogCategory =
  | "input"
  | "key"
  | "composition"
  | "clipboard"
  | "focus"
  | "selection";

/** What a `describe*` function produces, before the log stamps it with seq and time. */
export interface EventDescription {
  category: LogCategory;
  summary: string;
  detail: Record<string, unknown>;
}

export interface LogEntry extends EventDescription {
  seq: number;
  /** ms since the first logged event. */
  t: number;
  type: string;
}
