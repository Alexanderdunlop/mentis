"use client";

import { useChat } from "@ai-sdk/react";
import { MentionInput } from "mentis";
import "mentis/dist/index.css";

export default function Chat() {
  const { messages, input, setInput, append } = useChat();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    append({ role: "user", content: input });
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
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

      <form onSubmit={handleSubmit}>
        <MentionInput
          slotsProps={{
            container: {
              className: "fixed bottom-0 w-full mb-8 max-w-md",
            },
            contentEditable: {
              // "data-placeholder": "Say something...",
            },
          }}
          options={[
            {
              label: "John Doe",
              value: "john-doe",
            },
          ]}
          // defaultValue={input}
          onChange={(e) => setInput(e.rawText)}
          // placeholder="Say something..."
        />
      </form>
    </div>
  );
}
