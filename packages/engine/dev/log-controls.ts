import type { EventLog } from "../src/devtools/index";
import { need } from "./need";

const bindCheckbox = (
  selector: string,
  apply: (checked: boolean) => void
): void => {
  const input = need<HTMLInputElement>(selector);
  apply(input.checked);
  input.addEventListener("change", () => apply(input.checked));
};

export const bindLogControls = (log: EventLog): void => {
  bindCheckbox("#pause", log.setPaused);
  bindCheckbox("#autoscroll", log.setAutoscroll);
  bindCheckbox("#selectionchange", log.setLogSelectionChange);

  need("#clear").addEventListener("click", () => log.clear());

  need("#copy").addEventListener("click", async () => {
    await navigator.clipboard.writeText(log.toJSON());
  });

  // Exported sessions carry userAgent and platform, so a trace captured on a phone or
  // through an IME is self-documenting once it leaves the machine.
  need("#download").addEventListener("click", () => {
    const blob = new Blob([log.toJSON()], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "mentis-event-session.json";
    link.click();
    URL.revokeObjectURL(link.href);
  });
};
