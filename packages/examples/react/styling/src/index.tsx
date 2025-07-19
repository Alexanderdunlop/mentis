import React from "react";
import ReactDOM from "react-dom/client";
import { MentionInput, type MentionOption } from "mentis";
import "./index.css";

const options: MentionOption[] = [
  { label: "Alice", value: "alice" },
  { label: "Bob", value: "bob" },
  { label: "Charlie", value: "charlie" },
];

function App() {
  return (
    <div className="mentis-demo-outer">
      <h1 className="mentis-demo-title">Vite + React + Mentis</h1>
      <MentionInput
        options={options}
        slotsProps={{
          container: {
            className: "mentis-demo-container",
          },
          contentEditable: {
            className: "mentis-demo-content-editable",
          },
          modal: {
            className: "mentis-demo-modal",
          },
          option: {
            className: "mentis-demo-option",
          },
          chipClassName: "mentis-demo-chip",
          highlightedClassName: "mentis-demo-option-highlighted",
          noOptions: {
            className: "mentis-demo-no-options",
          },
        }}
      />
    </div>
  );
}

const rootElement = document.getElementById("root") as HTMLElement;
ReactDOM.createRoot(rootElement).render(<App />);
