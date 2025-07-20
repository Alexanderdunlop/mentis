import React, { useState } from "react";
import {
  MentionInput,
  type MentionOption,
  type MentionData,
} from "../../dist/index.js";
import "../../dist/index.css";
import "./style.css";

const options: MentionOption[] = [
  { label: "Alice", value: "1" },
  { label: "Bob", value: "2" },
  { label: "Charlie", value: "3" },
];

export function App() {
  const [mentionData, setMentionData] = useState<MentionData | null>(null);

  const handleChange = (newValue: MentionData) => {
    setMentionData(newValue);
  };

  return (
    <>
      <div style={{ width: "300px", height: "200px", overflowY: "auto" }}>
        <MentionInput
          // keepTriggerOnSelect={false}
          autoConvertMentions={true}
          defaultValue={""}
          options={options}
          onChange={handleChange}
          slotsProps={{
            chipClassName: "custom-chip",
          }}
        />
      </div>
      <div style={{ marginTop: "20px" }}>
        <h3>Display Text:</h3>
        {mentionData && (
          <>
            <h3>Display Text:</h3>
            <p>{mentionData.displayText}</p>
            <h3>Raw Text:</h3>
            <p>{mentionData.rawText}</p>
            <h3>Mentions Data:</h3>
            <pre>{JSON.stringify(mentionData.mentions, null, 2)}</pre>
          </>
        )}
      </div>
    </>
  );
}
