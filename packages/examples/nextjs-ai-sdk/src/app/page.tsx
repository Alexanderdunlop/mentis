"use client";

import { useChat } from "@ai-sdk/react";
import { MentionInput, MentionOption } from "mentis";
import "mentis/dist/index.css";

const options: MentionOption[] = [
  {
    label: "Translate to 🇪🇸",
    value: "translate-to-spanish",
  },
  {
    label: "Create a 🎭",
    value: "create-story-about",
  },
];

export default function Chat() {
  const { messages, input, setInput, append } = useChat();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      append({ role: "user", content: input });
      setInput("");
    }
  };

  return (
    <div className="flex flex-col w-full max-w-lg py-24 mx-auto stretch">
      {messages.map((message) => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === "user" ? "User: " : "AI: "}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
            }
          })}
        </div>
      ))}

      <MentionInput
        slotsProps={{
          container: {
            className: "fixed bottom-0 w-full mb-8 max-w-md",
          },
          modal: {
            className: "max-w-md",
          },
          contentEditable: {
            "data-placeholder":
              "Type @ to see AI commands, then say something...",
          },
        }}
        options={options}
        value={input}
        onChange={(e) => setInput(e.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
