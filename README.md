<p align="center">
  <img src="logo.png" width="200px" align="center" alt="Mentis logo" />
  <h1 align="center">Mentis</h1>
  <p align="center">
    A small, fast, and flexible mention input solution for React.
    <br/>
    by <a href="https://x.com/alexdunlop_">@alexdunlop_</a>
  </p>
</p>
<br/>

<p align="center">
<a href="https://opensource.org/licenses/MIT" rel="nofollow"><img src="https://img.shields.io/github/license/alexanderdunlop/mentis" alt="License"></a>
<a href="https://www.npmjs.com/package/mentis" rel="nofollow"><img src="https://img.shields.io/npm/dw/mentis.svg" alt="npm"></a>
<a href="https://github.com/alexanderdunlop/mentis" rel="nofollow"><img src="https://img.shields.io/github/stars/alexanderdunlop/mentis" alt="stars"></a>
</p>

### [Read the docs →](https://mentis.alexdunlop.com/)

<br/>
<br/>

## What is Mentis?

Mentis is a small, fast, and flexible mention input solution for React.

```tsx
import { MentionInput } from "mentis";

function App() {
  const [value, setValue] = useState<string>("");
  return (
    <MentionInput
      defaultValue={value}
      onChange={setValue}
      options={[
        { label: "Alice", value: "alice" },
        { label: "Bob", value: "bob" },
        { label: "Charlie", value: "charlie" },
      ]}
    />
  );
}
```

<br/>

## Features

- Zero external dependencies
- Works with React
- Works with TypeScript
- Flexible
- Small
- Fast

<br/>

## Installation

```sh
npm install mentis
```
