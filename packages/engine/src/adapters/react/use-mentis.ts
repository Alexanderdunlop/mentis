import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createEditor } from "../../editor/create-editor";
import type { Editor, EditorState } from "../../editor/types";

/**
 * The React adapter.
 *
 * The plan calls M7 a victory lap, and this is why: the engine already exposes
 * `subscribe(listener) => unsubscribe` and a `getState()` whose reference changes exactly
 * when something changed. That is `useSyncExternalStore`'s contract, arrived at without
 * React being in the room — `create-editor.ts` reassigns `state` on every applied
 * transaction *and* on a selection change, and returns early when the selection did not
 * actually move. So there is no adapter-side caching, diffing, or equality function here,
 * and there should never need to be.
 *
 * **The engine owns the element's children; React must never render into it.** That is the
 * one rule a consumer has to respect, and the reason this returns a `ref` for an element
 * left empty rather than a component with children. React writing into a contenteditable
 * the engine also writes into is the exact failure mode mentis v1 has — the DOM as a second
 * source of truth — reintroduced one layer up.
 */

export interface UseMentisOptions {
  /** Initial document text. Applied once, when the editor is created. */
  initialText?: string;
  /** Called for any `inputType` the engine has no rule for, instead of guessing. */
  onUnhandledInput?: (inputType: string) => void;
}

export interface UseMentisResult {
  /** Attach to an **empty** element the engine will own: `<div ref={ref} />`. */
  ref: (element: HTMLElement | null) => void;
  /**
   * The current model state, or null before the editor has attached.
   *
   * Re-renders on every applied transaction and every real selection change, because the
   * mention query is derived from both (ADR 0006).
   */
  state: EditorState | null;
  /** The editor itself, for `dispatch`, `undo`, `redo`. Null before attachment. */
  editor: Editor | null;
}

/**
 * A stable empty store for the window before the editor exists.
 *
 * `useSyncExternalStore` may not be called conditionally, and its `subscribe` must be
 * referentially stable or React resubscribes on every render. So both halves are swapped
 * behind refs rather than being conditional hooks.
 */
const NO_STATE = null;

export const useMentis = ({
  initialText,
  onUnhandledInput,
}: UseMentisOptions = {}): UseMentisResult => {
  const editorRef = useRef<Editor | null>(null);
  // Forces the `useSyncExternalStore` subscription to re-run once the editor exists, and
  // is what makes `editor` in the result non-null on the render after attachment.
  const [, setAttached] = useState(0);

  // Held in a ref so a consumer passing an inline arrow does not tear down the editor on
  // every render. The engine reads it only when it has nothing better to do.
  const onUnhandled = useRef(onUnhandledInput);
  onUnhandled.current = onUnhandledInput;

  // `initialText` applies once, at creation. Kept in a ref so changing it later cannot
  // silently recreate the editor and discard the user's document and undo history.
  const initial = useRef(initialText);

  const listeners = useRef(new Set<() => void>());

  const subscribe = useCallback((notify: () => void) => {
    listeners.current.add(notify);
    return () => {
      listeners.current.delete(notify);
    };
  }, []);

  const getSnapshot = useCallback(
    (): EditorState | null => editorRef.current?.getState() ?? NO_STATE,
    []
  );

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const attach = useCallback((element: HTMLElement | null) => {
    if (editorRef.current) {
      editorRef.current.destroy();
      editorRef.current = null;
    }
    if (!element) {
      setAttached((count) => count + 1);
      return;
    }

    const editor = createEditor({
      element,
      initialText: initial.current,
      onUnhandledInput: (inputType) => onUnhandled.current?.(inputType),
    });
    // One engine subscription fans out to every React subscriber, so mounting two
    // components does not mean two engine listeners.
    editor.subscribe(() => {
      for (const notify of listeners.current) notify();
    });
    editorRef.current = editor;
    setAttached((count) => count + 1);
  }, []);

  // A ref callback rather than an effect on a `useRef`, so attachment happens in the same
  // commit the element appears in — and detachment when it leaves. React 19 would let the
  // callback return a cleanup, but doing it here keeps the adapter working on 18 too.
  useEffect(
    () => () => {
      editorRef.current?.destroy();
      editorRef.current = null;
    },
    []
  );

  return { ref: attach, state, editor: editorRef.current };
};
