import "dotenv/config";

import fs from "node:fs";
import { BlogPostStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Locale = "fr" | "en";

type ImportedArticle = {
  id: string;
  status?: string;
  suggestedPublishDate?: string;
  author?: {
    name?: string;
  };
  tags?: string[];
  image?: {
    provider?: string;
    sourceUrl?: string;
    downloadUrl?: string;
    alt?: Partial<Record<Locale, string>>;
  };
  locales: Partial<Record<Locale, ImportedLocaleContent>>;
};

type ImportedLocaleContent = {
  title: string;
  slug: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  readTimeMinutes?: number;
  content: string;
  faq?: {
    question: string;
    answer: string;
  }[];
};

type BlogSection = {
  heading: string;
  body: string[];
  bullets?: string[];
};

function usage() {
  return [
    "Usage: npm run seed:blog:file -- <path-to-json> [--publish]",
    "",
    "--publish imports the articles as PUBLISHED. Without it, source draft status is respected.",
  ].join("\n");
}

function isLocale(value: string): value is Locale {
  return value === "fr" || value === "en";
}

function assertImportShape(value: unknown): asserts value is { articles: ImportedArticle[] } {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as { articles?: unknown }).articles)
  ) {
    throw new Error("JSON invalide: la propriete articles[] est requise.");
  }
}

function normalizeStatus(status: string | undefined, forcePublish: boolean) {
  if (forcePublish) return BlogPostStatus.PUBLISHED;
  return status?.toLowerCase() === "published"
    ? BlogPostStatus.PUBLISHED
    : BlogPostStatus.DRAFT;
}

function parsePublishedAt(value: string | undefined) {
  if (!value) return new Date();

  const date = new Date(`${value}T08:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function cleanMarkdownLine(line: string) {
  return line
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .trim();
}

function parseMarkdownContent(markdown: string, faqHeadings: string[]) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const introLines: string[] = [];
  const sections: BlogSection[] = [];
  let current: BlogSection | null = null;
  let inFaq = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("# ")) continue;

    if (line.startsWith("## ")) {
      const heading = cleanMarkdownLine(line.replace(/^##\s+/, ""));
      inFaq = faqHeadings.some(
        (faqHeading) => heading.toLowerCase() === faqHeading.toLowerCase(),
      );
      current = inFaq ? null : { heading, body: [] };
      if (current) sections.push(current);
      continue;
    }

    if (inFaq || line.startsWith("### ")) continue;

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch && current) {
      current.bullets = [...(current.bullets ?? []), cleanMarkdownLine(bulletMatch[1])];
      continue;
    }

    const paragraph = cleanMarkdownLine(line);
    if (!paragraph) continue;

    if (current) {
      current.body.push(paragraph);
    } else {
      introLines.push(paragraph);
    }
  }

  return {
    intro: introLines.join("\n\n"),
    sections: sections.filter((section) => section.heading && section.body.length > 0),
  };
}

function buildCta(locale: Locale) {
  return locale === "en"
    ? {
        title: "Keep freelance work clear with Kronoma.",
        body: "Track time, clients, projects, expenses, and invoices in one workflow.",
        href: "/pricing",
        label: "See plans",
      }
    : {
        title: "Gardez une activite freelance lisible avec Kronoma.",
        body: "Suivez le temps, les clients, les projets, les depenses et les factures dans un meme flux.",
        href: "/pricing",
        label: "Voir les offres",
      };
}

async function resolveImageUrl(article: ImportedArticle) {
  const imageUrl = article.image?.downloadUrl || article.image?.sourceUrl;
  if (!imageUrl) return null;

  try {
    const response = await fetch(imageUrl, {
      method: "HEAD",
      redirect: "follow",
    });

    return response.url || imageUrl;
  } catch {
    return imageUrl;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const jsonPath = args.find((arg) => !arg.startsWith("--"));
  const forcePublish = args.includes("--publish");

  if (!jsonPath) {
    throw new Error(usage());
  }

  const input = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  assertImportShape(input);

  let upserted = 0;
  const statusByLocale = new Map<string, number>();

  for (const article of input.articles) {
    const coverImageUrl = await resolveImageUrl(article);
    const status = normalizeStatus(article.status, forcePublish);
    const publishedAt = parsePublishedAt(article.suggestedPublishDate);

    for (const [locale, localized] of Object.entries(article.locales)) {
      if (!isLocale(locale) || !localized) continue;

      const faqHeadings =
        locale === "en"
          ? ["Frequently asked questions"]
          : ["Questions frequentes", "Questions fréquentes"];
      const parsedContent = parseMarkdownContent(localized.content, faqHeadings);
      const content = {
        ...parsedContent,
        faq: localized.faq ?? [],
        cta: buildCta(locale),
      };

      await prisma.blogPost.upsert({
        where: {
          locale_slug: {
            locale,
            slug: localized.slug,
          },
        },
        update: {
          translationKey: article.id,
          title: localized.title,
          excerpt: localized.excerpt,
          content,
          coverImageUrl,
          tags: article.tags ?? [],
          authorName: article.author?.name ?? "Kronoma",
          readingMinutes: localized.readTimeMinutes ?? 6,
          metaTitle: localized.metaTitle,
          metaDescription: localized.metaDescription,
          status,
          publishedAt,
        },
        create: {
          translationKey: article.id,
          locale,
          slug: localized.slug,
          title: localized.title,
          excerpt: localized.excerpt,
          content,
          coverImageUrl,
          tags: article.tags ?? [],
          authorName: article.author?.name ?? "Kronoma",
          readingMinutes: localized.readTimeMinutes ?? 6,
          metaTitle: localized.metaTitle,
          metaDescription: localized.metaDescription,
          status,
          publishedAt,
        },
      });

      upserted += 1;
      statusByLocale.set(`${locale}:${status}`, (statusByLocale.get(`${locale}:${status}`) ?? 0) + 1);
    }
  }

  const total = await prisma.blogPost.count();
  const published = await prisma.blogPost.count({
    where: { status: BlogPostStatus.PUBLISHED },
  });

  console.log(`Articles importes ou mis a jour: ${upserted}`);
  console.log(`Repartition import: ${JSON.stringify(Object.fromEntries(statusByLocale))}`);
  console.log(`Total en base: ${total} articles, dont ${published} publies.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
