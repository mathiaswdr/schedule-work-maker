import { cache } from "react";
import { BlogPostStatus, Prisma } from "@prisma/client";

import { prisma } from "@/server/prisma";

export type BlogSection = {
  heading: string;
  body: string[];
  bullets?: string[];
};

export type BlogFaqItem = {
  question: string;
  answer: string;
};

export type BlogCta = {
  title: string;
  body: string;
  href: string;
  label: string;
};

export type BlogContent = {
  intro: string;
  sections: BlogSection[];
  faq?: BlogFaqItem[];
  cta?: BlogCta;
};

export const blogPostListSelect = {
  id: true,
  translationKey: true,
  slug: true,
  locale: true,
  title: true,
  excerpt: true,
  coverImageUrl: true,
  tags: true,
  authorName: true,
  readingMinutes: true,
  publishedAt: true,
  updatedAt: true,
} satisfies Prisma.BlogPostSelect;

export const blogPostDetailSelect = {
  ...blogPostListSelect,
  content: true,
  metaTitle: true,
  metaDescription: true,
} satisfies Prisma.BlogPostSelect;

export type BlogPostListItem = Prisma.BlogPostGetPayload<{
  select: typeof blogPostListSelect;
}>;

export type BlogPostDetail = Prisma.BlogPostGetPayload<{
  select: typeof blogPostDetailSelect;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function parseBlogContent(content: Prisma.JsonValue): BlogContent {
  if (!isRecord(content)) {
    return {
      intro: "",
      sections: [],
    };
  }

  const sections = Array.isArray(content.sections)
    ? content.sections
        .flatMap((section) => {
          if (!isRecord(section)) return [];

          const parsedSection = {
            heading: typeof section.heading === "string" ? section.heading : "",
            body: stringArray(section.body),
            bullets: stringArray(section.bullets),
          };

          return parsedSection.heading && parsedSection.body.length > 0
            ? [parsedSection]
            : [];
        })
    : [];

  const faq = Array.isArray(content.faq)
    ? content.faq
        .flatMap((item) => {
          if (!isRecord(item)) return [];

          const parsedItem = {
            question: typeof item.question === "string" ? item.question : "",
            answer: typeof item.answer === "string" ? item.answer : "",
          };

          return parsedItem.question && parsedItem.answer ? [parsedItem] : [];
        })
    : undefined;

  const cta = isRecord(content.cta)
    ? {
        title: typeof content.cta.title === "string" ? content.cta.title : "",
        body: typeof content.cta.body === "string" ? content.cta.body : "",
        href: typeof content.cta.href === "string" ? content.cta.href : "/",
        label: typeof content.cta.label === "string" ? content.cta.label : "",
      }
    : undefined;

  return {
    intro: typeof content.intro === "string" ? content.intro : "",
    sections,
    faq,
    cta: cta?.title && cta.body && cta.label ? cta : undefined,
  };
}

export function formatBlogDate(date: Date | null, locale = "fr-CH") {
  if (!date) return "Article a venir";

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function publishedWhere(locale: string) {
  return {
    locale,
    status: BlogPostStatus.PUBLISHED,
    publishedAt: {
      lte: new Date(),
    },
  } satisfies Prisma.BlogPostWhereInput;
}

function isMissingBlogTableError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2021"
  );
}

export const getPublishedBlogPosts = cache(async (locale = "fr") => {
  try {
    return await prisma.blogPost.findMany({
      where: publishedWhere(locale),
      select: blogPostListSelect,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
  } catch (error) {
    if (isMissingBlogTableError(error)) return [];
    throw error;
  }
});

export const getPublishedBlogPost = cache(async (slug: string, locale = "fr") => {
  try {
    return await prisma.blogPost.findFirst({
      where: {
        ...publishedWhere(locale),
        slug,
      },
      select: blogPostDetailSelect,
    });
  } catch (error) {
    if (isMissingBlogTableError(error)) return null;
    throw error;
  }
});

export const getPublishedBlogPostTranslations = cache(async (translationKey: string) => {
  try {
    return await prisma.blogPost.findMany({
      where: {
        translationKey,
        status: BlogPostStatus.PUBLISHED,
        publishedAt: {
          lte: new Date(),
        },
      },
      select: blogPostListSelect,
      orderBy: [{ locale: "asc" }],
    });
  } catch (error) {
    if (isMissingBlogTableError(error)) return [];
    throw error;
  }
});

export const getRelatedBlogPosts = cache(async (translationKey: string, locale = "fr") => {
  try {
    return await prisma.blogPost.findMany({
      where: {
        ...publishedWhere(locale),
        translationKey: {
          not: translationKey,
        },
      },
      select: blogPostListSelect,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
    });
  } catch (error) {
    if (isMissingBlogTableError(error)) return [];
    throw error;
  }
});
