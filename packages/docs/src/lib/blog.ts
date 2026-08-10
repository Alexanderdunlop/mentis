import { readFile } from "node:fs/promises";

export interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * Reduces inline Markdown to the plain prose underneath it.
 *
 * Structured data and `llms.txt` both want the sentence, not the syntax — a
 * `FAQPage` answer containing raw `[text](url)` is a Search Console warning.
 */
function toPlainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → their text
    .replace(/<kbd>|<\/kbd>/g, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pulls the `### question` / answer pairs out of a post's `## FAQ` section.
 *
 * Reading the source rather than the rendered output keeps this independent of
 * MDX compilation, at the cost of only understanding the heading convention the
 * posts actually use. Posts without an FAQ section yield an empty list.
 */
export async function getFaqEntries(absolutePath: string): Promise<FaqEntry[]> {
  const raw = await readFile(absolutePath, "utf-8");

  const faqStart = raw.search(/^## FAQ\s*$/m);
  if (faqStart === -1) return [];

  // The FAQ runs to the next `##` heading, or to the end of the file.
  const rest = raw.slice(faqStart + 1);
  const nextSection = rest.search(/^## /m);
  const section = nextSection === -1 ? rest : rest.slice(0, nextSection);

  const entries: FaqEntry[] = [];
  let current: { question: string; lines: string[] } | undefined;

  for (const line of section.split("\n")) {
    const heading = /^### (.+)$/.exec(line);

    if (heading) {
      if (current) {
        entries.push({
          question: toPlainText(current.question),
          answer: toPlainText(current.lines.join(" ")),
        });
      }
      current = { question: heading[1], lines: [] };
      continue;
    }

    if (current) current.lines.push(line);
  }

  if (current) {
    entries.push({
      question: toPlainText(current.question),
      answer: toPlainText(current.lines.join(" ")),
    });
  }

  return entries.filter((entry) => entry.question && entry.answer);
}

/**
 * Rounded up, at the 200 wpm that reading-time estimates conventionally assume.
 */
export function readingTimeMinutes(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
