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
