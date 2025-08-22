import React, { useState } from "react";
import {
  MentionInput,
  MentionInputV2,
  type MentionOption,
} from "../../src/index.js";
import "../../dist/index.css";
import "./style.css";

const options: MentionOption[] = [
  { label: "Alice", value: "1" },
  { label: "Bob", value: "2" },
  { label: "Charlie", value: () => alert("Charlie") },
];

export function App() {
  const [dataValue, setDataValue] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [value, setValue] = useState("");

  const handleClear = () => {
    setDataValue("");
  };

  const handleDisplayValue = (value: string) => {
    setDisplayValue(value);
  };

  // console.log("displayValue", displayValue);

  return (
    <>
      <div style={{ width: "300px", height: "200px", overflowY: "auto" }}>
        <MentionInputV2
          value={value}
          placeholder="Say something..."
          onChange={(value) => {
            console.log("onChange", value);
            setValue(value);
          }}
        />
        <MentionInput
          data-placeholder="Say something..."
          dataValue={dataValue}
          onChange={(value) => {
            console.log(value);
            setDataValue(value.dataValue);
          }}
          options={options}
          slotsProps={{
            contentEditable: {
              "data-placeholder": "Say something...",
            },
          }}
        />
        <MentionInput
          data-placeholder="Say something..."
          displayValue={displayValue}
          onChange={(value) => {
            console.log(value);
            setDisplayValue(value.displayValue);
          }}
          options={options}
          slotsProps={{
            contentEditable: {
              "data-placeholder": "Say something...",
            },
          }}
        />
        <button onClick={() => handleClear()}>Clear</button>
        <button onClick={() => handleDisplayValue("Alice Bob")}>
          Set Display Value
        </button>
        <button onClick={() => setValue("Alice Bob")}>Set Value</button>
      </div>
    </>
  );
}
