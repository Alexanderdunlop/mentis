# mentis

[![Version](https://img.shields.io/npm/v/mentis?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/mentis)
[![Downloads](https://img.shields.io/npm/dt/mentis.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/mentis)
[![MIT License](https://img.shields.io/github/license/alexanderdunlop/mentis.svg?style=flat&colorA=000000&colorB=000000)](https://github.com/alexanderdunlop/mentis/blob/main/LICENSE)

A small, fast, and flexible mention input solution for React.

"mentis" means: of sound mind, memory, and understanding. The goal is to provide a solution that gets mentioning right.

```bash
npm install mentis
```

:warning: This readme is currently written for TypeScript users.

## First create a mention input

Your input is a component! You can put options in it. When you call the trigger character, the options will be shown. When selecting an option, the input will be updated with the selected value.

```tsx
import { MentionInput } from "mentis";

function App() {
  const [value, setValue] = useState<string>("");
  return (
    <MentionInput
      defaultValue={value}
      options={[
        { label: "Alice", value: "alice" },
        { label: "Bob", value: "bob" },
        { label: "Charlie", value: "charlie" },
      ]}
      onChange={setValue}
    />
  );
}
```

### Why mentis over react-mentions?

- Simple
- More recently maintained
