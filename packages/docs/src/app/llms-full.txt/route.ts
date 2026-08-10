import { getDocEntries } from "@/lib/llms";
import { siteDescription, siteUrl } from "@/lib/metadata";

export const dynamic = "force-static";
export const revalidate = false;

/**
 * Serves the entire documentation set as a single plaintext file, so a model can
 * ingest all of it in one fetch.
 *
 * @see https://llmstxt.org
 */
export async function GET() {
  const entries = await getDocEntries();

  const sections = entries
    .map((entry) => {
      const header = [
        `# ${entry.title}`,
        entry.description ? `> ${entry.description}` : undefined,
        `Source: ${siteUrl}${entry.url}`,
      ]
        .filter(Boolean)
        .join("\n");

      return `${header}\n\n${entry.content}`;
    })
    .join("\n\n---\n\n");

  const body = `# mentis — full documentation

> ${siteDescription}

Package name: mentis
Repository: https://github.com/alexanderdunlop/mentis
Documentation: ${siteUrl}

---

${sections}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
