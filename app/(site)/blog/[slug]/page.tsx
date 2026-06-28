import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { getLocale } from "next-intl/server";

import ScrollSectionButton from "@/components/ui/scroll-section-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildRobots,
  localizedAbsoluteUrl,
  serializeJsonLd,
} from "@/lib/seo";
import {
  localeMetadata,
  localizedPath,
  normalizeLocale,
} from "@/lib/i18n-routing";
import {
  formatBlogDate,
  getPublishedBlogPost,
  getPublishedBlogPostTranslations,
  getRelatedBlogPosts,
  parseBlogContent,
} from "@/server/blog";

type BlogArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

const BLOG_SECTION_OFFSET = -104;
const sectionLabel =
  "text-xs font-semibold uppercase tracking-[0.18em] text-brand";

function headingId(heading: string) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const normalizedLocale = normalizeLocale(locale);
  const post = await getPublishedBlogPost(slug, normalizedLocale);

  if (!post) {
    return {
      title: normalizedLocale === "en"
        ? "Article not found | Kronoma"
        : "Article introuvable | Kronoma",
      robots: buildRobots(false),
    };
  }

  const title = post.metaTitle ?? `${post.title} | Kronoma`;
  const description = post.metaDescription ?? post.excerpt;
  const canonical = localizedAbsoluteUrl(`/blog/${post.slug}`, normalizedLocale);
  const translations = await getPublishedBlogPostTranslations(post.translationKey);
  const languages = translations.reduce<Record<string, string>>(
    (acc, translation) => {
      const translationLocale = normalizeLocale(translation.locale);
      acc[localeMetadata[translationLocale].htmlLang] = localizedAbsoluteUrl(
        `/blog/${translation.slug}`,
        translationLocale,
      );
      return acc;
    },
    {},
  );
  const defaultTranslation =
    translations.find((translation) => translation.locale === "fr") ?? post;
  languages["x-default"] = localizedAbsoluteUrl(
    `/blog/${defaultTranslation.slug}`,
    "fr",
  );

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    robots: buildRobots(true),
    openGraph: {
      type: "article",
      locale: localeMetadata[normalizedLocale].ogLocale,
      url: canonical,
      siteName: "Kronoma",
      title,
      description,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.authorName],
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const locale = normalizeLocale(await getLocale());
  const post = await getPublishedBlogPost(slug, locale);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedBlogPosts(post.translationKey, locale);

  const isEnglish = locale === "en";
  const content = parseBlogContent(post.content);
  const canonicalUrl = localizedAbsoluteUrl(`/blog/${post.slug}`, locale);
  const articleJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.metaDescription ?? post.excerpt,
      url: canonicalUrl,
      inLanguage: post.locale,
      datePublished: post.publishedAt?.toISOString(),
      dateModified: post.updatedAt.toISOString(),
      author: {
        "@type": "Organization",
        name: post.authorName,
      },
      publisher: {
        "@type": "Organization",
        name: "Kronoma",
        url: localizedAbsoluteUrl("/", locale),
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonicalUrl,
      },
      image: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: isEnglish ? "Home" : "Accueil",
          item: localizedAbsoluteUrl("/", locale),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: localizedAbsoluteUrl("/blog", locale),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post.title,
          item: canonicalUrl,
        },
      ],
    },
    content.faq?.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: content.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null,
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-white text-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
      />
      <article>
        <header className="relative overflow-hidden border-b border-line bg-white">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.13),transparent_62%)]" />
          <div className="relative mx-auto w-full maxW px-6 pb-14 pt-32 lg:pb-20 lg:pt-36">
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-full border-line-strong bg-white/70 px-4 text-sm font-semibold text-ink hover:bg-white"
            >
              <Link href={localizedPath("/blog", locale)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {isEnglish ? "Back to blog" : "Retour au blog"}
              </Link>
            </Button>

            <div className="mt-8 max-w-4xl">
              <p className={sectionLabel}>Blog Kronoma</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="border-line bg-brand/10 text-brand hover:bg-brand/10"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.06] text-ink sm:text-5xl lg:text-6xl">
                {post.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-ink-muted sm:text-lg">
                {post.excerpt}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-ink-muted">
                <span className="font-medium text-ink">{post.authorName}</span>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {formatBlogDate(post.publishedAt, isEnglish ? "en-US" : "fr-CH")}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {isEnglish
                    ? `${post.readingMinutes} min read`
                    : `${post.readingMinutes} min de lecture`}
                </span>
              </div>
            </div>

            {post.coverImageUrl ? (
              <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-[28px] border border-line bg-ink-soft shadow-[0_28px_80px_-66px_rgba(29,27,22,0.42)]">
                <Image
                  src={post.coverImageUrl}
                  alt={post.title}
                  fill
                  priority
                  sizes="(min-width: 1280px) 1180px, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="mt-10 flex aspect-[16/9] w-full items-center justify-center rounded-[28px] border border-line bg-neutral-50 text-brand shadow-[0_28px_80px_-66px_rgba(29,27,22,0.42)]">
                <BookOpenText className="h-14 w-14" />
              </div>
            )}
          </div>
        </header>

        <div className="mx-auto grid w-full maxW gap-8 px-6 py-16 lg:grid-cols-[minmax(0,760px)_minmax(280px,1fr)] lg:gap-10">
          <div className="min-w-0">
            <div className="rounded-[28px] border border-line bg-white p-6 shadow-[0_28px_80px_-66px_rgba(29,27,22,0.42)] sm:p-8 lg:p-10">
              {content.intro ? (
                <p className="border-l-4 border-brand bg-brand/5 py-4 pl-5 text-lg font-medium leading-8 text-ink">
                  {content.intro}
                </p>
              ) : null}

              <div className={content.intro ? "mt-10 space-y-12" : "space-y-12"}>
                {content.sections.map((section) => (
                  <section key={section.heading} id={headingId(section.heading)}>
                    <h2 className="text-2xl font-semibold leading-tight text-ink sm:text-3xl">
                      {section.heading}
                    </h2>
                    <div className="mt-4 space-y-4">
                      {section.body.map((paragraph) => (
                        <p
                          key={paragraph}
                          className="text-base leading-8 text-ink-muted"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    {section.bullets?.length ? (
                      <ul className="mt-6 grid gap-3">
                        {section.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="flex gap-3 text-base leading-7 text-ink-muted"
                          >
                            <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-brand" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>

              {content.faq?.length ? (
                <section className="mt-12 border-t border-line pt-10">
                  <p className={sectionLabel}>FAQ</p>
                  <h2 className="mt-3 text-2xl font-semibold leading-tight text-ink sm:text-3xl">
                    {isEnglish ? "Frequently asked questions" : "Questions fréquentes"}
                  </h2>
                  <div className="mt-6 grid gap-4">
                    {content.faq.map((item) => (
                      <Card key={item.question} className="border-line bg-white">
                        <CardHeader>
                          <CardTitle className="text-base leading-6 text-ink">
                            {item.question}
                          </CardTitle>
                          <CardDescription className="mt-2 text-sm leading-6 text-ink-muted">
                            {item.answer}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </section>
              ) : null}

              {content.cta ? (
                <section className="mt-12 rounded-[28px] bg-ink px-6 py-8 text-white shadow-[0_26px_90px_-64px_rgba(29,27,22,0.86)] sm:px-8">
                  <h2 className="max-w-2xl text-2xl font-semibold leading-tight sm:text-3xl">
                    {content.cta.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68 sm:text-base">
                    {content.cta.body}
                  </p>
                  <Button
                    asChild
                    className="mt-6 h-11 rounded-full bg-brand px-5 text-white hover:bg-brand/90"
                  >
                    <Link href={localizedPath(content.cta.href, locale)}>
                      {content.cta.label}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </section>
              ) : null}
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <Card className="border-line bg-white shadow-[0_18px_55px_-48px_rgba(29,27,22,0.38)]">
              <CardHeader>
                <p className={sectionLabel}>
                  {isEnglish ? "In this article" : "Dans cet article"}
                </p>
                <nav className="mt-4 flex flex-col gap-2">
                  {content.sections.map((section) => (
                    <ScrollSectionButton
                      key={section.heading}
                      sectionId={headingId(section.heading)}
                      offsetY={BLOG_SECTION_OFFSET}
                      className="rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-muted transition hover:bg-ink-soft hover:text-ink"
                    >
                      {section.heading}
                    </ScrollSectionButton>
                  ))}
                </nav>
              </CardHeader>
            </Card>

            {relatedPosts.length ? (
              <Card className="mt-5 border-line bg-white shadow-[0_18px_55px_-48px_rgba(29,27,22,0.38)]">
                <CardHeader>
                  <p className={sectionLabel}>
                    {isEnglish ? "Recent articles" : "Articles récents"}
                  </p>
                  <div className="mt-4 grid gap-4">
                    {relatedPosts.map((relatedPost) => (
                      <Link
                        key={relatedPost.id}
                        href={localizedPath(`/blog/${relatedPost.slug}`, locale)}
                        className="group grid gap-3 rounded-lg border border-line bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-[0_18px_55px_-48px_rgba(29,27,22,0.38)]"
                      >
                        {relatedPost.coverImageUrl ? (
                          <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-ink-soft">
                            <Image
                              src={relatedPost.coverImageUrl}
                              alt={relatedPost.title}
                              fill
                              sizes="280px"
                              className="object-cover transition duration-500 group-hover:scale-[1.03]"
                            />
                          </div>
                        ) : null}
                        <span className="text-sm font-semibold leading-6 text-ink transition group-hover:text-brand">
                          {relatedPost.title}
                        </span>
                        <span className="inline-flex items-center gap-2 text-xs text-ink-muted">
                          <Clock className="h-4 w-4" />
                          {relatedPost.readingMinutes} min
                        </span>
                      </Link>
                    ))}
                  </div>
                </CardHeader>
              </Card>
            ) : null}
          </aside>
        </div>
      </article>
    </main>
  );
}
