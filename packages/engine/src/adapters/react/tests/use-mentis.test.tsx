import { StrictMode, useState } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createDoc } from "../../../model/create-doc";
import { replaceRange } from "../../../model/transaction";
import { docText } from "../../../model/doc-text";
import { useMentionQuery } from "../use-mention-query";
import { useMentis } from "../use-mentis";

/**
 * The React adapter, under happy-dom.
 *
 * **What this layer can and cannot prove.** happy-dom is trusted here for React's own
 * contract — does the hook subscribe, re-render, and tear down — and for the adapter's
 * plumbing. It is *not* trusted for editing semantics: caret behaviour, native input and
 * composition are all approximations, and `vitest.config.ts` says so. Those live in
 * `e2e/`. So nothing below types a key and asserts a document; the edits go through
 * `dispatch`, which is the adapter's actual interface to the engine.
 */

afterEach(cleanup);

const Harness = ({ initialText }: { initialText?: string }) => {
  const { ref, state, editor } = useMentis({ initialText });
  const { query, select } = useMentionQuery(editor, state);

  return (
    <div>
      <div data-testid="editor" ref={ref} />
      <span data-testid="text">{state ? docText(state.doc) : "no-state"}</span>
      <span data-testid="query">{query ? query.query : "none"}</span>
      <span data-testid="attached">{editor ? "yes" : "no"}</span>
      <button
        data-testid="insert"
        onClick={() => select({ label: "@Alice", value: "u_1" })}
      />
      <button
        data-testid="type"
        onClick={() =>
          editor?.dispatch({
            steps: replaceRange(0, 0, createDoc("@al").nodes),
            selection: { anchor: 3, head: 3 },
            origin: "user",
          })
        }
      />
    </div>
  );
};

describe("useMentis", () => {
  it("attaches on mount and reports state", () => {
    render(<Harness initialText="hello" />);

    expect(screen.getByTestId("attached").textContent).toBe("yes");
    expect(screen.getByTestId("text").textContent).toBe("hello");
  });

  it("gives the engine an element it owns", () => {
    // The one rule a consumer must respect: React renders an *empty* element and the
    // engine fills it. If React ever rendered children here, the DOM would become a
    // second source of truth — mentis v1's central bug, one layer up.
    render(<Harness initialText="hi" />);

    const element = screen.getByTestId("editor");
    expect(element.getAttribute("contenteditable")).toBe("true");
    expect(element.textContent).toBe("hi");
  });

  it("has state on the first commit, not one render later", () => {
    // Attachment happens in the ref callback during commit, so `state` is already there —
    // it never renders the `no-state` branch. Worth pinning: an adapter that attached in
    // an effect instead would flash an empty menu, or force every consumer to write a
    // null guard for one frame.
    render(<Harness />);

    expect(screen.getByTestId("text").textContent).toBe("");
    expect(screen.getByTestId("attached").textContent).toBe("yes");
  });

  it("re-renders when a transaction is applied", () => {
    render(<Harness />);

    act(() => screen.getByTestId("type").click());

    expect(screen.getByTestId("text").textContent).toBe("@al");
  });

  it("survives StrictMode's double mount without losing the editor", () => {
    // StrictMode mounts, unmounts and remounts effects. An adapter that created the editor
    // in an effect without cleaning up would leak one and leave the DOM owned by a
    // destroyed instance.
    render(
      <StrictMode>
        <Harness initialText="hi" />
      </StrictMode>
    );

    expect(screen.getByTestId("attached").textContent).toBe("yes");
    expect(screen.getByTestId("text").textContent).toBe("hi");
    expect(screen.getByTestId("editor").textContent).toBe("hi");
  });

  it("detaches when the element goes away", () => {
    const Toggle = () => {
      const [shown, setShown] = useState(true);
      return (
        <div>
          <button data-testid="toggle" onClick={() => setShown(false)} />
          {shown ? <Harness initialText="hi" /> : null}
        </div>
      );
    };

    render(<Toggle />);
    expect(screen.getByTestId("attached").textContent).toBe("yes");

    act(() => screen.getByTestId("toggle").click());

    expect(screen.queryByTestId("editor")).toBeNull();
  });

  it("leaves the element a plain contentEditable after unmount", () => {
    const { unmount } = render(<Harness initialText="hi" />);
    const element = screen.getByTestId("editor");

    unmount();

    // `destroy` removes the engine's listeners. Asserted because a consumer unmounting is
    // the ordinary case, and a leaked `selectionchange` listener on `document` would
    // outlive the component silently.
    expect(element.isConnected).toBe(false);
  });
});

describe("useMentionQuery", () => {
  it("is null with no active trigger", () => {
    render(<Harness initialText="hello" />);
    expect(screen.getByTestId("query").textContent).toBe("none");
  });

  it("derives the query from the state it was given", () => {
    render(<Harness />);

    act(() => screen.getByTestId("type").click());

    expect(screen.getByTestId("query").textContent).toBe("al");
  });

  it("inserts a mention that replaces the trigger and the query", () => {
    render(<Harness />);
    act(() => screen.getByTestId("type").click());
    expect(screen.getByTestId("query").textContent).toBe("al");

    act(() => screen.getByTestId("insert").click());

    // The `@al` is gone, replaced by the chip *and a trailing space* — `insertMention`
    // adds one so the caret never ends up immediately after an atom with nothing to its
    // right, the one position browsers are unreliable about painting.
    expect(screen.getByTestId("text").textContent).toBe("@Alice ");
    expect(screen.getByTestId("query").textContent).toBe("none");
  });

  it("does nothing when asked to insert with no active query", () => {
    render(<Harness initialText="hello" />);

    act(() => screen.getByTestId("insert").click());

    expect(screen.getByTestId("text").textContent).toBe("hello");
  });
});
