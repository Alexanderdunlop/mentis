import { getBlogPosts } from "@/lib/source";
import { author, siteName, siteUrl } from "@/lib/metadata";

export const dynamic = "force-static";
export const revalidate = false;

const feedDescription =
  "Articles on building @mention inputs in React — migrating off react-mentions, contentEditable architecture, and the ARIA combobox pattern.";

/** Escapes the five XML predefined entities. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RSS requires RFC 822 dates, not the ISO dates the frontmatter carries. */
function toRfc822(date: string): string {
  return new Date(`${date}T00:00:00Z`).toUTCString();
}

export async function GET() {
  const posts = getBlogPosts();

  const items = posts
    .map((post) => {
      const url = `${siteUrl}${post.url}`;

      return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.data.description)}</description>
      <pubDate>${toRfc822(post.data.date)}</pubDate>
      <author>${escapeXml(post.data.author)}</author>
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName} — blog</title>
    <link>${siteUrl}/blog</link>
    <description>${escapeXml(feedDescription)}</description>
    <language>en</language>
    <managingEditor>${escapeXml(author.name)}</managingEditor>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
