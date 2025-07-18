"use client";

import { MentionInput } from "mentis";
import { DemoContainer } from "./DemoContainer";

export function MentisAlertDemoClient() {
  return (
    <DemoContainer>
      <MentionInput
        options={[
          { label: "Alice", value: "alice" },
          { label: "Bob", value: "bob" },
          { label: "Charlie", value: "charlie" },
        ]}
        slotsProps={{
          container: { className: "w-full max-w-lg relative" },
          contentEditable: {
            className:
              "w-full text-left rounded-xl border border-gray-300 bg-white px-4 py-3 text-base shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition placeholder-gray-400",
          },
          listbox: {
            className:
              "z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto",
          },
          option: {
            className:
              "px-4 py-2 cursor-pointer text-base text-gray-800 hover:bg-gray-100 rounded-lg transition",
          },
          highlightedClassName: "bg-blue-500 text-white hover:bg-blue-500",
          noOptions: { className: "px-4 py-2 text-gray-400" },
        }}
        onChange={(value: string) => alert(value)}
      />
    </DemoContainer>
  );
}
