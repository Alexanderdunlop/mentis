import React from "react";
import { MentionInput, type MentionOption } from "../../dist/index.js";
import "../../dist/index.css";
import "./style.css";

const options: MentionOption[] = [
  { label: "Alice", value: "1" },
  { label: "Bob", value: "2" },
  { label: "Charlie", value: () => alert("Charlie") },
];

export function App() {
  return (
    <>
      <div style={{ width: "300px", height: "200px", overflowY: "auto" }}>
        <MentionInput
          data-placeholder="Say something..."
          value={""}
          options={options}
          slotsProps={{
            contentEditable: {
              "data-placeholder": "Say something...",
            },
          }}
        />
      </div>
    </>
  );
}
