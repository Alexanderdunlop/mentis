/**
 * Mirrors docs/content/docs/accessibility.mdx — the ARIA contract.
 *
 * These are cheap assertions that break loudly, which is exactly what you want
 * from an a11y contract: nothing else in the suite would notice if
 * aria-activedescendant silently stopped tracking.
 */
import { test, expect } from "../fixtures/harness";

test("the editor exposes the documented combobox attributes", async ({
  harness,
}) => {
  const input = harness.case("default");

  await expect(input.editor).toHaveAttribute("role", "combobox");
  await expect(input.editor).toHaveAttribute("aria-autocomplete", "list");
  await expect(input.editor).toHaveAttribute("aria-haspopup", "listbox");
  await expect(input.editor).toHaveAttribute("aria-expanded", "false");
  await expect(input.editor).not.toHaveAttribute("aria-controls", /.*/);
});

test("aria-expanded and aria-controls track the modal", async ({ harness }) => {
  const input = harness.case("default");

  await input.typeText("@al");

  await expect(input.editor).toHaveAttribute("aria-expanded", "true");
  await expect(input.editor).toHaveAttribute("aria-controls", "mention-modal");
  await expect(input.modal).toHaveAttribute("role", "listbox");
  await expect(input.modal).toHaveAttribute("id", "mention-modal");

  await input.pressKeys("{Escape}");

  await expect(input.editor).toHaveAttribute("aria-expanded", "false");
  await expect(input.editor).not.toHaveAttribute("aria-controls", /.*/);
});

test("aria-activedescendant follows the highlighted option", async ({
  harness,
}) => {
  const input = harness.case("default");

  await input.typeText("@a");
  await expect(input.editor).toHaveAttribute(
    "aria-activedescendant",
    "mention-option-alice"
  );

  await input.pressKeys("{ArrowDown}");

  await expect(input.editor).toHaveAttribute(
    "aria-activedescendant",
    "mention-option-charlie"
  );
  // The id it points at must exist, and be the one marked selected.
  await expect(input.page.locator("#mention-option-charlie")).toHaveAttribute(
    "aria-selected",
    "true"
  );
});

test("exactly one option is aria-selected at a time", async ({ harness }) => {
  const input = harness.case("default");

  await input.typeText("@a");

  await expect(input.highlightedOption).toHaveCount(1);
  await expect(input.options).toHaveCount(3);

  await input.pressKeys("{ArrowDown}");

  await expect(input.highlightedOption).toHaveCount(1);
});

test("aria-activedescendant is absent when nothing matches", async ({
  harness,
}) => {
  const input = harness.case("default");

  await input.typeText("@zz");

  // The modal is open with a "No items found" message, so it must not claim an
  // active option — there is no element with that id to point at.
  await expect(input.editor).toHaveAttribute("aria-expanded", "true");
  await expect(input.editor).not.toHaveAttribute(
    "aria-activedescendant",
    /.*/
  );
});
