"use client";

import { MentionInput } from "mentis";
import { useState } from "react";
import { DemoContainer } from "./DemoContainer";

export function BasicUsageDemo() {
  const [value, setValue] = useState("");
  return (
    <DemoContainer demoKey="basic-usage">
      <MentionInput
        defaultValue={value}
        options={[
          { label: "Alice", value: "alice" },
          { label: "Bob", value: "bob" },
          { label: "Charlie", value: "charlie" },
        ]}
        onChange={(value) => setValue(value)}
      />
    </DemoContainer>
  );
}
