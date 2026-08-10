import { describe, expect, it } from "vitest";
import { textNode } from "../../model/nodes";
import type { Transaction } from "../../model/transaction";
import { canCoalesce, mergeEntries } from "../coalesce";
import { editShapeOf } from "../edit-shape";
import {
  canRedo,
  canUndo,
  record,
  redo,
  undo,
} from "../history-state";
import { emptyHistory, type HistoryEntry, type HistoryState } from "../types";

const typed = (at: number, char = "a"): Transaction => ({
  steps: [{ type: "insert", at, slice: [textNode(char)] }],
  selection: { anchor: at + 1, head: at + 1 },
  origin: "user",
});

const deleted = (from: number, to: number): Transaction => ({
  steps: [{ type: "delete", from, to }],
  selection: { anchor: from, head: from },
  origin: "user",
});

const entry = (
  transaction: Transaction,
  at: number
): { entry: HistoryEntry; shape: ReturnType<typeof editShapeOf> } => {
  const shape = editShapeOf(transaction);
  return {
    shape,
    entry: {
      undoSteps: [{ type: "delete", from: 0, to: 1 }],
      redoSteps: transaction.steps,
      selectionBefore: null,
      selectionAfter: transaction.selection ?? null,
      kind: shape.kind,
      endedAt: shape.endedAt,
      size: shape.size,
      char: shape.char,
      at,
    },
  };
};

const add = (state: HistoryState, transaction: Transaction, at: number) => {
  const { entry: next, shape } = entry(transaction, at);
  return record(state, next, shape);
};

describe("editShapeOf", () => {
  it("classifies a single typed character as type", () => {
    expect(editShapeOf(typed(3))).toEqual({
      kind: "type",
      startedAt: 3,
      endedAt: 4,
      size: 1,
      char: "a",
    });
  });

  it("classifies a delete, running right to left", () => {
    expect(editShapeOf(deleted(2, 3))).toEqual({
      kind: "delete",
      startedAt: 3,
      endedAt: 2,
      size: 1,
    });
  });

  it("treats a newline as its own step, not part of a typing run", () => {
    expect(editShapeOf(typed(3, "\n")).kind).toBe("other");
  });

  it("treats a multi-character insertion as other, so paste never coalesces", () => {
    expect(editShapeOf(typed(3, "hello")).kind).toBe("other");
  });

  it("counts a typed emoji as one character, however many code units it is", () => {
    // Measuring in code units would classify every emoji as "not typing" and hand it its
    // own undo step, so `hi ??` would undo in three pieces rather than as one run.
    expect(editShapeOf(typed(3, "\u{1F44D}")).kind).toBe("type");
    expect(editShapeOf(typed(3, "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}")).kind).toBe(
      "type"
    );
    expect(editShapeOf(typed(3, "e\u{0301}")).kind).toBe("type");
  });

  it("still measures the run in positions, so a long emoji run breaks up", () => {
    // `size` stays in position space — an emoji costs two of the group budget, not one —
    // because that is what the coalescing cap and every step offset are counted in.
    expect(editShapeOf(typed(3, "\u{1F44D}")).size).toBe(2);
    expect(editShapeOf(typed(3, "\u{1F44D}")).endedAt).toBe(5);
  });

  it("treats a multi-step transaction as other", () => {
    expect(
      editShapeOf({
        steps: [
          { type: "delete", from: 0, to: 1 },
          { type: "insert", at: 0, slice: [textNode("X")] },
        ],
        origin: "user",
      }).kind
    ).toBe("other");
  });

  it("never coalesces a programmatic edit, however small", () => {
    expect(editShapeOf({ ...typed(3), origin: "program" }).kind).toBe("other");
  });
});

describe("canCoalesce", () => {
  const previous = entry(typed(3), 1000).entry;

  it("joins an adjacent typed character within the gap", () => {
    expect(canCoalesce(previous, editShapeOf(typed(4)), 1100)).toBe(true);
  });

  it("refuses after going idle", () => {
    expect(canCoalesce(previous, editShapeOf(typed(4)), 9000)).toBe(false);
  });

  it("still joins across an ordinary typing hesitation", () => {
    // The bug this replaced: a 600ms rule split `Alex` into `Al` + `ex` whenever the
    // typist paused before the `e`, so undo depended on typing speed.
    expect(canCoalesce(previous, editShapeOf(typed(4)), 2500)).toBe(true);
  });

  it("closes the group after whitespace, so the next word is its own step", () => {
    const afterSpace = entry(typed(3, " "), 1000).entry;
    expect(canCoalesce(afterSpace, editShapeOf(typed(4)), 1100)).toBe(false);
  });

  it("joins the whitespace itself onto the word before it", () => {
    expect(canCoalesce(previous, editShapeOf(typed(4, " ")), 1100)).toBe(true);
  });

  it("refuses once the group is oversized", () => {
    const big = { ...previous, size: 80 };
    expect(canCoalesce(big, editShapeOf(typed(4)), 1100)).toBe(false);
  });

  it("refuses when the caret moved elsewhere", () => {
    expect(canCoalesce(previous, editShapeOf(typed(9)), 1100)).toBe(false);
  });

  it("refuses to mix typing with deleting", () => {
    expect(canCoalesce(previous, editShapeOf(deleted(3, 4)), 1100)).toBe(false);
  });

  it("refuses with no previous entry", () => {
    expect(canCoalesce(undefined, editShapeOf(typed(0)), 0)).toBe(false);
  });

  it("joins a backspace run", () => {
    const first = entry(deleted(4, 5), 1000).entry;
    expect(canCoalesce(first, editShapeOf(deleted(3, 4)), 1100)).toBe(true);
  });
});

describe("mergeEntries", () => {
  it("reverses undo steps so the later edit unwinds first", () => {
    const a: HistoryEntry = {
      ...entry(typed(0), 1000).entry,
      undoSteps: [{ type: "delete", from: 0, to: 1 }],
    };
    const b: HistoryEntry = {
      ...entry(typed(1), 1100).entry,
      undoSteps: [{ type: "delete", from: 1, to: 2 }],
    };

    expect(mergeEntries(a, b).undoSteps).toEqual([
      { type: "delete", from: 1, to: 2 },
      { type: "delete", from: 0, to: 1 },
    ]);
  });

  it("keeps redo steps in the order they happened", () => {
    const a = entry(typed(0, "a"), 1000).entry;
    const b = entry(typed(1, "b"), 1100).entry;
    expect(mergeEntries(a, b).redoSteps).toEqual([
      ...a.redoSteps,
      ...b.redoSteps,
    ]);
  });

  it("spans from the first selection to the last", () => {
    const a = { ...entry(typed(0), 1000).entry, selectionBefore: { anchor: 0, head: 0 } };
    const b = { ...entry(typed(1), 1100).entry, selectionAfter: { anchor: 2, head: 2 } };
    const merged = mergeEntries(a, b);
    expect(merged.selectionBefore).toEqual({ anchor: 0, head: 0 });
    expect(merged.selectionAfter).toEqual({ anchor: 2, head: 2 });
  });
});

describe("record", () => {
  it("collapses a typing run into one entry", () => {
    let state = emptyHistory();
    state = add(state, typed(0, "h"), 1000);
    state = add(state, typed(1, "e"), 1050);
    state = add(state, typed(2, "y"), 1100);


    expect(state.done).toHaveLength(1);
  });

  it("splits a typing run after going idle", () => {
    let state = emptyHistory();
    state = add(state, typed(0), 1000);
    state = add(state, typed(1), 9000);
    expect(state.done).toHaveLength(2);
  });

  it("groups the same keystrokes identically at any typing speed", () => {
    // The property that was broken: undo must be a function of what was typed, not of
    // how fast. Otherwise a Playwright assertion about undo depends on machine timing.
    const grouping = (perKeystrokeMs: number): number => {
      let state = emptyHistory();
      let clock = 1000;
      "Alex world".split("").forEach((char, index) => {
        state = add(state, typed(index, char), clock);
        clock += perKeystrokeMs;
      });
      return state.done.length;
    };

    // "Alex" + " " is one group, "world" is another — at 30ms/char or 900ms/char alike.
    expect(grouping(30)).toBe(2);
    expect(grouping(900)).toBe(2);
    expect(grouping(30)).toBe(grouping(900));
  });

  it("starts a new group per word", () => {
    let state = emptyHistory();
    let clock = 1000;
    "one two three".split("").forEach((char, index) => {
      state = add(state, typed(index, char), clock);
      clock += 40;
    });
    expect(state.done).toHaveLength(3);
  });

  it("splits typing from deleting", () => {
    let state = emptyHistory();
    state = add(state, typed(0), 1000);
    state = add(state, deleted(0, 1), 1050);
    expect(state.done).toHaveLength(2);
  });

  it("clears the redo branch, because the undone future no longer applies", () => {
    let state = add(emptyHistory(), typed(0), 1000);
    const stepped = undo(state)!;
    expect(canRedo(stepped.state)).toBe(true);

    state = add(stepped.state, typed(0, "z"), 2000);
    expect(canRedo(state)).toBe(false);
  });

  it("caps the stack depth", () => {
    let state = emptyHistory();
    for (let i = 0; i < 12; i += 1) {
      // Non-adjacent and far apart, so nothing coalesces.
      state = add(state, typed(i * 10), i * 9000);
    }
    state = record(state, entry(typed(500), 99999).entry, editShapeOf(typed(500)), {
      maxDepth: 5,
    });
    expect(state.done).toHaveLength(5);
  });
});

describe("undo and redo", () => {
  it("reports nothing to do on an empty history", () => {
    expect(undo(emptyHistory())).toBeNull();
    expect(redo(emptyHistory())).toBeNull();
    expect(canUndo(emptyHistory())).toBe(false);
    expect(canRedo(emptyHistory())).toBe(false);
  });

  it("moves an entry from done to undone and back", () => {
    const state = add(emptyHistory(), typed(0), 1000);

    const undone = undo(state)!;
    expect(undone.state.done).toHaveLength(0);
    expect(undone.state.undone).toHaveLength(1);

    const redone = redo(undone.state)!;
    expect(redone.state.done).toHaveLength(1);
    expect(redone.state.undone).toHaveLength(0);
  });

  it("returns the same entry to undo and to redo", () => {
    const state = add(emptyHistory(), typed(0), 1000);
    const undone = undo(state)!;
    expect(redo(undone.state)!.entry).toBe(undone.entry);
  });

  it("unwinds several entries in reverse order", () => {
    let state = emptyHistory();
    state = add(state, typed(0, "a"), 1000);
    state = add(state, typed(5, "b"), 20000);

    const first = undo(state)!;
    expect(first.entry.redoSteps).toEqual(typed(5, "b").steps);

    const second = undo(first.state)!;
    expect(second.entry.redoSteps).toEqual(typed(0, "a").steps);
    expect(canUndo(second.state)).toBe(false);
  });

  it("leaves the state untouched when there is nothing to undo", () => {
    const state = emptyHistory();
    expect(undo(state)).toBeNull();
    expect(state).toEqual(emptyHistory());
  });
});
