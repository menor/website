import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import { rehypeFigures, rehypeSpanishFootnotes } from "./src/lib/rehype-plugins.mjs";

export default defineConfig({
  site: "https://menor.pro",
  i18n: {
    locales: ["en", "es"],
    defaultLocale: "en",
    routing: { prefixDefaultLocale: false },
  },
  markdown: {
    shikiConfig: { theme: "github-light" },
    // remark/rehype pipeline instead of the default Sätteri, so standard
    // rehype plugins work (and carry over if the site leaves Astro).
    processor: unified({
      // Visible "Notes" heading above footnotes (Astro hides it by default).
      remarkRehype: { footnoteLabel: "Notes", footnoteLabelProperties: {} },
      rehypePlugins: [rehypeFigures, rehypeSpanishFootnotes],
    }),
  },
  // Markdown images get a srcset, so phones download smaller files.
  image: { layout: "constrained" },
  devToolbar: { enabled: false },
  // The minifier drops spaces before inline links in templates ("from.Sol").
  compressHTML: false,
});
