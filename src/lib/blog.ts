import { getCollection, type CollectionEntry } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";

export type Lang = "en" | "es";
export type Post = CollectionEntry<"blog">;

export const strings = {
  en: {
    skip: "Skip to content",
    blog: "Blog",
    about: "About",
    blogIntro: "Notes from where AI agents, frontend and interfaces meet.",
    noPosts: "No posts yet.",
    allPosts: "All posts",
    updated: "Updated",
    // Shown on the other language's page, so written in this language.
    readIn: "Read in English",
  },
  es: {
    skip: "Saltar al contenido",
    blog: "Blog",
    about: "Sobre mí",
    blogIntro: "Notas desde donde se cruzan los agentes de IA, el frontend y las interfaces.",
    noPosts: "Todavía no hay artículos.",
    allPosts: "Todos los artículos",
    updated: "Actualizado",
    readIn: "Leer en español",
  },
} as const;

// Entry ids look like "es/agentes-y-modelos": folder = language, rest = slug.
export const postLang = (post: Post) => post.id.split("/")[0] as Lang;
export const postSlug = (post: Post) => post.id.split("/").slice(1).join("/");

export const blogUrl = (lang: Lang) => getRelativeLocaleUrl(lang, "blog/");
export const postUrl = (post: Post) =>
  getRelativeLocaleUrl(postLang(post), `blog/${postSlug(post)}/`);

export function formatDate(date: Date, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

// Fail the build on a translationKey typo or a duplicate. Checks drafts too,
// so a post can go live before its translation is finished.
function checkTwins(all: Post[]) {
  const byKey = Map.groupBy(
    all.filter((p) => p.data.translationKey),
    (p) => p.data.translationKey!,
  );
  for (const [key, posts] of byKey) {
    const langs = posts.map(postLang);
    if (posts.length === 1) {
      throw new Error(
        `Post "${posts[0].id}" has translationKey "${key}" but no post in the other language uses it.`,
      );
    }
    if (new Set(langs).size !== langs.length) {
      throw new Error(
        `translationKey "${key}" is used twice in one language: ${posts.map((p) => p.id).join(", ")}`,
      );
    }
  }
}

const isVisible = (p: Post) => import.meta.env.DEV || !p.data.draft;

// Visible posts in every language. Drafts show only in `npm run dev`.
export async function getAllPosts() {
  const all = await getCollection("blog");
  checkTwins(all);
  return all
    .filter(isVisible)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export const findTwin = (post: Post, posts: Post[]) =>
  post.data.translationKey
    ? posts.find(
        (p) =>
          p.data.translationKey === post.data.translationKey &&
          postLang(p) !== postLang(post),
      )
    : undefined;
