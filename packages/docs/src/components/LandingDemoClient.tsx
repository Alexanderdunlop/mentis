"use client";

import { MentionInput } from "mentis";
import "mentis/dist/index.css";

export const LandingDemoClient = () => {
  return (
    <MentionInput
      options={[
        { label: "React.js", value: "reactjs" },
        { label: "TypeScript", value: "typescript" },
        { label: "Node.js", value: "nodejs" },
      ]}
      slotsProps={{
        container: { className: "w-full max-w-lg relative" },
        contentEditable: {
          className:
            "w-full text-left rounded-xl border border-gray-300 bg-white px-4 py-3 text-base shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition placeholder-gray-400",
        },
        modal: {
          className:
            "absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto",
        },
        option: {
          className:
            "px-4 py-2 cursor-pointer text-left text-base text-gray-800 hover:bg-gray-100 hover:text-black rounded-lg transition",
        },
        chipClassName:
          "inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors",
        highlightedClassName: "bg-blue-500 text-white hover:bg-blue-500",
        noOptions: { className: "px-4 py-2 text-gray-400" },
      }}
    />
  );
};
