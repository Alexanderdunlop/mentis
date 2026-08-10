import Link from "next/link";
import { getBlogPosts } from "@/lib/source";
import { formatDate } from "@/lib/blog";
import { createMetadata, siteUrl } from "@/lib/metadata";

const title = "Blog";
const description =
  "Articles on building @mention inputs in React — migrating off react-mentions, contentEditable architecture, and the ARIA combobox pattern.";

export const metadata = createMetadata({ title, description, path: "/blog" });

export default function BlogIndex() {
  const posts = getBlogPosts();

  /**
   * A `Blog` node with its posts listed, so a crawler can enumerate the archive
   * from the index alone rather than following every link.
   */
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${siteUrl}/blog#blog`,
    name: `${title} | mentis`,
    description,
    url: `${siteUrl}/blog`,
    inLanguage: "en",
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      "@id": `${siteUrl}${post.url}#article`,
      headline: post.data.title,
      description: post.data.description,
      datePublished: post.data.date,
      dateModified: post.data.updated ?? post.data.date,
      url: `${siteUrl}${post.url}`,
    })),
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <script
        type="application/ld+json"
        // Static, author-controlled JSON — no user input is interpolated.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      <p className="mt-4 text-fd-muted-foreground">{description}</p>

      <ul className="mt-12 flex flex-col gap-10">
        {posts.map((post) => (
          <li key={post.url}>
            <article>
              <Link href={post.url} className="group block">
                <h2 className="text-2xl font-semibold tracking-tight group-hover:underline">
                  {post.data.title}
                </h2>
                <p className="mt-2 text-fd-muted-foreground">
                  {post.data.description}
                </p>
              </Link>
              <time
                dateTime={post.data.date}
                className="mt-3 block text-sm text-fd-muted-foreground"
              >
                {formatDate(post.data.date)}
              </time>
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}
