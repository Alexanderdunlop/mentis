import { useCallback, useMemo } from "react";
import { insertMention } from "../../commands/insert-mention";
import type { Editor, EditorState } from "../../editor/types";
import { mentionQuery } from "../../query/mention-query";
import type { MentionQuery, MentionQueryOptions } from "../../query/types";

/**
 * The active mention query, for rendering a menu.
 *
 * **A `useMemo`, not a `useState` plus an effect** — and that is the whole point of
 * [ADR 0006](../../../docs/adr/0006-the-mention-query-is-derived-state.md) arriving in
 * React. The query is a pure function of `(doc, selection)`, so there is exactly one right
 * answer for any state and nothing to keep in sync. Storing it would reintroduce the
 * open/close flag and the `detected`/`cleared` event pair that the archived v2 branch got
 * wrong, this time with a stale-render bug available as well.
 *
 * The `useMemo` is a formality — recomputing is cheap and the search never leaves the
 * caret's text node — but it keeps the returned object referentially stable between
 * unrelated renders, which matters if a consumer puts it in a dependency array.
 */

export interface UseMentionQueryResult {
  /** The active query, or null when no menu should be open. */
  query: MentionQuery | null;
  /**
   * Insert a mention, replacing the trigger and the typed query.
   *
   * A no-op when no query is active, so a menu that fires a stale selection cannot insert
   * a chip in the wrong place.
   */
  select: (mention: { label: string; value: string }) => void;
}

export const useMentionQuery = (
  editor: Editor | null,
  state: EditorState | null,
  options: MentionQueryOptions = {}
): UseMentionQueryResult => {
  const { triggers, maxQueryLength } = options;

  const query = useMemo(
    () =>
      state
        ? mentionQuery({
            doc: state.doc,
            selection: state.selection,
            triggers,
            maxQueryLength,
          })
        : null,
    [state, triggers, maxQueryLength]
  );

  const select = useCallback(
    ({ label, value }: { label: string; value: string }) => {
      if (!editor || !query) return;
      editor.dispatch(
        insertMention({ label, value, range: { from: query.from, to: query.to } })
      );
      editor.element.focus();
    },
    [editor, query]
  );

  return { query, select };
};
