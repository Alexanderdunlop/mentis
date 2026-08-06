import {
  test as base,
  expect,
  type Locator,
  type Page,
} from "@playwright/test";

/**
 * Page object + fixtures for the mentis e2e suite.
 *
 * Everything a spec needs should be reachable from here. If a spec starts
 * reaching into `page.evaluate` on its own, that is a signal a helper is
 * missing — add it here instead, so the next spec gets it for free.
 *
 * See e2e/README.md for the layering rules.
 */

/**
 * The cases rendered by `packages/mentis/playground/src/E2EHarness.tsx`.
 * Typed as a union so a typo is a compile error rather than a timeout.
 */
export type CaseId =
  | "default"
  | "controlled"
  | "display-value"
  | "no-trigger"
  | "auto-convert"
  | "custom-trigger"
  | "multi-char-trigger"
  | "function-value"
  | "custom-keydown"
  | "prefix-values"
  | "placeholder"
  | "styled";

/** The shared option list rendered by every case except `prefix-values`. */
export const OPTION_LABELS = [
  "Alice",
  "Bob",
  "Charlie",
  "Dave",
  "Erin",
  "Erin",
] as const;

/** Chips are identified by their data attributes, not their class — the class is
 * configurable via `slotsProps.chipClassName` but the data attributes are the
 * documented contract (see docs/chips.mdx). */
const CHIP_SELECTOR = "[data-value][data-label]";

/** `Meta` on macOS, `Control` elsewhere. Browsers run on the host OS, so the
 * host platform is the right thing to key off. */
export const MODIFIER = process.platform === "darwin" ? "Meta" : "Control";

/** A slower-than-instant keystroke cadence. Real typing is not a burst, and the
 * library does work on every `input` event; typing with no delay at all hides
 * ordering bugs that users hit. */
const TYPE_DELAY = 15;

export type ChangeLog = {
  count: number;
  data: {
    displayValue: string;
    dataValue: string;
    mentions: Array<{
      label: string;
      value: string;
      startIndex: number;
      endIndex: number;
    }>;
  } | null;
};

export type ModelState = {
  /** The editor's `textContent` — what the user sees, newlines included. */
  text?: string;
  /** `dataValue` from the most recent `onChange` payload. */
  dataValue?: string;
  /** `displayValue` from the most recent `onChange` payload. */
  displayValue?: string;
  /** Caret position as a character offset into the editor's `textContent`. */
  caret?: number;
};

export class MentionCase {
  constructor(
    readonly page: Page,
    readonly id: CaseId
  ) {}

  // --- locators ------------------------------------------------------------

  /** The wrapper the harness puts around this case. Every other locator is
   * scoped to it, so cases cannot interfere with each other. */
  get section(): Locator {
    return this.page.getByTestId(`mention-${this.id}`);
  }

  get editor(): Locator {
    return this.section.getByRole("combobox");
  }

  get modal(): Locator {
    return this.section.getByRole("listbox");
  }

  get options(): Locator {
    return this.modal.getByRole("option");
  }

  /** The 'No items found' element. */
  get noOptions(): Locator {
    return this.modal.locator(".mention-no-options, .harness-no-options");
  }

  get chips(): Locator {
    return this.editor.locator(CHIP_SELECTOR);
  }

  option(label: string, nth = 0): Locator {
    return this.options.filter({ hasText: label }).nth(nth);
  }

  /** The option the component reports as highlighted, via `aria-selected`. */
  get highlightedOption(): Locator {
    return this.options.and(this.page.locator("[aria-selected=true]"));
  }

  /** A click target outside the editor, positioned above it so an open modal
   * cannot cover it. */
  get outside(): Locator {
    return this.page.getByTestId(`${this.id}-outside`);
  }

  // --- reading state -------------------------------------------------------

  /** The editor's `textContent`. Deliberately not `innerText`: `textContent` is
   * the string the library's own model is built from, so comparing against it
   * catches divergence between what is rendered and what is reported. */
  async getText(): Promise<string> {
    return (await this.editor.textContent()) ?? "";
  }

  async getHTML(): Promise<string> {
    return this.editor.innerHTML();
  }

  async getChangeLog(): Promise<ChangeLog> {
    const raw =
      (await this.page.getByTestId(`${this.id}-onchange`).textContent()) ?? "";
    return JSON.parse(raw) as ChangeLog;
  }

  /** The most recent `onChange` payload, or null if `onChange` has not fired. */
  async getOnChangePayload(): Promise<ChangeLog["data"]> {
    return (await this.getChangeLog()).data;
  }

  /** How many times `onChange` has fired. Snapshot this before an action to
   * wait for the *next* payload rather than racing the current one. */
  async getChangeCount(): Promise<number> {
    return (await this.getChangeLog()).count;
  }

  async getDataValue(): Promise<string | null> {
    return (await this.getOnChangePayload())?.dataValue ?? null;
  }

  async getDisplayValue(): Promise<string | null> {
    return (await this.getOnChangePayload())?.displayValue ?? null;
  }

  async getMentions(): Promise<NonNullable<ChangeLog["data"]>["mentions"]> {
    return (await this.getOnChangePayload())?.mentions ?? [];
  }

  /**
   * The `dataValue` prop the harness is currently feeding back into the
   * component. Only meaningful for the controlled cases — this is the value
   * that completes the round trip, as opposed to the one `onChange` emitted.
   */
  async getControlledDataValue(): Promise<string> {
    return (
      (await this.page.getByTestId(`${this.id}-datavalue`).textContent()) ?? ""
    );
  }

  /**
   * The caret as a character offset into the editor's `textContent`.
   *
   * This is the assertion the vitest/happy-dom layer cannot give us, and the
   * reason this suite exists. Returns null when the caret is not inside this
   * editor (no selection, or focus is elsewhere) — a null where a number was
   * expected is usually a focus bug, so it is reported rather than coerced.
   */
  async getCaretOffset(): Promise<number | null> {
    return this.editor.evaluate((editor) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;

      const range = selection.getRangeAt(0);
      if (!editor.contains(range.startContainer)) return null;

      const preCaret = range.cloneRange();
      preCaret.selectNodeContents(editor);
      preCaret.setEnd(range.endContainer, range.endOffset);
      return preCaret.toString().length;
    });
  }

  /** Whether the caret is a collapsed point rather than a selection. */
  async isCaretCollapsed(): Promise<boolean | null> {
    return this.editor.evaluate((editor) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      const range = selection.getRangeAt(0);
      if (!editor.contains(range.startContainer)) return null;
      return range.collapsed;
    });
  }

  async isFocused(): Promise<boolean> {
    return this.editor.evaluate((editor) => document.activeElement === editor);
  }

  // --- driving the editor --------------------------------------------------

  /**
   * Focus the editor, placing the caret at the end of its content.
   *
   * Clicking would place the caret wherever the click landed, which makes tests
   * depend on glyph metrics; this is deliberate and repeatable instead.
   */
  async focus(): Promise<void> {
    await this.editor.click();
    await this.setCaretToEnd();
  }

  private async ensureFocused(): Promise<void> {
    if (!(await this.isFocused())) await this.focus();
  }

  /**
   * Type `text` as real key events, one key at a time.
   *
   * Not `fill()` and not `insertText`: both skip the keydown/keypress/input
   * sequence the library actually listens to, which is precisely the part that
   * a fake DOM already fails to model.
   */
  async typeText(text: string): Promise<void> {
    await this.ensureFocused();
    await this.page.keyboard.type(text, { delay: TYPE_DELAY });
  }

  /**
   * Run a keystroke script.
   *
   * Literal characters are typed; `{...}` is pressed as a key. Playwright key
   * syntax works inside the braces, so modifiers and repeats are available:
   *
   *   await case.pressKeys("@al{ArrowDown}{Enter}")
   *   await case.pressKeys("{Shift+Enter}")
   *   await case.pressKeys("{Backspace*3}")
   *   await case.pressKeys(`{${MODIFIER}+z}`)
   *
   * To type a literal brace, use `{{}` or `{}}`.
   */
  async pressKeys(script: string): Promise<void> {
    await this.ensureFocused();

    for (const token of script.match(/\{[^}]*\}|\}|[^{]+/g) ?? []) {
      const isKey = token.startsWith("{") && token.endsWith("}");
      if (!isKey) {
        await this.page.keyboard.type(token, { delay: TYPE_DELAY });
        continue;
      }

      const body = token.slice(1, -1);
      if (body === "{" || body === "}" || body === "") {
        await this.page.keyboard.type(body || "{", { delay: TYPE_DELAY });
        continue;
      }

      const repeated = body.match(/^(.+)\*(\d+)$/);
      const key = repeated ? repeated[1] : body;
      const times = repeated ? Number(repeated[2]) : 1;

      for (let i = 0; i < times; i++) {
        await this.page.keyboard.press(key, { delay: TYPE_DELAY });
      }
    }
  }

  /** Native undo. Distinct from anything the library implements — that is the
   * point: chip insertion must not corrupt the browser's own undo stack. */
  async undo(): Promise<void> {
    await this.ensureFocused();
    await this.page.keyboard.press(`${MODIFIER}+z`);
  }

  async redo(): Promise<void> {
    await this.ensureFocused();
    await this.page.keyboard.press(`${MODIFIER}+Shift+z`);
  }

  async selectAll(): Promise<void> {
    await this.ensureFocused();
    await this.page.keyboard.press(`${MODIFIER}+a`);
  }

  // --- caret placement ----------------------------------------------------

  /**
   * Put the caret at a character offset into the editor's `textContent`.
   *
   * Resolves to the earliest text node that reaches the offset, so an offset
   * that falls on a chip boundary lands *inside* the preceding node. Use
   * `setCaretAfterChip` / `setCaretBeforeChip` when the boundary is the point of
   * the test — those are unambiguous.
   */
  async setCaretOffset(offset: number): Promise<void> {
    await this.editor.evaluate((editor, target) => {
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
      const range = document.createRange();

      let remaining = target;
      let node = walker.nextNode();
      let placed = false;

      while (node) {
        const length = node.textContent?.length ?? 0;
        if (remaining <= length) {
          range.setStart(node, remaining);
          placed = true;
          break;
        }
        remaining -= length;
        node = walker.nextNode();
      }

      // Offset past the end of the content: clamp to the very end.
      if (!placed) {
        range.selectNodeContents(editor);
        range.collapse(false);
      }

      range.collapse(true);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }, offset);
  }

  async setCaretToEnd(): Promise<void> {
    await this.editor.evaluate((editor) => {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
  }

  async setCaretToStart(): Promise<void> {
    await this.editor.evaluate((editor) => {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(true);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
  }

  /** Caret immediately after chip `index`, in the editor's node order. */
  async setCaretAfterChip(index = 0): Promise<void> {
    await this.setCaretRelativeToChip(index, "after");
  }

  /** Caret immediately before chip `index`. */
  async setCaretBeforeChip(index = 0): Promise<void> {
    await this.setCaretRelativeToChip(index, "before");
  }

  private async setCaretRelativeToChip(
    index: number,
    side: "before" | "after"
  ): Promise<void> {
    await this.editor.evaluate(
      (editor, { index, side, selector }) => {
        const chip = editor.querySelectorAll(selector)[index];
        if (!chip) throw new Error(`no chip at index ${index}`);

        const range = document.createRange();
        if (side === "after") range.setStartAfter(chip);
        else range.setStartBefore(chip);
        range.collapse(true);

        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      },
      { index, side, selector: CHIP_SELECTOR }
    );
  }

  /** Select the text between two `textContent` offsets, for paste-over-selection
   * and typing-over-selection tests. */
  async selectRange(start: number, end: number): Promise<void> {
    await this.ensureFocused();
    await this.editor.evaluate(
      (editor, { start, end }) => {
        const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
        const range = document.createRange();

        let offset = 0;
        let startPlaced = false;
        let node = walker.nextNode();

        while (node) {
          const length = node.textContent?.length ?? 0;
          if (!startPlaced && start <= offset + length) {
            range.setStart(node, start - offset);
            startPlaced = true;
          }
          if (startPlaced && end <= offset + length) {
            range.setEnd(node, end - offset);
            break;
          }
          offset += length;
          node = walker.nextNode();
        }

        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      },
      { start, end }
    );
  }

  // --- clipboard -----------------------------------------------------------

  /**
   * Paste plain text by dispatching a `paste` event carrying a `DataTransfer`.
   *
   * This is the path a synthetic paste takes, and it is *not* the same path as a
   * real OS paste — see `pasteFromSystemClipboard`. Both are provided because
   * the two differ, and a library that only works under one of them is broken.
   */
  async pasteText(text: string): Promise<void> {
    await this.ensureFocused();
    await this.editor.evaluate((editor, text) => {
      const data = new DataTransfer();
      data.setData("text/plain", text);
      editor.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        })
      );
    }, text);
  }

  /**
   * Paste HTML by dispatching a `paste` event carrying both `text/html` and the
   * `text/plain` flattening of it — which is what a real browser puts on the
   * clipboard when you copy rich content.
   *
   * Pass `plainText` explicitly when the two should disagree.
   */
  async pasteHTML(html: string, plainText?: string): Promise<void> {
    await this.ensureFocused();
    await this.editor.evaluate(
      (editor, { html, plainText }) => {
        const data = new DataTransfer();
        data.setData("text/html", html);

        let plain = plainText;
        if (plain === undefined) {
          const scratch = document.createElement("div");
          scratch.innerHTML = html;
          plain = scratch.textContent ?? "";
        }
        data.setData("text/plain", plain);

        editor.dispatchEvent(
          new ClipboardEvent("paste", {
            clipboardData: data,
            bubbles: true,
            cancelable: true,
          })
        );
      },
      { html, plainText }
    );
  }

  /**
   * Paste via the real OS clipboard: write it with the async Clipboard API, then
   * press the paste shortcut so the browser builds the event itself.
   *
   * Requires clipboard permissions, which only Chromium grants through
   * Playwright — guard calls with `test.skip(browserName !== "chromium")`.
   */
  async pasteFromSystemClipboard(text: string): Promise<void> {
    await this.ensureFocused();
    await this.page.evaluate(
      (text) => navigator.clipboard.writeText(text),
      text
    );
    await this.page.keyboard.press(`${MODIFIER}+v`);
  }

  // --- assertions ----------------------------------------------------------

  /**
   * Assert text, `dataValue`, `displayValue` and caret in one call. Every field
   * is optional; only what you pass is asserted.
   *
   * Each assertion polls, so this is safe to call immediately after an action —
   * React's re-render and the library's `setTimeout` refocus both settle.
   */
  async expectModelState(state: ModelState): Promise<void> {
    if (state.text !== undefined) {
      await expect
        .poll(() => this.getText(), { message: `${this.id}: editor text` })
        .toBe(state.text);
    }
    if (state.dataValue !== undefined) {
      await expect
        .poll(() => this.getDataValue(), {
          message: `${this.id}: onChange dataValue`,
        })
        .toBe(state.dataValue);
    }
    if (state.displayValue !== undefined) {
      await expect
        .poll(() => this.getDisplayValue(), {
          message: `${this.id}: onChange displayValue`,
        })
        .toBe(state.displayValue);
    }
    if (state.caret !== undefined) {
      await this.expectCaretOffset(state.caret);
    }
  }

  async expectCaretOffset(offset: number): Promise<void> {
    await expect
      .poll(() => this.getCaretOffset(), {
        message: `${this.id}: caret offset into textContent`,
      })
      .toBe(offset);
  }

  /** Assert the modal is open and listing exactly these option labels, in order. */
  async expectOptionLabels(labels: readonly string[]): Promise<void> {
    await expect(this.modal).toBeVisible();
    await expect(this.options).toHaveText([...labels]);
  }
}

export class Harness {
  private readonly cases = new Map<CaseId, MentionCase>();

  constructor(readonly page: Page) {}

  case(id: CaseId): MentionCase {
    const existing = this.cases.get(id);
    if (existing) return existing;

    const created = new MentionCase(this.page, id);
    this.cases.set(id, created);
    return created;
  }
}

export const test = base.extend<{ harness: Harness }>({
  harness: async ({ page, context, browserName }, use) => {
    if (browserName === "chromium") {
      // Only Chromium supports these through Playwright; the specs that need a
      // real OS paste skip elsewhere.
      await context
        .grantPermissions(["clipboard-read", "clipboard-write"])
        .catch(() => {});
    }

    await page.goto("/e2e.html");
    await use(new Harness(page));
  },
});

export { expect };
