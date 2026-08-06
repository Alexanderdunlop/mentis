import { escapeHtml, truncate, visibleWhitespace } from "./format";
import { charRangeOfStaticRange } from "./selection-probe";

export type LogCategory =
  | "input"
  | "key"
  | "composition"
  | "clipboard"
  | "focus"
  | "selection";

export interface LogEntry {
  seq: number;
  /** ms since the first logged event. */
  t: number;
  type: string;
  category: LogCategory;
  summary: string;
  detail: Record<string, unknown>;
}

const MAX_ENTRIES = 500;

const modifierGlyphs = (event: KeyboardEvent): string =>
  [
    event.metaKey ? "⌘" : "",
    event.ctrlKey ? "⌃" : "",
    event.altKey ? "⌥" : "",
    event.shiftKey ? "⇧" : "",
  ].join("");

const quote = (value: string | null): string =>
  value === null ? "null" : `"${visibleWhitespace(value)}"`;

const targetRangeSummary = (root: Element, event: InputEvent): string => {
  if (typeof event.getTargetRanges !== "function") return "";
  const ranges = event.getTargetRanges();
  if (ranges.length === 0) return " ranges:none";
  return ` ranges:${ranges
    .map((range) => {
      const { start, end } = charRangeOfStaticRange(root, range);
      return start === end ? `[${start}]` : `[${start},${end}]`;
    })
    .join(",")}`;
};

const clipboardSummary = (data: DataTransfer | null): string => {
  if (!data) return "no dataTransfer";
  const types = Array.from(data.types);
  const plain = types.includes("text/plain")
    ? ` text/plain=${quote(truncate(data.getData("text/plain"), 40))}`
    : "";
  return `${types.join(", ") || "no types"}${plain}`;
};

interface CreateEventLogOptions {
  editor: HTMLElement;
  mount: HTMLElement;
  onEntry?: (entry: LogEntry) => void;
}

export interface EventLog {
  clear: () => void;
  destroy: () => void;
  setPaused: (paused: boolean) => void;
  setLogSelectionChange: (enabled: boolean) => void;
  setAutoscroll: (enabled: boolean) => void;
  toJSON: () => string;
  entries: () => LogEntry[];
}

export const createEventLog = ({
  editor,
  mount,
  onEntry,
}: CreateEventLogOptions): EventLog => {
  const entries: LogEntry[] = [];
  let seq = 0;
  let startedAt: number | null = null;
  let paused = false;
  let logSelectionChange = false;
  let autoscroll = true;
  /** textContent captured at `beforeinput`, so `input` can report the actual delta. */
  let pendingText: string | null = null;

  const table = document.createElement("div");
  table.className = "log-rows";
  mount.appendChild(table);

  const push = (
    type: string,
    category: LogCategory,
    summary: string,
    detail: Record<string, unknown>
  ): void => {
    if (paused) return;

    const now = performance.now();
    startedAt ??= now;

    const entry: LogEntry = {
      seq: ++seq,
      t: Math.round(now - startedAt),
      type,
      category,
      summary,
      detail,
    };
    entries.push(entry);

    const row = document.createElement("div");
    row.className = `log-row log-${category}`;
    row.innerHTML =
      `<span class="log-seq">${entry.seq}</span>` +
      `<span class="log-time">+${entry.t}</span>` +
      `<span class="log-type">${escapeHtml(entry.type)}</span>` +
      `<span class="log-summary">${escapeHtml(entry.summary)}</span>`;
    table.appendChild(row);

    while (entries.length > MAX_ENTRIES) {
      entries.shift();
      table.firstElementChild?.remove();
    }

    if (autoscroll) mount.scrollTop = mount.scrollHeight;
    onEntry?.(entry);
  };

  const onKeyDown = (event: Event): void => {
    const keyEvent = event as KeyboardEvent;
    push(
      "keydown",
      "key",
      `${modifierGlyphs(keyEvent)}${keyEvent.key}${keyEvent.isComposing ? " (composing)" : ""}`,
      {
        key: keyEvent.key,
        code: keyEvent.code,
        ctrl: keyEvent.ctrlKey,
        meta: keyEvent.metaKey,
        shift: keyEvent.shiftKey,
        alt: keyEvent.altKey,
        isComposing: keyEvent.isComposing,
        isTrusted: keyEvent.isTrusted,
      }
    );
  };

  const onBeforeInput = (event: Event): void => {
    const inputEvent = event as InputEvent;
    pendingText = editor.textContent ?? "";
    push(
      "beforeinput",
      "input",
      `${inputEvent.inputType} data=${quote(inputEvent.data)}` +
        targetRangeSummary(editor, inputEvent) +
        (inputEvent.isComposing ? " composing" : "") +
        // Set by the capture-phase listener in the harness when "intercept all" is on.
        (inputEvent.defaultPrevented ? " PREVENTED" : ""),
      {
        inputType: inputEvent.inputType,
        data: inputEvent.data,
        isComposing: inputEvent.isComposing,
        defaultPrevented: inputEvent.defaultPrevented,
        dataTransfer: inputEvent.dataTransfer
          ? clipboardSummary(inputEvent.dataTransfer)
          : null,
        textBefore: pendingText,
      }
    );
  };

  const onInput = (event: Event): void => {
    const inputEvent = event as InputEvent;
    const textAfter = editor.textContent ?? "";
    const changed = pendingText !== null && pendingText !== textAfter;
    push(
      "input",
      "input",
      `${inputEvent.inputType} → ${quote(truncate(textAfter, 48))}` +
        (changed ? "" : " (no text change)"),
      {
        inputType: inputEvent.inputType,
        data: inputEvent.data,
        textBefore: pendingText,
        textAfter,
      }
    );
    pendingText = null;
  };

  const onComposition = (event: Event): void => {
    const compositionEvent = event as CompositionEvent;
    push(compositionEvent.type, "composition", `data=${quote(compositionEvent.data)}`, {
      data: compositionEvent.data,
      textContent: editor.textContent,
    });
  };

  const onClipboard = (event: Event): void => {
    const clipboardEvent = event as ClipboardEvent;
    push(
      clipboardEvent.type,
      "clipboard",
      clipboardSummary(clipboardEvent.clipboardData),
      {
        types: clipboardEvent.clipboardData
          ? Array.from(clipboardEvent.clipboardData.types)
          : [],
        plain: clipboardEvent.clipboardData?.getData("text/plain") ?? null,
        html: clipboardEvent.clipboardData?.getData("text/html") ?? null,
      }
    );
  };

  const onFocusEvent = (event: Event): void => {
    push(event.type, "focus", "", {});
  };

  const onSelectionChange = (): void => {
    if (!logSelectionChange) return;
    const selection = window.getSelection();
    push("selectionchange", "selection", selection ? "" : "no selection", {
      isCollapsed: selection?.isCollapsed ?? null,
      anchorOffset: selection?.anchorOffset ?? null,
      focusOffset: selection?.focusOffset ?? null,
    });
  };

  const listeners: [string, EventListener][] = [
    ["keydown", onKeyDown],
    ["beforeinput", onBeforeInput],
    ["input", onInput],
    ["compositionstart", onComposition],
    ["compositionupdate", onComposition],
    ["compositionend", onComposition],
    ["paste", onClipboard],
    ["copy", onClipboard],
    ["cut", onClipboard],
    ["drop", onClipboard],
    ["focus", onFocusEvent],
    ["blur", onFocusEvent],
  ];

  for (const [type, listener] of listeners) {
    editor.addEventListener(type, listener);
  }
  document.addEventListener("selectionchange", onSelectionChange);

  return {
    clear: () => {
      entries.length = 0;
      seq = 0;
      startedAt = null;
      table.replaceChildren();
    },
    destroy: () => {
      for (const [type, listener] of listeners) {
        editor.removeEventListener(type, listener);
      }
      document.removeEventListener("selectionchange", onSelectionChange);
      table.remove();
    },
    setPaused: (value) => {
      paused = value;
    },
    setLogSelectionChange: (value) => {
      logSelectionChange = value;
    },
    setAutoscroll: (value) => {
      autoscroll = value;
    },
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
