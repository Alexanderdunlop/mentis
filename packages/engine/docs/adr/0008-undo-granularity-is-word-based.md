# 0008 — Undo granularity follows words, not typing speed

- **Status:** accepted
- **Date:** 2026-08-06
- **Supersedes the coalescing rule introduced with** [0007](0007-the-engine-owns-the-undo-shortcut.md)

## Context

M3's first coalescing rule joined an edit to the previous undo entry when the kind
matched, it was adjacent, and it arrived **within 600ms of the last keystroke**.

Found immediately on testing the harness: typing `A l e x` and pressing ⌘Z removed only
some of the letters. The cause is the 600ms rule. Ordinary typing pauses exceed it
constantly — reaching for a capital, thinking mid-word — so the same four keystrokes give
one undo step typed quickly and `Al` + `ex` typed with a hesitation.

Two things are wrong with that, and the second is worse than the first:

1. **It's unpredictable.** The user cannot tell how many undo steps their typing produced,
   because the answer depends on their own rhythm.
2. **It isn't reproducible.** Undo behaviour becomes a function of machine timing, so a
   Playwright assertion about undo would be flaky by construction. A rule that cannot be
   tested is a rule that will drift.

## Decision

**Word boundaries are the primary rule.** Whitespace closes a typing group, attaching to
the word it follows, so the next word begins a fresh undo step. Undo is therefore a
function of *what* was typed, not of *how fast*.

Timing survives only as a genuine idle signal: `maxIdleMs` rises from **600ms to 3s**. That
is long enough never to fire mid-word and short enough to notice someone walking away and
coming back.

Two guards remain:

- `maxGroupSize` of 80 positions, so a single undo cannot swallow a paragraph of
  unbroken text.
- A newline is always its own step, so undo stops at the start of a line.

Deletion runs still group whole, matching what backspace-and-hold does natively.
`isWhitespace` moved from `query/` to `model/`, since both the query layer and the
history layer now classify document characters.

## Alternatives considered

**Per-keystroke timing, tuned.** Raising 600ms to 1.5s or 2s makes the symptom rarer
without removing it — the behaviour still depends on typing speed, and the tests are still
timing-dependent. Rejected: it trades a visible bug for an intermittent one.

**One undo step per character.** Predictable and trivially testable, and genuinely how
some editors behave. Rejected as tedious: undoing a sentence should not need forty
keystrokes.

**Timing from the start of the group rather than between keystrokes** — cap a group at, say,
2s of elapsed time. Still speed-dependent, just differently: a fast typist gets larger
groups than a slow one for identical text. Rejected for the same reason.

## Consequences

Good:

- The same keystrokes always produce the same undo steps. Asserted directly by a test that
  types the same string at 30ms and 900ms per character and requires the grouping to
  match.
- Undo granularity now matches what users expect from native text fields: roughly a word
  at a time.
- Playwright can assert undo behaviour without timing flakiness, which matters for the
  regression suite.

Costs and risks:

- Punctuation is not a boundary, so `don't,really` groups as one word-ish run. Acceptable
  for now; the fix if it ever grates is to treat non-alphanumerics as boundaries too.
- Deletion runs don't use the word rule, so holding backspace through a sentence is one
  undo step. That matches native behaviour, but it is an asymmetry worth knowing about.
- **Unverified in a real browser.** The rule is tested at the model level; whether it
  *feels* right is exactly the judgement the harness exists for.

## Revisit when

- Punctuation grouping grates in real use, **or**
- deletion runs turn out to want word boundaries too, at which point `editShapeOf` needs
  the deleted text — which it currently does not capture, since a delete step is only a
  range.
