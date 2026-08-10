import { useState, type KeyboardEvent } from "react";
import { createRoot } from "react-dom/client";
import { useMentionQuery, useMentis } from "../src/adapters/react";
import { docText } from "../src/model/doc-text";
import { mentions } from "../src/model/mentions";
import { positionRect } from "../src/view/position-rect";
import { filterPeople } from "./people";
import "./styles.css";

/**
 * The M7 demo: the same engine the inspector drives, driven by React instead.
 *
 * Worth reading next to `dev/mention-flow.ts`, which does this in plain DOM. The two are
 * the same shape — subscribe, derive the query, handle the keys yourself, dispatch a
 * transaction to insert — because the engine's contract never assumed either one. That
 * correspondence *is* the milestone; if this file had needed anything new from `src/`, the
 * layering would not have held.
 */

const Editor = () => {
  const { ref, state, editor } = useMentis({ initialText: "Hey " });
  const { query, select } = useMentionQuery(editor, state);
  const [highlighted, setHighlighted] = useState(0);

  const people = query ? filterPeople(query.query) : [];
  // Clamped rather than reset in an effect: the list is derived from the query, so the
  // index only needs to be valid at the moment it is used.
  const index = people.length === 0 ? 0 : highlighted % people.length;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!query || people.length === 0) return;

    // ADR 0003: the engine intercepts `beforeinput` and nothing else, so these keys are
    // the consumer's business. Preventing Enter here is also what stops it reaching
    // `beforeinput` and inserting a newline.
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlighted((current) => current + 1);
        return;
      case "ArrowUp":
        event.preventDefault();
        setHighlighted((current) => current + people.length - 1);
        return;
      case "Enter":
      case "Tab":
        event.preventDefault();
        select(people[index]!);
        setHighlighted(0);
        return;
      case "Escape":
        event.preventDefault();
        setHighlighted(0);
        return;
      default:
    }
  };

  const rect =
    editor && state && query ? positionRect(editor.element, state.doc, query.from) : null;

  return (
    <div>
      {/* Empty on purpose. The engine owns everything inside it. */}
      <div className="editor" ref={ref} onKeyDown={onKeyDown} />

      {query && people.length > 0 && (
        <div
          className="dropdown"
          style={{
            position: "fixed",
            left: rect ? rect.left : 0,
            top: rect ? rect.bottom : 0,
          }}
        >
          {people.map((person, position) => (
            <div
              key={person.value}
              className={position === index ? "option is-active" : "option"}
              onMouseDown={(event) => {
                // `mousedown`, not `click`: the editor must not lose the selection before
                // the insert reads it.
                event.preventDefault();
                select(person);
              }}
            >
              {person.label} <span className="dim">{person.value}</span>
            </div>
          ))}
        </div>
      )}

      <section className="panel" style={{ marginTop: "1rem" }}>
        <header className="panel-head"><span>Model</span></header>
        <div className="panel-body">
          <pre>
            {JSON.stringify(
              {
                text: state ? docText(state.doc) : null,
                selection: state?.selection ?? null,
                mentions: state ? mentions(state.doc) : [],
                query: query ?? null,
                history: editor?.getHistory() ?? null,
              },
              null,
              2
            )}
          </pre>
        </div>
      </section>
    </div>
  );
};

const root = document.querySelector("#root");
if (!root) throw new Error("react demo: #root missing");
createRoot(root).render(<Editor />);
