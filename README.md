<div align="center">
  <img src="https://mentis.alexdunlop.com/_next/image?url=%2Flogo%2Flogo.png&w=256&q=75" width="200" alt="Mentis" />
  <h1>Mentis</h1>
  <p>
    <strong>Accessible <code>@mention</code> autocomplete input for React.</strong>
    <br />
    ContentEditable, zero dependencies, TypeScript-first.
  </p>
  <p>
    <a href="https://mentis.alexdunlop.com/"><strong>📖 Read the docs »</strong></a>
    &nbsp;·&nbsp;
    <a href="https://mentis.alexdunlop.com/"><strong>▶️ Live demo »</strong></a>
  </p>
</div>

<div align="center">
  <a href="https://www.npmjs.com/package/mentis">
    <img src="https://img.shields.io/npm/v/mentis.svg" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/mentis">
    <img src="https://img.shields.io/npm/dw/mentis.svg" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/mentis">
    <img src="https://img.shields.io/bundlephobia/minzip/mentis.svg" alt="bundle size" />
  </a>
  <a href="https://github.com/alexanderdunlop/mentis" rel="nofollow">
    <img src="https://img.shields.io/github/stars/alexanderdunlop/mentis" alt="stars" />
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/github/license/alexanderdunlop/mentis.svg" alt="license" />
  </a>
</div>

<br />

**Mentis** adds Slack- and Notion-style `@mention` autocomplete to a React app. You give it a list of options, it gives you an input where typing `@` opens a filtered dropdown and picking someone inserts a styled chip. `onChange` hands back both what the user sees (`displayValue`) and the clean IDs you want to store (`dataValue`), so you never have to parse mention syntax yourself.

It's built on `contentEditable` rather than a plain `<textarea>`, which is what makes real chips, caret navigation through mentions, and paste handling possible. It ships with full ARIA `combobox` semantics, TypeScript types, and no runtime dependencies.

## Why Mentis?

[`react-mentions`](https://www.npmjs.com/package/react-mentions) has been the default choice for years, but its last release was 4.4.10 in June 2023, its GitHub repository now returns a 404, and it's built on a `<textarea>` + overlay approach that can't render true chips. Mentis is a maintained, modern alternative:

|                              | Mentis                        | react-mentions          |
| ---------------------------- | ----------------------------- | ----------------------- |
| Last release                 | Actively maintained           | June 2023               |
| Issue tracker                | ✅ Open                       | ❌ Repository 404s      |
| Foundation                   | `contentEditable`             | `<textarea>` + overlay  |
| Mentions render as chips     | ✅ Real DOM elements          | ❌ Styled text overlay  |
| Runtime dependencies         | ✅ Zero                       | `substyle`, others      |
| TypeScript types             | ✅ Built in                   | `@types/react-mentions` |
| ARIA combobox / screenreader | ✅ Full                       | Partial                 |
| React 19 support             | ✅                            | Unmaintained            |
| Separate display / data       | ✅ `displayValue`/`dataValue` | Manual markup parsing   |

If you're searching for a **react-mentions alternative**, a **React mentions input**, an **@mention autocomplete**, or a **tagging / typeahead input** — that's what this is.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Examples](#examples)
- [API Reference](#api-reference)
- [Keyboard Navigation](#keyboard-navigation)
- [Advanced Features](#advanced-features)
- [FAQ](#faq)
- [For AI assistants and LLMs](#for-ai-assistants-and-llms)

## Features

- 🎯 **ContentEditable Architecture** - Modern implementation with rich text support
- 🧠 **Smart Mention Detection** - DOM-aware detection that distinguishes mentions from regular text
- ⚡ **Zero Dependencies** - Lightweight with no external dependencies
- ♿ **Fully Accessible** - Complete ARIA roles and keyboard navigation
- 🎨 **Highly Customizable** - Slot-based customization system
- 🔧 **TypeScript Support** - Full type safety out of the box
- 📱 **Flexible Triggers** - Customizable trigger characters or strings
- 🎪 **Rich Text Support** - Display mentions as styled chips
- 🚀 **Function Values** - Support for executable functions as option values
- 📋 **Advanced Paste Handling** - Intelligent mention parsing from pasted content
- 🔄 **Auto-Conversion** - Optional automatic conversion of text mentions to chips
- ⌨️ **Custom Keyboard Handling** - Support for custom keyboard events and form submission
- 💾 **Data Value Support** - Programmatic mention reconstruction from data values

## Quick Start

```bash
npm install mentis
```

```tsx
import { MentionInput } from "mentis";
import "mentis/dist/index.css";

function App() {
  const [dataValue, setDataValue] = useState("");

  return (
    <MentionInput
      dataValue={dataValue}
      onChange={(mentionData) => {
        setDataValue(mentionData.dataValue);
      }}
      options={[
        { label: "Alice Johnson", value: "alice" },
        { label: "Bob Smith", value: "bob" },
        { label: "Charlie Brown", value: "charlie" },
      ]}
    />
  );
}
```

## Examples

### Basic Usage

```tsx
import { MentionInput } from "mentis";

function BasicExample() {
  return (
    <MentionInput
      options={[
        { label: "Alice Johnson", value: "alice" },
        { label: "Bob Smith", value: "bob" },
        { label: "Charlie Brown", value: "charlie" },
      ]}
      onChange={(mentionData) => console.log(mentionData)}
    />
  );
}
```

### Function Values

```tsx
import { MentionInput } from "mentis";

function FunctionValueExample() {
  const [displayValue, setDisplayValue] = useState("");

  return (
    <MentionInput
      displayValue={displayValue}
      options={[
        { label: "Send Message", value: () => console.log("Message sent!") },
        { label: "Clear Input", value: () => setDisplayValue("") },
        { label: "Alice Johnson", value: "alice" },
      ]}
      onChange={(mentionData) => setDisplayValue(mentionData.displayValue)}
    />
  );
}
```

### Custom Styling with Tailwind

```tsx
import { MentionInput } from "mentis";

function StyledExample() {
  return (
    <MentionInput
      options={options}
      slotsProps={{
        container: {
          className: "w-full max-w-lg relative",
        },
        contentEditable: {
          className:
            "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition placeholder-gray-400",
        },
        modal: {
          className:
            "absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto",
        },
        option: {
          className:
            "px-4 py-2 cursor-pointer text-base text-gray-800 hover:bg-gray-100 hover:text-black rounded-lg transition",
        },
        highlightedClassName: "bg-blue-500 text-white hover:bg-blue-500",
        chipClassName: "bg-blue-500 text-white hover:bg-blue-500",
      }}
    />
  );
}
```

### Custom Trigger Character

```tsx
import { MentionInput } from "mentis";

function CustomTriggerExample() {
  return (
    <MentionInput
      trigger="#"
      options={[
        { label: "React", value: "react" },
        { label: "TypeScript", value: "typescript" },
        { label: "JavaScript", value: "javascript" },
      ]}
    />
  );
}
```

### Auto-Convert Mentions

```tsx
import { MentionInput } from "mentis";

function AutoConvertExample() {
  return (
    <MentionInput
      autoConvertMentions={true}
      keepTriggerOnSelect={false}
      options={[
        { label: "Alice Johnson", value: "alice" },
        { label: "Bob Smith", value: "bob" },
      ]}
    />
  );
}
```

### Form Submission with Enter Key

```tsx
import { MentionInput } from "mentis";

function FormSubmissionExample() {
  const [displayValue, setDisplayValue] = useState("");

  const handleSubmit = () => {
    console.log("Submitting:", displayValue);
    setDisplayValue("");
  };

  return (
    <MentionInput
      displayValue={displayValue}
      onChange={(mentionData) => setDisplayValue(mentionData.displayValue)}
      onKeyDown={(event) => {
        // Handle Enter key for form submission
        if (event.key === "Enter") {
          event.preventDefault();
          handleSubmit();
        }
      }}
      options={[
        { label: "Alice Johnson", value: "alice" },
        { label: "Bob Smith", value: "bob" },
      ]}
    />
  );
}
```

### Custom Keyboard Shortcuts

```tsx
import { MentionInput } from "mentis";

function KeyboardShortcutsExample() {
  return (
    <MentionInput
      onKeyDown={(event) => {
        // Ctrl/Cmd + Enter to submit
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          handleSubmit();
        }

        // Ctrl/Cmd + S to save
        if ((event.ctrlKey || event.metaKey) && event.key === "s") {
          event.preventDefault();
          saveContent();
        }
      }}
      options={options}
    />
  );
}
```

## API Reference

### MentionInput Props

| Prop                  | Type                             | Default | Description                                           |
| --------------------- | -------------------------------- | ------- | ----------------------------------------------------- |
| `options`             | `MentionOption[]`                | -       | Array of mention options                              |
| `displayValue`        | `string`                         | `""`    | Current display value of the input (what user sees)   |
| `dataValue`           | `string`                         | -       | Data value for programmatic control (mention IDs)     |
| `onChange`            | `(value: MentionData) => void`   | -       | Callback when value changes with mention data         |
| `trigger`             | `string`                         | `"@"`   | Character(s) that trigger the mention dropdown        |
| `keepTriggerOnSelect` | `boolean`                        | `true`  | Whether to keep the trigger character after selection |
| `autoConvertMentions` | `boolean`                        | `false` | Automatically convert mentions to chips               |
| `onKeyDown`           | `(event: KeyboardEvent) => void` | -       | Custom keyboard event handler                         |
| `slotsProps`          | `SlotProps`                      | -       | Customization props for different parts               |

### MentionOption

```tsx
type MentionOption = {
  label: string; // Display text
  value: string | Function; // Unique identifier or executable function
};
```

### MentionData

```tsx
type MentionData = {
  displayValue: string; // Text as displayed to user (with mention labels)
  dataValue: string; // Text with mention values (actual data)
  mentions: Array<{
    label: string; // Display text of the mention
    value: string; // Unique identifier of the mention
    startIndex: number; // Start position in the text
    endIndex: number; // End position in the text
  }>;
};
```

### SlotProps

```tsx
type SlotProps = {
  container?: React.HTMLAttributes<HTMLDivElement>;
  contentEditable?: ContentEditableInputCustomProps;
  modal?: ModalProps;
  option?: OptionProps;
  noOptions?: React.HTMLAttributes<HTMLDivElement>;
  highlightedClassName?: string;
  chipClassName?: string;
};
```

## Keyboard Navigation

- **Arrow Keys**: Navigate through mention options
- **Enter**: Select highlighted option
- **Escape**: Close mention dropdown
- **Tab**: Navigate through options and select
- **Backspace**: Navigate into mention chips

### Custom Keyboard Handling

The `onKeyDown` prop allows you to handle custom keyboard events:

- **Form Submission**: Handle Enter key for form submission when the modal is closed
- **Keyboard Shortcuts**: Implement custom shortcuts like Ctrl+S for save
- **Event Handling**: The component's internal handling (navigation, selection) takes precedence over custom handlers

**Note**: When the mention modal is open, Enter, Tab, Escape, and arrow keys are handled internally for navigation and selection.

## Advanced Features

### DataValue Control

The `dataValue` prop enables powerful programmatic control over mention content:

- **Setting Content**: Pass `dataValue="alice bob"` to programmatically load mentions
- **Clean Data Extraction**: `onChange` provides clean data values (IDs) separate from display text
- **Mention Reconstruction**: Automatically converts data values back to visual mentions
- **AI Integration**: Perfect for sending clean data to APIs while showing rich UI to users
- **Editing Support**: Load existing content with mentions for editing workflows

```tsx
// Set mentions programmatically
setDataValue("user-123 user-456"); // Shows "@John Doe @Jane Smith"

// Get clean data for APIs
onChange={(data) => {
  console.log(data.displayValue); // "@John Doe hello @Jane Smith"
  console.log(data.dataValue);    // "user-123 hello user-456"
  sendToAPI(data.dataValue);      // Send clean data to backend
}}
```

### Function Values

Options can have function values that execute when selected, useful for actions like sending messages or clearing input.

### Auto-Conversion

When `autoConvertMentions` is enabled, the component automatically converts text mentions to chips when users type space or press Enter.

### Paste Handling

The component intelligently parses mentions from pasted content, converting them to chips automatically.

### Rich Text Support

Mentions are displayed as styled chips within the contentEditable interface, providing a rich text experience.

## FAQ

### How do I add @mentions to a React app?

Install `mentis`, import `MentionInput` and its stylesheet, and pass an `options` array. Typing `@` opens the dropdown. See [Quick Start](#quick-start).

### Is this a drop-in replacement for react-mentions?

Not literally — the prop API is different (`options` instead of `<Mention data={...} />` children, and `displayValue`/`dataValue` instead of a single markup string). But it covers the same use cases with less setup, and you don't have to parse `@[name](id)` markup yourself. See [Why Mentis?](#why-mentis).

### Can I use a trigger other than `@`?

Yes. Pass `trigger="#"` (or any string) to change it. Useful for hashtags, slash commands, or `$` for entities.

### Does it work with Next.js and React Server Components?

Yes. `MentionInput` is a client component, so import it from a file with `"use client"` (or a component that already has it). There's a [Next.js example](https://github.com/Alexanderdunlop/mentis/tree/main/packages/examples/nextjs).

### Can I style it with Tailwind?

Yes. Every part is styled via `slotsProps` — pass Tailwind classes to `container`, `contentEditable`, `modal`, `option`, `chipClassName`, and `highlightedClassName`. See [Custom Styling with Tailwind](#custom-styling-with-tailwind).

### How do I store mentions in a database?

Use `dataValue` from `onChange` — it contains your option IDs instead of display labels. Store that, then pass it back as the `dataValue` prop later to rehydrate the input with chips. See [DataValue Control](#datavalue-control).

### Does it support TypeScript?

Yes, types ship in the package — no `@types/*` install needed. `MentionInputProps`, `MentionOption`, `MentionData`, and `SlotProps` are all exported.

### Is it accessible?

Yes. It implements the ARIA `combobox`/`listbox`/`option` pattern with full keyboard navigation and screen reader support. See [Accessibility](https://mentis.alexdunlop.com/docs/accessibility).

### How big is it?

Zero runtime dependencies, and React is a peer dependency. See the [bundle size badge](https://bundlephobia.com/package/mentis) for the current number.

### Does it support multiple mention types in one input?

A single `MentionInput` has one `trigger`, but `options` can mix entity kinds, and option values can be functions to trigger actions instead of inserting a chip. See [Function Values](#function-values).

## For AI assistants and LLMs

If you're an AI coding assistant, or you're pointing one at this library, these are the machine-readable entry points:

- [`/llms.txt`](https://mentis.alexdunlop.com/llms.txt) — index of every documentation page
- [`/llms-full.txt`](https://mentis.alexdunlop.com/llms-full.txt) — the full documentation as a single plaintext file
- [LLM Context page](https://mentis.alexdunlop.com/docs/llm) — architecture, types, and implementation notes

The two props most often got wrong: the controlled value props are `displayValue` (what the user sees, with labels) and `dataValue` (IDs for storage). There is no plain `value` prop.

## Examples Directory

Explore complete examples in the following directories:

- [simple](https://github.com/Alexanderdunlop/mentis/tree/main/packages/examples/simple)
- [styling](https://github.com/Alexanderdunlop/mentis/tree/main/packages/examples/styling)
- [tailwind](https://github.com/Alexanderdunlop/mentis/tree/main/packages/examples/tailwind)
- [nextjs](https://github.com/Alexanderdunlop/mentis/tree/main/packages/examples/nextjs)

## License

MIT © [Alexander Dunlop](https://github.com/alexanderdunlop)
