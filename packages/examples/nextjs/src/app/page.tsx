"use client";

import { useState } from "react";
import { MentionInput, type MentionOption } from "mentis";
import "mentis/dist/index.css";

const options: MentionOption[] = [
  {
    label: "John Doe",
    value: "john-doe",
  },
  {
    label: "Jane Doe",
    value: "jane-doe",
  },
  {
    label: "John Smith",
    value: "john-smith",
  },
];

export default function Home() {
  const [value, setValue] = useState("");
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <MentionInput
          options={options}
          value={value}
          onChange={(value) => setValue(value.value)}
        />
      </main>
    </div>
  );
}
