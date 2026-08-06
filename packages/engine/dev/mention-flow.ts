import { insertMention } from "../src/commands/insert-mention";
import type { Editor } from "../src/editor/types";
import { mentionQuery } from "../src/query/mention-query";
import type { MentionQuery } from "../src/query/types";
import { positionRect } from "../src/view/position-rect";
import { createDropdown } from "./mention-dropdown";
import { filterPeople, type Person } from "./people";

/**
 * Trigger → dropdown → insert.
 *
 * Two boundaries are deliberate here, and both preview what a framework adapter does:
 *
 * 1. The query is **recomputed from state**, never stored. `mentionQuery` is a pure
 *    function of (doc, selection), so there is no "query is open" flag to go stale and
 *    no clear/detect events to sequence. See ADR 0006.
 * 2. The **keydown handling lives here, not in the engine.** ADR 0003 says the engine
 *    intercepts `beforeinput` and nothing else, so Arrow/Enter/Escape/Tab while a menu is
 *    open are the consumer's business. Preventing the keydown is also what stops Enter
 *    reaching `beforeinput` and inserting a newline.
 */
export const bindMentionFlow = (element: HTMLElement) => {
  let editor: Editor | null = null;
  let unsubscribe: (() => void) | null = null;
  let active: MentionQuery | null = null;

  const select = (person: Person): void => {
    if (!editor || !active) return;
    editor.dispatch(
      insertMention({
        label: person.label,
        value: person.value,
        range: { from: active.from, to: active.to },
      })
    );
    dropdown.close();
    element.focus();
  };

  const dropdown = createDropdown({ onSelect: select });

  const refresh = (): void => {
    if (!editor) {
      active = null;
      dropdown.close();
      return;
    }

    const { doc, selection } = editor.getState();
    active = mentionQuery({ doc, selection });

    if (!active) {
      dropdown.close();
      return;
    }

    dropdown.open(
      filterPeople(active.query),
      positionRect(element, doc, active.from)
    );
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!dropdown.isOpen()) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        dropdown.move(1);
        return;
      case "ArrowUp":
        event.preventDefault();
        dropdown.move(-1);
        return;
      case "Enter":
      case "Tab": {
        const person = dropdown.highlighted();
        if (!person) return;
        event.preventDefault();
        select(person);
        return;
      }
      case "Escape":
        event.preventDefault();
        dropdown.close();
        return;
      default:
        return;
    }
  };

  element.addEventListener("keydown", onKeyDown);
  element.addEventListener("blur", () => dropdown.close());

  return {
    /** Called by the engine toggle when the editor attaches or detaches. */
    onEditorChanged: (next: Editor | null): void => {
      unsubscribe?.();
      unsubscribe = null;
      editor = next;
      // Recompute on every applied transaction and every selection change; the query is
      // derived, so there is nothing else to keep in sync.
      if (next) unsubscribe = next.subscribe(refresh);
      refresh();
    },
  };
};
