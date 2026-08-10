# mentis

## 0.2.8

### Patch Changes

- [#90](https://github.com/Alexanderdunlop/mentis/pull/90) [`edad732`](https://github.com/Alexanderdunlop/mentis/commit/edad7325254f91df78bd0d6a321cfc419c08d92c) Thanks [@Alexanderdunlop](https://github.com/Alexanderdunlop)! - Rewrite the npm package description and keywords so the package is discoverable as a maintained `react-mentions` alternative. No runtime changes — a release is needed for the new metadata to reach the npm registry.

## 0.2.7

### Patch Changes

- [#75](https://github.com/Alexanderdunlop/mentis/pull/75) [`5b8fc20`](https://github.com/Alexanderdunlop/mentis/commit/5b8fc20d2991d7da49ece65d02f3a2e099a2c44a) Thanks [@Alexanderdunlop](https://github.com/Alexanderdunlop)! - Fix mention extraction dropping nested content, and insert Enter newlines without `document.execCommand`.

  `extractMentionData` only walked the editor's direct children, so text and mention chips wrapped in another element were dropped, and the empty `<div>` contentEditable inserts for Enter never registered as a newline. The walk now recurses into any element that is not a mention chip.

  Pressing Enter no longer calls `document.execCommand` directly. It is used where available, with a Range-based `<br>` insertion as a fallback.

Releases up to and including `v0.2.6` are documented in the
[GitHub releases](https://github.com/alexanderdunlop/mentis/releases).
Everything from the next version onwards is recorded below.
