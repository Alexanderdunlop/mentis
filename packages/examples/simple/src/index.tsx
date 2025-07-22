import React from "react";
import ReactDOM from "react-dom/client";
import { MentionInput, type MentionOption } from "mentis";
import "mentis/dist/index.css";

const options: MentionOption[] = [
  { label: "Alice", value: "alice" },
  { label: "Bob", value: "bob" },
  { label: "Charlie", value: "charlie" },
];

function App() {
  return (
    <div>
      <h1>Vite + React + Mentis</h1>
      <MentionInput options={options} />
    </div>
  );
}

const rootElement = document.getElementById("root") as HTMLElement;
ReactDOM.createRoot(rootElement).render(<App />);
