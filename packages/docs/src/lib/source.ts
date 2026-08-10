import { blog as blogPosts, docs } from '@/.source';
import { loader } from 'fumadocs-core/source';
import { createMDXSource } from 'fumadocs-mdx';

// See https://fumadocs.vercel.app/docs/headless/source-api for more info
export const source = loader({
  // it assigns a URL to your pages
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});

export const blog = loader({
  baseUrl: '/blog',
  source: createMDXSource(blogPosts),
});

export type BlogPost = ReturnType<typeof blog.getPages>[number];

/**
 * Posts newest-first, then by `order` — the sequence the index, the sitemap,
 * the feed, and `llms.txt` all use.
 */
export function getBlogPosts() {
  return [...blog.getPages()].sort(
    (a, b) =>
      b.data.date.localeCompare(a.data.date) || a.data.order - b.data.order,
  );
}
