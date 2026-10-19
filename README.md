# website

My professional website, [menor.pro](https://menor.pro). Built with Astro and deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

## Run locally

```sh
npm install
npm run dev     # http://localhost:4321, drafts visible
npm run build   # output in dist/, drafts hidden
```

## Write a post

Add a Markdown file to `src/content/blog/en/` or `src/content/blog/es/`. The file name becomes the URL:

- `src/content/blog/en/my-post.md` → `/blog/my-post/`
- `src/content/blog/es/mi-articulo.md` → `/es/blog/mi-articulo/`

Front matter:

```yaml
---
title: My post
description: One sentence for search results and link previews.
pubDate: 2026-10-19
updatedDate: 2026-11-01   # optional
translationKey: my-post   # optional; same value on both language versions
draft: true               # optional; hidden from the live site
---
```

Posts with the same `translationKey` link to each other ("Leer en español" / "Read in English"). The build fails if a `translationKey` has no match in the other language.

Static files (CSS, fonts, images, `CNAME`) live in `public/` and are copied as they are.
