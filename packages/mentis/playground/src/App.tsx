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
      {value}
      <MentionInput
        defaultValue={value}
        options={options}
        onChange={setValue}
      />
    </>
  );
}
