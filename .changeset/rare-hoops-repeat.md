---
"mentis": patch
---

Fix mention extraction dropping nested content, and insert Enter newlines without `document.execCommand`.

`extractMentionData` only walked the editor's direct children, so text and mention chips wrapped in another element were dropped, and the empty `<div>` contentEditable inserts for Enter never registered as a newline. The walk now recurses into any element that is not a mention chip.

Pressing Enter no longer calls `document.execCommand` directly. It is used where available, with a Range-based `<br>` insertion as a fallback.
