import {
  test as base,
  expect,
  type CDPSession,
  type Locator,
  type Page,
} from "@playwright/test";
// Type-only, so importing the harness page here never executes it. The page owns these
// definitions and the global declaration; duplicating them is how the two drift apart.
import type { Content, Direction, HarnessModel, HarnessNode } from "../../dev/e2e";

export type { Content, Direction, HarnessModel, HarnessNode };

/**
 * Page object for the engine's browser matrix.
 *
 * Everything a spec needs lives here. If a spec reaches for `page.evaluate` on its own,
 * a helper is missing — add it, so the next spec gets it free.
 *
 * The engine is headless and model-first, which changes what this fixture is *for*
 * compared with v1's. There, the model had to be reconstructed from `onChange` payloads.
 * Here the model is authoritative and readable directly, so the valuable assertion is
 * **the model and the DOM agreeing** — that invariant is the whole reason this package
 * exists, and it is not checkable anywhere but a real browser.
 */

/** `Meta` on macOS, `Control` elsewhere. Browsers run on the host OS. */
export const MODIFIER = process.platform === "darwin" ? "Meta" : "Control";

/** Real typing is not a burst, and the engine does work on every event. */
const TYPE_DELAY = 15;

export class EngineHarness {
  readonly editor: Locator;

  constructor(readonly page: Page) {
    this.editor = page.getByTestId("editor");
  }

  // --- setup ---------------------------------------------------------------

  /**
   * `dir` sets the container's writing direction, as a consumer would. The engine reads
   * it nowhere — that is the claim ADR 0015 makes and `adr-0015-direction.spec.ts` checks.
   */
  async reset(content: Content[] = [], dir?: Direction): Promise<void> {
    await this.page.evaluate(
      ({ items, dir: d }) => window.engineHarness.reset(items, d),
      { items: content, dir } as never
    );
    await this.editor.click();
    await this.setCaretToEnd();
  }

  /** The container's writing direction as the browser resolved it, not as we set it. */
  async resolvedDirection(): Promise<string> {
    return this.editor.evaluate((element) => getComputedStyle(element).direction);
  }

  /**
   * Where a model position is on screen, via the engine's own `positionRect` — the one
   * piece of geometry the engine owns, and what a consumer anchors a mention menu to.
   */
  async positionRect(
    position: number
  ): Promise<{ left: number; right: number; width: number } | null> {
    return this.page.evaluate(
      (at) => window.engineHarness.positionRect(at),
      position
    );
  }

  // --- reading the model ---------------------------------------------------

  async model(): Promise<HarnessModel> {
    return this.page.evaluate(() => window.engineHarness.model()) as Promise<HarnessModel>;
  }

  /** Visible text according to the **model**. */
  async text(): Promise<string> {
    return (await this.model()).text;
  }

  /** Visible text according to the **DOM**. These two must always agree. */
  async domText(): Promise<string> {
    return this.editor.evaluate((element) => element.textContent ?? "");
  }

  /** `inputType`s the engine had no rule for. Should be empty in a passing spec. */
  async unhandledInput(): Promise<string[]> {
    return this.page.evaluate(() => window.engineHarness.unhandledInput());
  }

  /** The chip elements, identified by the attribute that is the documented contract. */
  chips(): Locator {
    return this.editor.locator("[data-mention-value]");
  }

  /**
   * The caret as a **character** offset into the DOM's text.
   *
   * Counted by walking text nodes rather than with `Range.toString().length`, which
   * silently ignores `<br>` — see docs/notes/contenteditable-traps.md. The engine renders
   * newlines as `\n` inside text nodes (ADR 0002) and only ever emits a *trailing* `<br>`,
   * so the two would agree today; the walk is what keeps that an observation rather than
   * a dependency.
   *
   * Note this is character space, not position space. For a document containing a mention
   * it will **not** equal `model().selection` — that divergence is ADR 0005, and asserting
   * both is how a spec proves it is real rather than theoretical.
   */
  async domCaretOffset(): Promise<number | null> {
    return this.editor.evaluate((element) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;

      const range = selection.getRangeAt(0);
      if (!element.contains(range.startContainer)) return null;

      let offset = 0;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        if (node === range.endContainer) return offset + range.endOffset;
        offset += (node as Text).data.length;
        node = walker.nextNode();
      }

      // An element boundary rather than a text node: count everything before it.
      return offset;
    });
  }

  // --- driving -------------------------------------------------------------

  private async ensureFocused(): Promise<void> {
    const focused = await this.editor.evaluate(
      (element) => document.activeElement === element
    );
    if (!focused) await this.editor.click();
  }

  /** Type as real key events. Never `fill()`, which skips the input pipeline entirely. */
  async type(text: string): Promise<void> {
    await this.ensureFocused();
    await this.page.keyboard.type(text, { delay: TYPE_DELAY });
  }

  /**
   * A keystroke script: literal characters are typed, `{...}` is pressed.
   *
   * The same syntax `src/devtools/replay/parse-script.ts` accepts, which is why that
   * module was kept pure — docs/plan.md called this out as the reason.
   */
  async press(script: string): Promise<void> {
    await this.ensureFocused();

    for (const step of script.match(/\{[^}]+\}|[^{]+/g) ?? []) {
      if (!step.startsWith("{")) {
        await this.page.keyboard.type(step, { delay: TYPE_DELAY });
        continue;
      }

      const body = step.slice(1, -1);
      const repeat = body.match(/^(.+?)\s*[*x]\s*(\d+)$/);
      const key = repeat ? repeat[1]! : body;
      const times = repeat ? Number(repeat[2]) : 1;

      for (let i = 0; i < times; i += 1) await this.page.keyboard.press(key);
    }
  }

  async setCaret(anchor: number, head: number = anchor): Promise<void> {
    await this.page.evaluate(
      ([a, h]) => window.engineHarness.setCaret(a!, h!),
      [anchor, head] as const
    );
  }

  async setCaretToEnd(): Promise<void> {
    const { length } = await this.model();
    await this.setCaret(length);
  }

  async insertMention(label: string, value: string): Promise<void> {
    await this.page.evaluate(
      ([l, v]) => window.engineHarness.insertMention(l!, v!),
      [label, value] as const
    );
  }

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

  async copy(): Promise<void> {
    await this.ensureFocused();
    await this.page.keyboard.press(`${MODIFIER}+c`);
  }

  async cut(): Promise<void> {
    await this.ensureFocused();
    await this.page.keyboard.press(`${MODIFIER}+x`);
  }

  async paste(): Promise<void> {
    await this.ensureFocused();
    await this.page.keyboard.press(`${MODIFIER}+v`);
  }

  // --- composition ---------------------------------------------------------

  /*
   * IME composition, driven through CDP.
   *
   * **Chromium only** — there is no equivalent in Playwright for Firefox or WebKit, so
   * specs using these must `test.skip` elsewhere. That is a real limit: it exercises the
   * reconciliation contract against a genuine composition, which is far more than the
   * unit tests could reach, but it is one engine's idea of the event sequence rather than
   * proof that all of them agree. ADR 0009 says so.
   *
   * Nothing here is faked at the DOM level. `Input.imeSetComposition` makes the browser
   * render its own pre-edit text and fire real `compositionstart`/`compositionupdate`,
   * which is precisely the window ADR 0009 hands the DOM over for.
   */

  private cdp: CDPSession | null = null;

  private async session(): Promise<CDPSession> {
    this.cdp ??= await this.page.context().newCDPSession(this.page);
    return this.cdp;
  }

  /** Show pre-edit text, as an IME does before you pick a candidate. */
  async compose(text: string, caret: number = text.length): Promise<void> {
    await this.ensureFocused();
    const cdp = await this.session();
    await cdp.send("Input.imeSetComposition", {
      text,
      selectionStart: caret,
      selectionEnd: caret,
    });
  }

  /** Commit the composition — picking the candidate. Fires `compositionend`. */
  async commitComposition(text: string): Promise<void> {
    const cdp = await this.session();
    await cdp.send("Input.insertText", { text });
  }

  /** Abandon it, the way Escape does mid-composition. */
  async cancelComposition(): Promise<void> {
    const cdp = await this.session();
    await cdp.send("Input.imeSetComposition", {
      text: "",
      selectionStart: 0,
      selectionEnd: 0,
    });
  }

  /** Whether the engine currently believes the browser owns the DOM. */
  async isComposing(): Promise<boolean> {
    return (await this.model()).composing;
  }

  // --- assertions ----------------------------------------------------------

  /**
   * The invariant this whole package exists to hold: the DOM is a projection of the
   * model. Every spec should be able to call this at any point and have it pass.
   */
  async expectModelMatchesDom(): Promise<void> {
    // Reported as a string rather than a boolean so a failure names both sides.
    await expect
      .poll(async () => {
        const [model, dom] = await Promise.all([this.text(), this.domText()]);
        return model === dom
          ? "match"
          : `model ${JSON.stringify(model)} !== dom ${JSON.stringify(dom)}`;
      })
      .toBe("match");
  }

  async expectText(text: string): Promise<void> {
    await expect.poll(() => this.text()).toBe(text);
    await expect.poll(() => this.domText()).toBe(text);
  }

  /** Model position of the caret — position space, where an atom is 1 wide. */
  async expectCaret(position: number): Promise<void> {
    await expect.poll(async () => (await this.model()).selection?.head ?? null).toBe(
      position
    );
  }
}

export const test = base.extend<{ harness: EngineHarness }>({
  harness: async ({ page }, use) => {
    await page.goto("/e2e.html");
    const harness = new EngineHarness(page);
    await harness.reset();
    await use(harness);
  },
});

export { expect };

