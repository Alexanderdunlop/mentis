import { getDocEntries } from "@/lib/llms";
import { siteDescription, siteUrl } from "@/lib/metadata";

export const dynamic = "force-static";
export const revalidate = false;

/**
 * Serves an llms.txt index of the documentation.
 *
 * @see https://llmstxt.org
 */
export async function GET() {
  const entries = await getDocEntries();

  const links = entries
    .map(
      (entry) =>
        `- [${entry.title}](${siteUrl}${entry.url})${entry.description ? `: ${entry.description}` : ""}`,
    )
    .join("\n");

  const body = `# mentis

> ${siteDescription}

mentis is a React component library that adds Slack- and Notion-style \`@mention\`
autocomplete to an input. It is built on \`contentEditable\` so mentions render as
real DOM chips, and it is commonly used as a maintained alternative to
\`react-mentions\`.

Install with \`npm install mentis\`. Import the component and its stylesheet:

    import { MentionInput } from "mentis";
    import "mentis/dist/index.css";

The controlled props are \`displayValue\` (what the user sees) and \`dataValue\`
(option IDs for storage). There is no plain \`value\` prop. \`onChange\` receives a
\`MentionData\` object, not a string.

## Documentation

${links}

## Optional

- [Full documentation as plaintext](${siteUrl}/llms-full.txt): every page above concatenated into one file
- [GitHub repository](https://github.com/alexanderdunlop/mentis): source, issues, and examples
- [npm package](https://www.npmjs.com/package/mentis): release history and install instructions
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
