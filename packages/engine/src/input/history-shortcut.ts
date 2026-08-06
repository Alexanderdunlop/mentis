export type HistoryCommand = "undo" | "redo";

/** The parts of a KeyboardEvent this needs, so it stays testable without a DOM. */
export interface ShortcutEvent {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
}

/**
 * Match the platform undo/redo shortcuts.
 *
 * The engine has to watch keys for this, which is a narrow exception to ADR 0003's
 * "beforeinput and nothing else". The reason is structural: because every `beforeinput`
 * is prevented, the browser's own undo stack stays empty, so pressing ⌘Z may produce no
 * `beforeinput` at all — there is nothing for the browser to undo. Waiting for
 * `historyUndo` would mean undo silently never working. See ADR 0007.
 *
 * `historyUndo`/`historyRedo` are still honoured when they do arrive, from the Edit menu
 * or a trackpad gesture, so both routes reach the same command.
 */
export const historyShortcut = (event: ShortcutEvent): HistoryCommand | null => {
  const mod = event.metaKey || event.ctrlKey;
  if (!mod) return null;

  const key = event.key.toLowerCase();

  if (key === "z") return event.shiftKey ? "redo" : "undo";
  // Windows/Linux convention; macOS has no Cmd+Y binding to clash with.
  if (key === "y" && event.ctrlKey && !event.metaKey) return "redo";

  return null;
};
