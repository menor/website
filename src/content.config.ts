import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Posts live in src/content/blog/<lang>/<slug>.md.
// The folder sets the language; the file name sets the URL slug.
const blog = defineCollection({
  loader: glob({ pattern: "{en,es}/**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // Same value on both language versions of a post links them as twins.
    translationKey: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
