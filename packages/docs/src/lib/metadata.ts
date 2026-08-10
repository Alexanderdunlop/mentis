import type { Metadata } from "next";

export const siteUrl = "https://mentis.alexdunlop.com";

export const siteName = "mentis";

export const siteTagline = "Accessible @mention autocomplete input for React";

export const defaultTitle = `${siteName} | ${siteTagline}`;

export const siteDescription =
  "Accessible @mention autocomplete input for React. ContentEditable, zero dependencies, TypeScript-first — a modern react-mentions alternative.";

/**
 * Social card generated at build time by `src/app/opengraph-image.tsx`.
 *
 * Referenced explicitly rather than relying on file-convention inheritance,
 * because declaring `openGraph` on a page replaces the inherited value.
 */
export const ogImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${siteName} — ${siteTagline}`,
};

/**
 * Keywords used across the site. These mirror the npm package keywords so that
 * search engines see consistent terminology in both places.
 */
export const siteKeywords = [
  "react mentions",
  "react mention input",
  "mention input react",
  "react-mentions alternative",
  "@mention autocomplete",
  "react autocomplete input",
  "react combobox",
  "react typeahead",
  "react tagging input",
  "contenteditable react",
  "react mention chips",
  "accessible react input",
  "mentis",
];

/**
 * Builds page metadata with canonical URL and social card filled in.
 *
 * @param path - Absolute site path, e.g. `/docs/installation`.
 */
export function createMetadata({
  title,
  description = siteDescription,
  path = "/",
}: {
  title?: string;
  description?: string;
  path?: string;
} = {}): Metadata {
  const url = `${siteUrl}${path}`;
  const socialTitle = title ? `${title} | ${siteName}` : defaultTitle;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      siteName,
      locale: "en_US",
      url,
      title: socialTitle,
      description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [ogImage],
    },
  };
}

export const author = {
  name: "Alexander Dunlop",
  url: "https://alexdunlop.com/",
};

/**
 * Article metadata — as `createMetadata`, but with `og:type=article` and the
 * publication dates, which is what social cards and news crawlers read.
 *
 * @param path - Absolute site path, e.g. `/blog/some-post`.
 */
export function createArticleMetadata({
  title,
  description,
  path,
  date,
  updated,
  keywords = [],
}: {
  title: string;
  description: string;
  path: string;
  date: string;
  updated?: string;
  keywords?: string[];
}): Metadata {
  const base = createMetadata({ title, description, path });

  return {
    ...base,
    // Article keywords first, so the page-specific terms lead.
    keywords: [...keywords, ...siteKeywords],
    authors: [author],
    openGraph: {
      ...base.openGraph,
      type: "article",
      // Open Graph wants an ISO 8601 *datetime*; the frontmatter carries a
      // date, so anchor it to midnight UTC rather than inventing a time.
      publishedTime: `${date}T00:00:00.000Z`,
      modifiedTime: `${updated ?? date}T00:00:00.000Z`,
      authors: [author.url],
    },
  };
}
