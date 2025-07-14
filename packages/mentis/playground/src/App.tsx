import React from "react";
import { MentionInput, type MentionOption } from "../../src";

const options: MentionOption[] = [
  { label: "Alice", value: "alice" },
  { label: "Bob", value: "bob" },
  { label: "Charlie", value: "charlie" },
];

export function App() {
  return (
    <>
      <MentionInput options={options} />
    </>
  );
}
