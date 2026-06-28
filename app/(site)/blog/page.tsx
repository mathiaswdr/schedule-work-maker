import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  Clock,
  LibraryBig,
} from "lucide-react";
import { getLocale } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildMarketingMetadata,
  localizedAbsoluteUrl,
  serializeJsonLd,
} from "@/lib/seo";
import { localizedPath } from "@/lib/i18n-routing";
import { formatBlogDate, getPublishedBlogPosts } from "@/server/blog";

const sectionLabel =
  "text-xs font-semibold uppercase tracking-[0.18em] text-brand";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isEnglish = locale === "en";

  return buildMarketingMetadata({
    title: isEnglish
      ? "Kronoma Blog | Freelance time tracking and invoicing"
      : "Blog Kronoma | Suivi du temps et facturation freelance",
    description: isEnglish
      ? "Practical guides to track time, invoice hours, and run a clearer freelance business with Kronoma."
      : "Guides pratiques pour suivre son temps, facturer ses heures et mieux piloter son activité freelance avec Kronoma.",
    path: "/blog",
    locale,
  });
}

export default async function BlogPage() {
  const locale = await getLocale();
  const contentLocale = locale === "en" ? "en" : "fr";
  const isEnglish = contentLocale === "en";
  const posts = await getPublishedBlogPosts(contentLocale);
  const canonicalUrl = localizedAbsoluteUrl("/blog", locale);
  const emptyTitle = isEnglish
    ? "No published articles yet."
    : "Aucun article publié pour le moment.";
  const emptyCopy = isEnglish
    ? "The first guides will appear here as soon as they are published."
    : "Les premiers guides apparaîtront ici dès qu'ils seront publiés.";
  const featuredPost = posts[0];
  const secondaryPosts = posts.slice(1);
  const totalReadingMinutes = posts.reduce(
    (total, post) => total + post.readingMinutes,
    0
  );
  const visibleTags = Array.from(
    new Set(posts.flatMap((post) => post.tags))
  ).slice(0, 5);
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog Kronoma",
    url: canonicalUrl,
    inLanguage: contentLocale,
    description: isEnglish
      ? "Practical guides for time tracking, freelance invoicing, and managing billable hours."
      : "Guides pratiques pour le suivi du temps, la facturation freelance et la gestion des heures travaillées.",
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: localizedAbsoluteUrl(`/blog/${post.slug}`, locale),
      datePublished: post.publishedAt?.toISOString(),
      dateModified: post.updatedAt.toISOString(),
      author: {
        "@type": "Organization",
        name: post.authorName,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-white text-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogJsonLd) }}
      />

      <section className="relative overflow-hidden border-b border-line bg-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.13),transparent_62%)]" />
        <div className="relative mx-auto grid w-full maxW gap-10 px-6 pb-14 pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:pb-20 lg:pt-36">
          <div className="max-w-3xl">
            <p className={sectionLabel}>Blog Kronoma</p>
            <h1 className="mt-3 text-4xl font-semibold leading-[1.06] text-ink sm:text-5xl lg:text-6xl">
              {isEnglish
                ? "Practical guides for a clearer freelance business."
                : "Guides pratiques pour piloter son activité avec plus de clarté."}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">
              {isEnglish
                ? "Articles for freelancers, consultants, and small teams who want to understand clients, projects, tracked time, expenses, and invoices without multiplying tools."
                : "Des articles pour freelances, consultants et petites structures qui veulent mieux suivre clients, projets, temps passé, frais et factures sans multiplier les outils."}
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {visibleTags.length > 0 ? (
                visibleTags.map((tag) => (
                  <Badge
                    key={tag}
                    className="border-line bg-brand/10 text-brand hover:bg-brand/10"
                  >
                    {tag}
                  </Badge>
                ))
              ) : (
                <Badge className="border-line bg-brand/10 text-brand hover:bg-brand/10">
                  {isEnglish ? "Freelance operations" : "Gestion freelance"}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Card className="border-line bg-white shadow-[0_18px_55px_-48px_rgba(29,27,22,0.38)]">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <LibraryBig className="h-5 w-5" />
                </div>
                <CardTitle className="text-3xl text-ink">
                  {posts.length}
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-ink-muted">
                  {isEnglish ? "published guides" : "guides publiés"}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-line bg-white shadow-[0_18px_55px_-48px_rgba(29,27,22,0.38)]">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-2/10 text-brand-2">
                  <Clock className="h-5 w-5" />
                </div>
                <CardTitle className="text-3xl text-ink">
                  {totalReadingMinutes || "-"}
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-ink-muted">
                  {isEnglish ? "minutes of reading" : "minutes de lecture"}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full maxW px-6 py-16">
        {posts.length > 0 ? (
          <div className="grid gap-5">
            {featuredPost ? (
              <article className="grid overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_28px_80px_-66px_rgba(29,27,22,0.42)] lg:grid-cols-[1.05fr_0.95fr]">
                <Link
                  href={localizedPath(`/blog/${featuredPost.slug}`, locale)}
                  className="relative min-h-[280px] overflow-hidden bg-ink-soft lg:min-h-[430px]"
                  aria-label={featuredPost.title}
                >
                  {featuredPost.coverImageUrl ? (
                    <Image
                      src={featuredPost.coverImageUrl}
                      alt={featuredPost.title}
                      fill
                      priority
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover transition duration-500 hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full min-h-[280px] items-center justify-center bg-neutral-50 text-brand">
                      <BookOpenText className="h-14 w-14" />
                    </div>
                  )}
                </Link>
                <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                  <div className="flex flex-wrap gap-2">
                    {featuredPost.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        className="border-line bg-brand/10 text-brand hover:bg-brand/10"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                    <Link href={localizedPath(`/blog/${featuredPost.slug}`, locale)}>
                      {featuredPost.title}
                    </Link>
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
                    {featuredPost.excerpt}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-ink-muted">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {formatBlogDate(
                        featuredPost.publishedAt,
                        isEnglish ? "en-US" : "fr-CH"
                      )}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {featuredPost.readingMinutes} min
                    </span>
                  </div>
                  <Button
                    asChild
                    className="mt-7 h-11 w-fit rounded-full bg-brand px-5 text-white hover:bg-brand/90"
                  >
                    <Link href={localizedPath(`/blog/${featuredPost.slug}`, locale)}>
                      {isEnglish ? "Read the latest guide" : "Lire le dernier guide"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </article>
            ) : null}

            {secondaryPosts.length > 0 ? (
              <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className={sectionLabel}>
                    {isEnglish ? "All articles" : "Tous les articles"}
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                    {isEnglish ? "Keep exploring" : "Continuer la lecture"}
                  </h2>
                </div>
                <p className="max-w-xl text-base leading-7 text-ink-muted">
                  {isEnglish
                    ? "Guides organized for quick scanning, then deeper reading when a topic matters."
                    : "Des guides faciles à parcourir rapidement, puis à lire en détail quand un sujet devient utile."}
                </p>
              </div>
            ) : null}

            {secondaryPosts.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {secondaryPosts.map((post) => (
                  <article
                    key={post.id}
                    className="group flex min-h-[430px] flex-col overflow-hidden rounded-lg border border-line bg-white shadow-[0_20px_60px_-52px_rgba(29,27,22,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_70px_-56px_rgba(29,27,22,0.62)]"
                  >
                    <Link
                      href={localizedPath(`/blog/${post.slug}`, locale)}
                      className="relative aspect-[16/10] w-full overflow-hidden bg-ink-soft"
                      aria-label={post.title}
                    >
                      {post.coverImageUrl ? (
                        <Image
                          src={post.coverImageUrl}
                          alt={post.title}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-neutral-50 text-brand">
                          <BookOpenText className="h-10 w-10" />
                        </div>
                      )}
                    </Link>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex flex-wrap gap-2">
                        {post.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            className="border-line bg-brand/10 text-brand hover:bg-brand/10"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="mt-5 text-xl font-semibold leading-snug text-ink">
                        <Link href={localizedPath(`/blog/${post.slug}`, locale)}>
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-3 flex-1 text-sm leading-6 text-ink-muted">
                        {post.excerpt}
                      </p>
                      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-ink-muted">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          {formatBlogDate(
                            post.publishedAt,
                            isEnglish ? "en-US" : "fr-CH"
                          )}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {post.readingMinutes} min
                        </span>
                      </div>
                      <Link
                        href={localizedPath(`/blog/${post.slug}`, locale)}
                        className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand transition hover:text-ink"
                      >
                        {isEnglish ? "Read article" : "Lire l'article"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <Card className="mx-auto max-w-2xl border-line bg-white text-center shadow-[0_20px_60px_-52px_rgba(29,27,22,0.55)]">
            <CardHeader>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <BookOpenText className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl text-ink">{emptyTitle}</CardTitle>
              <CardDescription className="mx-auto max-w-md text-sm leading-6 text-ink-muted">
                {emptyCopy}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>

      <section className="mx-auto w-full maxW px-6 pb-20">
        <div className="rounded-[28px] bg-ink px-6 py-9 text-center text-white shadow-[0_26px_90px_-64px_rgba(29,27,22,0.86)] sm:px-8">
          <h2 className="mx-auto max-w-2xl text-2xl font-semibold leading-tight sm:text-3xl">
            {isEnglish
              ? "Bring the guides into your daily workflow."
              : "Passez des guides à votre organisation quotidienne."}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/68 sm:text-base">
            {isEnglish
              ? "Kronoma helps turn clients, projects, time, expenses, and invoices into one clearer workspace."
              : "Kronoma vous aide à rassembler clients, projets, temps, frais et factures dans un espace plus clair."}
          </p>
          <div className="mt-6 flex w-full flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              className="h-11 rounded-full bg-brand px-5 text-white hover:bg-brand/90"
            >
              <Link href={localizedPath("/auth/login", locale)}>
                {isEnglish ? "Start free" : "Commencer gratuitement"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-full border-white/18 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href={localizedPath("/", locale)}>
                {isEnglish ? "Back to home" : "Retour à l'accueil"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
