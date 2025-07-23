<div align="center">
  <img src="https://mentis.alexdunlop.com/_next/image?url=%2Flogo%2Flogo.png&w=256&q=75" width="200" alt="Mentis" />
  <h1>Mentis</h1>
  <p>
    <strong>A flexible mention tagger for React that hooks into your existing inputs.</strong>
  </p>
  <p>
    <a href="https://mentis.alexdunlop.com/"><strong>📖 Read the docs »</strong></a>
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

## Quick Start

```bash
npm install mentis
```

```tsx
import { MentionInput } from "mentis";
import "mentis/dist/index.css";

function App() {
  const [value, setValue] = useState("");

  return (
    <MentionInput
      value={value}
      onChange={(mentionData) => {
        setValue(mentionData.value);
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
  return (
    <MentionInput
      options={[
        { label: "Send Message", value: () => console.log("Message sent!") },
        { label: "Clear Input", value: () => setValue("") },
        { label: "Alice Johnson", value: "alice" },
      ]}
      onChange={(mentionData) => console.log(mentionData)}
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
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    console.log("Submitting:", value);
    setValue("");
  };

  return (
    <MentionInput
      value={value}
      onChange={(mentionData) => setValue(mentionData.value)}
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
| `value`               | `string`                         | `""`    | Current value of the input                            |
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
  value: string; // Text as displayed to user (with mention labels)
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

### Function Values

Options can have function values that execute when selected, useful for actions like sending messages or clearing input.

### Auto-Conversion

When `autoConvertMentions` is enabled, the component automatically converts text mentions to chips when users type space or press Enter.

### Paste Handling

The component intelligently parses mentions from pasted content, converting them to chips automatically.

### Rich Text Support

Mentions are displayed as styled chips within the contentEditable interface, providing a rich text experience.

## Examples Directory

Explore complete examples in the following directories:

- [simple](https://github.com/Alexanderdunlop/mentis/tree/main/packages/examples/simple)
- [styling](https://github.com/Alexanderdunlop/mentis/tree/main/packages/examples/styling)
- [tailwind](https://github.com/Alexanderdunlop/mentis/tree/main/packages/examples/tailwind)
- [nextjs](https://github.com/Alexanderdunlop/mentis/tree/main/packages/examples/nextjs)

## License

MIT © [Alexander Dunlop](https://github.com/alexanderdunlop)
