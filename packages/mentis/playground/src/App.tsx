import React, { useState } from "react";
import { MentionInput, type MentionOption } from "../../src";

const options: MentionOption[] = [
  { label: "Alice", value: "alice" },
  { label: "Bob", value: "bob" },
  { label: "Charlie", value: "charlie" },
];

export function App() {
  const [value, setValue] = useState<string>("");
  return (
    <>
      <div style={{ width: "300px", height: "200px", overflowY: "auto" }}>
        <MentionInput
          keepTriggerOnSelect
          defaultValue={value}
          options={options}
          onChange={setValue}
        />
      </div>
      {/* {value} */}
    </>
  );
}
