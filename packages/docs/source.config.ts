import {
  defineCollections,
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from "fumadocs-mdx/config";
import { z } from "zod";

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.vercel.app/docs/mdx/collections#define-docs
export const docs = defineDocs({
  docs: {
    schema: frontmatterSchema,
  },
  meta: {
    schema: metaSchema,
  },
});

/**
 * Long-form articles, kept separate from the reference docs.
 *
 * `description` is required here (unlike in `docs`) because it is the meta
 * description, the social card copy, and the summary a model sees in
 * `llms.txt` — a post without one is invisible in all three.
 */
export const blog = defineCollections({
  type: "doc",
  dir: "content/blog",
  schema: frontmatterSchema.extend({
    description: z.string(),
    /** Publication date, `YYYY-MM-DD`. Drives ordering and `datePublished`. */
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** Last substantive revision, `YYYY-MM-DD`. Omit until the post changes. */
    updated: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    author: z.string().default("Alexander Dunlop"),
    /**
     * Tie-break for posts sharing a `date`, lowest first. Without it, same-day
     * posts fall back to filename order, which is not a reading order.
     */
    order: z.number().default(0),
    /** Article-level keywords, merged with the site-wide set. */
    keywords: z.array(z.string()).default([]),
    /**
     * A direct, self-contained answer to the question in the title.
     *
     * Rendered at the top of the post and lifted verbatim into `llms.txt`, so
     * a model that reads nothing else still gets the correct answer.
     */
    summary: z.string(),
  }),
});

export default defineConfig({
  mdxOptions: {
    // MDX options
  },
});
