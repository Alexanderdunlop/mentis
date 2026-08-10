import Link from "next/link";
import { notFound } from "next/navigation";
import { blog } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";
import { formatDate, getFaqEntries } from "@/lib/blog";
import { author, createArticleMetadata, ogImage, siteUrl } from "@/lib/metadata";

export async function generateStaticParams() {
  return blog.getPages().map((page) => ({ slug: page.slugs[0] }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const page = blog.getPage([slug]);
  if (!page) notFound();

  return createArticleMetadata({
    title: page.data.title,
    description: page.data.description,
    path: page.url,
    date: page.data.date,
    updated: page.data.updated,
    keywords: page.data.keywords,
  });
}

export default async function BlogPost(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const page = blog.getPage([slug]);
  if (!page) notFound();

  const MDXContent = page.data.body;
  const faq = await getFaqEntries(page.absolutePath);
  const url = `${siteUrl}${page.url}`;

  /**
   * `TechArticle` rather than plain `BlogPosting` — these are developer
   * documentation in substance, and the FAQ is emitted as a linked `FAQPage`
   * so the question/answer pairs are eligible for rich results on their own.
   */
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${url}#article`,
        headline: page.data.title,
        description: page.data.description,
        abstract: page.data.summary,
        datePublished: page.data.date,
        dateModified: page.data.updated ?? page.data.date,
        inLanguage: "en",
        keywords: page.data.keywords.join(", "),
        image: `${siteUrl}${ogImage.url}`,
        author: { "@type": "Person", ...author },
        publisher: { "@type": "Person", ...author },
        isPartOf: { "@id": `${siteUrl}/blog#blog` },
        about: { "@id": `${siteUrl}/#software` },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
      },
      ...(faq.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `${url}#faq`,
              isPartOf: { "@id": `${url}#article` },
              mainEntity: faq.map((entry) => ({
                "@type": "Question",
                name: entry.question,
                acceptedAnswer: { "@type": "Answer", text: entry.answer },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <script
        type="application/ld+json"
        // Static, author-controlled JSON — no user input is interpolated.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <article>
        <header>
          <h1 className="text-4xl font-bold tracking-tight">
            {page.data.title}
          </h1>
          <p className="mt-4 text-lg text-fd-muted-foreground">
            {page.data.description}
          </p>
          <p className="mt-4 text-sm text-fd-muted-foreground">
            <span>{page.data.author}</span>
            {" · "}
            <time dateTime={page.data.date}>{formatDate(page.data.date)}</time>
            {page.data.updated ? (
              <>
                {" · updated "}
                <time dateTime={page.data.updated}>
                  {formatDate(page.data.updated)}
                </time>
              </>
            ) : null}
          </p>
        </header>

        {/*
          The summary answers the title's question outright, before the article
          argues it. Search snippets and models both tend to lift the first
          self-contained answer they find.
        */}
        <div className="mt-8 rounded-lg border border-fd-border bg-fd-card p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-fd-muted-foreground">
            In short
          </p>
          <p className="mt-2">{page.data.summary}</p>
        </div>

        <div className="prose mt-10">
          <MDXContent components={getMDXComponents()} />
        </div>
      </article>

      <footer className="mt-16 border-t border-fd-border pt-8">
        <Link href="/blog" className="text-sm hover:underline">
          ← All posts
        </Link>
      </footer>
    </main>
  );
}
