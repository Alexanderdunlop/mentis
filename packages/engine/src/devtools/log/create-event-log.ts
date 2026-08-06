import {
  describeBeforeInput,
  describeClipboard,
  describeComposition,
  describeFocus,
  describeInput,
  describeKeydown,
  describeSelectionChange,
} from "./describe-event";
import { renderRow } from "./render-row";
import type { EventDescription, LogEntry } from "./types";

const MAX_ENTRIES = 500;

export interface EventLog {
  clear: () => void;
  destroy: () => void;
  setPaused: (paused: boolean) => void;
  setLogSelectionChange: (enabled: boolean) => void;
  setAutoscroll: (enabled: boolean) => void;
  toJSON: () => string;
  entries: () => LogEntry[];
}

interface Options {
  editor: HTMLElement;
  mount: HTMLElement;
  onEntry?: (entry: LogEntry) => void;
}

export const createEventLog = ({ editor, mount, onEntry }: Options): EventLog => {
  const entries: LogEntry[] = [];
  const rows = document.createElement("div");
  rows.className = "log-rows";
  mount.appendChild(rows);

  let seq = 0;
  let startedAt: number | null = null;
  let paused = false;
  let logSelectionChange = false;
  let autoscroll = true;
  /** textContent at `beforeinput`, so `input` can report the actual delta. */
  let pendingText: string | null = null;

  const push = (type: string, description: EventDescription): void => {
    if (paused) return;

    const now = performance.now();
    startedAt ??= now;

    const entry: LogEntry = {
      ...description,
      seq: ++seq,
      t: Math.round(now - startedAt),
      type,
    };
    entries.push(entry);
    rows.appendChild(renderRow(entry));

    while (entries.length > MAX_ENTRIES) {
      entries.shift();
      rows.firstElementChild?.remove();
    }

    if (autoscroll) mount.scrollTop = mount.scrollHeight;
    onEntry?.(entry);
  };

  const listeners: [string, EventListener][] = [
    ["keydown", (e) => push("keydown", describeKeydown(e as KeyboardEvent))],
    [
      "beforeinput",
      (e) => {
        pendingText = editor.textContent ?? "";
        push("beforeinput", describeBeforeInput(e as InputEvent, editor));
      },
    ],
    [
      "input",
      (e) => {
        push("input", describeInput(e as InputEvent, editor, pendingText));
        pendingText = null;
      },
    ],
    ...(["compositionstart", "compositionupdate", "compositionend"] as const).map(
      (type): [string, EventListener] => [
        type,
        (e) => push(type, describeComposition(e as CompositionEvent, editor)),
      ]
    ),
    ...(["paste", "copy", "cut", "drop"] as const).map(
      (type): [string, EventListener] => [
        type,
        (e) => push(type, describeClipboard(e as ClipboardEvent)),
      ]
    ),
    ...(["focus", "blur"] as const).map(
      (type): [string, EventListener] => [type, () => push(type, describeFocus())]
    ),
  ];

  const onSelectionChange = (): void => {
    if (logSelectionChange) push("selectionchange", describeSelectionChange());
  };

  for (const [type, listener] of listeners) {
    editor.addEventListener(type, listener);
  }
  document.addEventListener("selectionchange", onSelectionChange);

  return {
    clear: () => {
      entries.length = 0;
      seq = 0;
      startedAt = null;
      rows.replaceChildren();
    },
    destroy: () => {
      for (const [type, listener] of listeners) {
        editor.removeEventListener(type, listener);
      }
      document.removeEventListener("selectionchange", onSelectionChange);
      rows.remove();
    },
    setPaused: (value) => void (paused = value),
    setLogSelectionChange: (value) => void (logSelectionChange = value),
    setAutoscroll: (value) => void (autoscroll = value),
    toJSON: () =>
      JSON.stringify(
        {
          recordedAt: new Date().toISOString(),
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          entries,
        },
        null,
        2
      ),
    entries: () => [...entries],
  };
};
