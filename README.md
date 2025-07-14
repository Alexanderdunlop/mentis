# mentis

[![NPM](https://img.shields.io/npm/v/mentis?color=red)](https://www.npmjs.com/package/mentis)
[![MIT License](https://img.shields.io/github/license/alexanderdunlop/mentis.svg?color=blue)](https://github.com/alexanderdunlop/mentis/blob/main/LICENSE)

A flexible mention tagger for React that hooks into your existing inputs.

## Features

- 🎯 **Hooks into existing inputs**: Works with any text input, textarea, or rich text editor
- 🎨 **Fully customizable**: Bring your own menu, styling, and mention components
- ⚡️ **Smart positioning**: Automatically positions mention menus relative to cursor
- 🔍 **Flexible triggers**: Support for `@`, `#`, `/` or custom trigger characters
- 📝 **Rich metadata**: Attach custom data to mentions (IDs, avatars, roles, etc.)
- 🌐 **Framework agnostic**: Works with React, Next.js, Remix, and any React setup
- 🎛️ **Cursor-style UX**: Familiar mention experience like modern editors

## Documentation

Read the complete documentation at [mentis.dev](https://mentis.dev).

## Installation

```bash
npm install mentis
```

```bash
yarn add mentis
```

```bash
pnpm add mentis
```

## Usage

```tsx
import { useMentis } from "mentis";

function MyInput() {
  const { inputProps, menuProps, isOpen, mentions } = useMentis({
    triggers: ["@"],
    onSearch: (query) => searchUsers(query),
    onSelect: (user) => ({ id: user.id, display: user.name }),
  });

  return (
    <div>
      <input {...inputProps} placeholder="Type @ to mention someone" />
      {isOpen && (
        <div {...menuProps}>
          {mentions.map((user) => (
            <div key={user.id} onClick={() => menuProps.onSelect(user)}>
              {user.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Why mentis?

Unlike libraries that replace your input component, `mentis` enhances your existing inputs by:

- Preserving your input's styling, validation, and behavior
- Working with controlled and uncontrolled components
- Supporting complex text editors and rich text inputs
- Giving you complete control over the mention UI and data

## License

MIT

Made with ❤️ by Alexander Dunlop
