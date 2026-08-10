import type { MetadataRoute } from "next";
import { getBlogPosts, source } from "@/lib/source";
import { siteUrl } from "@/lib/metadata";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = source.getPages().map((page) => ({
    url: `${siteUrl}${page.url}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const posts = getBlogPosts().map((post) => ({
    url: `${siteUrl}${post.url}`,
    // Articles are revised rarely, and `lastModified` is only meaningful if it
    // is true — a date that always moves teaches crawlers to ignore it.
    lastModified: post.data.updated ?? post.data.date,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/blog`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...docs,
    ...posts,
  ];
}
