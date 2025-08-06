import React, { useState } from "react";
import { MentionInput, type MentionOption } from "../../src/index.js";
import "../../dist/index.css";
import "./style.css";

const options: MentionOption[] = [
  { label: "Alice", value: "1" },
  { label: "Bob", value: "2" },
  { label: "Charlie", value: () => alert("Charlie") },
];

export function App() {
  const [dataValue, setDataValue] = useState("2");

  const handleClear = () => {
    setDataValue("");
  };

  return (
    <>
      <div style={{ width: "300px", height: "200px", overflowY: "auto" }}>
        <MentionInput
          data-placeholder="Say something..."
          dataValue={dataValue}
          onChange={(value) => setDataValue(value.dataValue)}
          options={options}
          slotsProps={{
            contentEditable: {
              "data-placeholder": "Say something...",
            },
          }}
        />
        <button onClick={handleClear}>Clear</button>
      </div>
    </>
  );
}
