import React, { useCallback, useState } from "react";
import {
  MentionInput,
  type MentionData,
  type MentionOption,
} from "../../src/index.js";

/**
 * Deterministic harness page for the Playwright suite in /e2e.
 *
 * Rules for this file:
 *
 * 1. It is a test fixture, not a demo. `App.tsx` is the scratchpad; this file
 *    changes only when a spec needs it to, and changing it means updating the
 *    specs that read it.
 * 2. Every case is wrapped in `<section data-testid="mention-<id>">`. Specs
 *    scope all their locators to that section, so cases never interfere.
 * 3. Every case renders `<pre data-testid="<id>-onchange">` holding
 *    `{"count":n,"data":MentionData|null}`. `count` lets a spec wait for the
 *    *next* onChange rather than racing the current one.
 * 4. Option lists are module-level constants so they are referentially stable —
 *    `options` is a dependency of the reconciliation effect inside
 *    `useMentionInput`, and an inline array would re-run it on every render.
 */

/**
 * The shared option list. Alphabetically stable, and deliberately containing a
 * duplicate label ("Erin") with two distinct values — a case the library
 * currently mishandles in places, so it needs pinning.
 *
 * Query cheat-sheet (labels are matched case-insensitively, substring):
 *   ""    -> Alice, Bob, Charlie, Dave, Erin, Erin   (6)
 *   "a"   -> Alice, Charlie, Dave                    (3)
 *   "al"  -> Alice                                   (1)
 *   "er"  -> Erin, Erin                              (2, the duplicate pair)
 *   "zz"  -> none
 */
export const OPTIONS: MentionOption[] = [
  { label: "Alice", value: "alice" },
  { label: "Bob", value: "bob" },
  { label: "Charlie", value: "charlie" },
  { label: "Dave", value: "dave" },
  { label: "Erin", value: "erin-primary" },
  { label: "Erin", value: "erin-backup" },
];

/**
 * Values where one is a prefix of the other, with no separator between the
 * shared part and the rest. `reconstructFromDataValue` scans for option values
 * by substring, so these collide.
 */
const PREFIX_OPTIONS: MentionOption[] = [
  { label: "Ann", value: "user1" },
  { label: "Anna", value: "user10" },
];

type ChangeLog = { count: number; data: MentionData | null };

const EMPTY_LOG: ChangeLog = { count: 0, data: null };

/**
 * Section chrome shared by every case: a stable testid, an out-of-the-way click
 * target for click-outside tests, and the onChange log.
 *
 * The outside target sits *above* the input on purpose — the modal renders
 * absolutely positioned below the input, so a target placed after it would be
 * covered by the modal and a "click outside" would land on an option instead.
 */
function Case({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: (record: (data: MentionData) => void) => React.ReactNode;
}) {
  const [log, setLog] = useState<ChangeLog>(EMPTY_LOG);

  const record = useCallback((data: MentionData) => {
    setLog((previous) => ({ count: previous.count + 1, data }));
  }, []);

  return (
    <section className="harness-case" data-testid={`mention-${id}`}>
      <h2 className="harness-title">
        {title} <code>{id}</code>
      </h2>
      <div className="harness-outside" data-testid={`${id}-outside`}>
        outside
      </div>
      {children(record)}
      <pre className="harness-log" data-testid={`${id}-onchange`}>
        {JSON.stringify(log)}
      </pre>
    </section>
  );
}

/** `dataValue` as a controlled prop, plus the round-trip and clear controls. */
function ControlledCase({
  id,
  record,
  options = OPTIONS,
  seedDataValue = "",
}: {
  id: string;
  record: (data: MentionData) => void;
  options?: MentionOption[];
  seedDataValue?: string;
}) {
  const [dataValue, setDataValue] = useState("");

  return (
    <>
      <MentionInput
        options={options}
        dataValue={dataValue}
        onChange={(data) => {
          setDataValue(data.dataValue);
          record(data);
        }}
      />
      <div className="harness-controls">
        <button data-testid={`${id}-clear`} onClick={() => setDataValue("")}>
          Clear
        </button>
        <button
          data-testid={`${id}-seed`}
          onClick={() => setDataValue(seedDataValue)}
        >
          Seed
        </button>
      </div>
      <pre className="harness-datavalue" data-testid={`${id}-datavalue`}>
        {dataValue}
      </pre>
    </>
  );
}

/** `displayValue` as a controlled prop. */
function DisplayValueCase({ record }: { record: (data: MentionData) => void }) {
  const [displayValue, setDisplayValue] = useState("");

  return (
    <>
      <MentionInput
        options={OPTIONS}
        displayValue={displayValue}
        onChange={(data) => {
          setDisplayValue(data.displayValue);
          record(data);
        }}
      />
      <div className="harness-controls">
        <button
          data-testid="display-value-clear"
          onClick={() => setDisplayValue("")}
        >
          Clear
        </button>
      </div>
    </>
  );
}

/**
 * An option whose `value` is a function. The call is recorded in the DOM rather
 * than via `alert()`, so a spec can assert it without driving a dialog.
 */
function FunctionValueCase({ record }: { record: (data: MentionData) => void }) {
  const [calls, setCalls] = useState<string[]>([]);

  const [options] = useState<MentionOption[]>(() => [
    ...OPTIONS,
    {
      label: "Send",
      value: () => setCalls((previous) => [...previous, "Send"]),
    },
  ]);

  return (
    <>
      <MentionInput options={options} onChange={record} />
      <pre data-testid="function-value-calls">{JSON.stringify(calls)}</pre>
    </>
  );
}

/** Records every key the `onKeyDown` prop is actually called for. */
function KeyDownCase({ record }: { record: (data: MentionData) => void }) {
  const [keys, setKeys] = useState<string[]>([]);

  return (
    <>
      <MentionInput
        options={OPTIONS}
        onChange={record}
        onKeyDown={(event) => setKeys((previous) => [...previous, event.key])}
      />
      <pre data-testid="custom-keydown-keys">{JSON.stringify(keys)}</pre>
    </>
  );
}

export function E2EHarness() {
  return (
    <main className="harness">
      <h1>mentis e2e harness</h1>

      <Case id="default" title="defaults">
        {(record) => <MentionInput options={OPTIONS} onChange={record} />}
      </Case>

      <Case id="controlled" title="controlled dataValue">
        {(record) => (
          <ControlledCase
            id="controlled"
            record={record}
            seedDataValue="hi erin-primary"
          />
        )}
      </Case>

      <Case id="display-value" title="controlled displayValue">
        {(record) => <DisplayValueCase record={record} />}
      </Case>

      <Case id="no-trigger" title="keepTriggerOnSelect={false}">
        {(record) => (
          <MentionInput
            options={OPTIONS}
            keepTriggerOnSelect={false}
            onChange={record}
          />
        )}
      </Case>

      <Case id="auto-convert" title="autoConvertMentions">
        {(record) => (
          <MentionInput
            options={OPTIONS}
            autoConvertMentions
            keepTriggerOnSelect={false}
            onChange={record}
          />
        )}
      </Case>

      <Case id="custom-trigger" title='trigger="#"'>
        {(record) => (
          <MentionInput options={OPTIONS} trigger="#" onChange={record} />
        )}
      </Case>

      <Case id="multi-char-trigger" title='trigger="::"'>
        {(record) => (
          <MentionInput options={OPTIONS} trigger="::" onChange={record} />
        )}
      </Case>

      <Case id="function-value" title="option with a function value">
        {(record) => <FunctionValueCase record={record} />}
      </Case>

      <Case id="custom-keydown" title="onKeyDown prop">
        {(record) => <KeyDownCase record={record} />}
      </Case>

      <Case id="prefix-values" title="values where one is a prefix of another">
        {(record) => (
          <ControlledCase
            id="prefix-values"
            record={record}
            options={PREFIX_OPTIONS}
            seedDataValue="user10"
          />
        )}
      </Case>

      <Case id="placeholder" title="custom placeholder">
        {(record) => (
          <MentionInput
            options={OPTIONS}
            onChange={record}
            slotsProps={{
              contentEditable: { "data-placeholder": "Say something..." },
            }}
          />
        )}
      </Case>

      <Case id="styled" title="every slot restyled">
        {(record) => (
          <MentionInput
            options={OPTIONS}
            onChange={record}
            slotsProps={{
              container: { className: "harness-container" },
              contentEditable: { className: "harness-input" },
              modal: { className: "harness-modal" },
              option: { className: "harness-option" },
              noOptions: { className: "harness-no-options" },
              highlightedClassName: "harness-option-highlighted",
              chipClassName: "harness-chip",
            }}
          />
        )}
      </Case>
    </main>
  );
}
