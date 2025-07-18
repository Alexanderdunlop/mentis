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
- 📱 **Flexible Triggers** - Customizable trigger characters
- 🎪 **Rich Text Support** - Display mentions as styled chips

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
      defaultValue={value}
      onChange={setValue}
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
      onChange={(value) => console.log(value)}
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

## API Reference

### MentionInput Props

| Prop                  | Type                      | Default | Description                                           |
| --------------------- | ------------------------- | ------- | ----------------------------------------------------- |
| `options`             | `MentionOption[]`         | -       | Array of mention options                              |
| `defaultValue`        | `string`                  | `""`    | Initial value of the input                            |
| `onChange`            | `(value: string) => void` | -       | Callback when value changes                           |
| `trigger`             | `string`                  | `"@"`   | Character(s) that trigger the mention dropdown        |
| `keepTriggerOnSelect` | `boolean`                 | `true`  | Whether to keep the trigger character after selection |
| `autoConvertMentions` | `boolean`                 | `false` | Automatically convert mentions to chips               |
| `slotsProps`          | `SlotProps`               | -       | Customization props for different parts               |

### MentionOption

```tsx
type MentionOption = {
  label: string; // Display text
  value: string; // Unique identifier
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
};
```

## Keyboard Navigation

- **Arrow Keys**: Navigate through mention options
- **Enter**: Select highlighted option
- **Escape**: Close mention dropdown
- **Tab**: Navigate through options and select
- **Backspace**: Navigate into mention chips

## License

MIT © [Alexander Dunlop](https://github.com/alexanderdunlop)
