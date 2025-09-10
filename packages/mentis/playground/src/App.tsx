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

// TODO: Add type for optionsV2
const optionsV2: any[] = [
  { label: "Alice", value: "1" },
  { label: "Bob", value: "2" },
  { label: "Charlie", value: "3" },
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

  // displayValue = "",
  // dataValue,
  // options,
  // slotsProps,
  // keepTriggerOnSelect = true, REMOVED
  // trigger = "@", DONE
  // autoConvertMentions = false, REMOVED
  // onChange,
  // onKeyDown,

  return (
    <>
      <div style={{ width: "300px", height: "600px", overflowY: "auto" }}>
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
        <MentionInputV2
          value={value}
          options={optionsV2}
          placeholder="Say something..."
          onChange={(value) => {
            console.log("onChange", value);
            setValue(value);
          }}
        />
      </div>
    </>
  );
}
