import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://menor.pro",
  i18n: {
    locales: ["en", "es"],
    defaultLocale: "en",
    routing: { prefixDefaultLocale: false },
  },
  markdown: {
    shikiConfig: { theme: "github-light" },
  },
  devToolbar: { enabled: false },
  // The minifier drops spaces before inline links in templates ("from.Sol").
  compressHTML: false,
});
