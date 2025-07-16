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
          input: {
            className: "mentis-demo-input",
          },
          listbox: {
            className: "mentis-demo-listbox",
          },
          option: {
            className: "mentis-demo-option",
          },
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
