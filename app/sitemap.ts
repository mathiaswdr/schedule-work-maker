import type { MetadataRoute } from "next";

import {
  type AppLocale,
  defaultLocale,
  localeMetadata,
  locales,
} from "@/lib/i18n-routing";
import { publicMarketingRoutes } from "@/lib/marketing-pages";
import { localizedAbsoluteUrl, localizedAlternates } from "@/lib/seo";
import { getPublishedBlogPosts } from "@/server/blog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const postsByLocale = await Promise.all(
    locales.map(async (locale) => ({
      locale,
      posts: await getPublishedBlogPosts(locale),
    })),
  );

  const postsByTranslationKey = postsByLocale.reduce<
    Map<string, Map<AppLocale, { slug: string }>>
  >(
    (map, entry) => {
      entry.posts.forEach((post) => {
        const translations =
          map.get(post.translationKey) ?? new Map<AppLocale, { slug: string }>();
        translations.set(entry.locale, { slug: post.slug });
        map.set(post.translationKey, translations);
      });
      return map;
    },
    new Map(),
  );

  const marketingEntries = locales.flatMap((locale) =>
    publicMarketingRoutes.map((route) => ({
      url: localizedAbsoluteUrl(route, locale),
      lastModified,
      changeFrequency:
        route === "/legal/privacy" || route === "/legal/terms"
          ? ("yearly" as const)
          : route === "/about" || route === "/contact"
            ? ("monthly" as const)
            : ("weekly" as const),
      priority: route === "/" ? 1 : route === "/pricing" ? 0.85 : 0.7,
      alternates: {
        languages: localizedAlternates(route),
      },
    })),
  );

  const blogEntries = locales.map((locale) => ({
    url: localizedAbsoluteUrl("/blog", locale),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
    alternates: {
      languages: localizedAlternates("/blog"),
    },
  }));

  return [
    ...marketingEntries,
    ...blogEntries,
    ...postsByLocale.flatMap(({ locale, posts }) =>
      posts.map((post) => {
        const translations =
          postsByTranslationKey.get(post.translationKey) ??
          new Map<AppLocale, { slug: string }>([[locale, { slug: post.slug }]]);
        const languages = Array.from(translations.entries()).reduce<
          Record<string, string>
        >((acc, [availableLocale, translation]) => {
          acc[localeMetadata[availableLocale].htmlLang] = localizedAbsoluteUrl(
            `/blog/${translation.slug}`,
            availableLocale,
          );
          return acc;
        }, {});
        const defaultTranslation = translations.get(defaultLocale);

        if (defaultTranslation) {
          languages["x-default"] = localizedAbsoluteUrl(
            `/blog/${defaultTranslation.slug}`,
            defaultLocale,
          );
        }

        return {
          url: localizedAbsoluteUrl(`/blog/${post.slug}`, locale),
          lastModified: post.updatedAt ?? post.publishedAt ?? lastModified,
          changeFrequency: "monthly" as const,
          priority: 0.65,
          alternates: {
            languages,
          },
        };
      }),
    ),
  ];
}
