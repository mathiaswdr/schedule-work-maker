"use server";

import { BlogPostStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";

import { getAdminActionError } from "@/server/admin-auth";
import { prisma } from "@/server/prisma";
import {
  BlogPostDeleteSchema,
  BlogPostImportSchema,
  BlogPostMutationSchema,
  BlogPostUpdateSchema,
} from "@/types/blog-post-schema";

const action = createSafeActionClient();

type BlogPostMutationValues = z.infer<typeof BlogPostMutationSchema>;

function cleanOptional(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getPublishedAt(
  values: BlogPostMutationValues,
  previous?: { publishedAt: Date | null },
) {
  if (values.status !== "PUBLISHED") return null;
  if (values.publishedAt) return new Date(values.publishedAt);
  return previous?.publishedAt ?? new Date();
}

function normalizeBlogPostData(
  values: BlogPostMutationValues,
  previous?: { publishedAt: Date | null },
) {
  return {
    translationKey: cleanOptional(values.translationKey) ?? values.slug,
    slug: values.slug,
    locale: values.locale,
    title: values.title,
    excerpt: values.excerpt,
    content: values.content as Prisma.InputJsonValue,
    coverImageUrl: cleanOptional(values.coverImageUrl),
    tags: Array.from(new Set(values.tags.map((tag) => tag.trim()).filter(Boolean))),
    authorName: values.authorName,
    readingMinutes: values.readingMinutes,
    metaTitle: cleanOptional(values.metaTitle),
    metaDescription: cleanOptional(values.metaDescription),
    status: values.status as BlogPostStatus,
    publishedAt: getPublishedAt(values, previous),
  };
}

function revalidateBlogPaths(...slugs: Array<string | null | undefined>) {
  revalidatePath("/my-studio-457");
  revalidatePath("/blog");

  for (const slug of slugs) {
    if (slug) {
      revalidatePath(`/blog/${slug}`);
    }
  }
}

function formatPrismaError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "Un article existe deja avec ce slug ou cette cle de traduction pour cette langue.";
  }

  return "L'action n'a pas pu aboutir.";
}

async function ensureAdminAction() {
  const error = await getAdminActionError();
  if (!error) return null;

  return error === "UNAUTHORIZED"
    ? "Connectez-vous pour acceder au studio."
    : "Vous n'avez pas acces au studio.";
}

export const createBlogPost = action
  .schema(BlogPostMutationSchema)
  .action(async ({ parsedInput: values }) => {
    const authError = await ensureAdminAction();
    if (authError) return { error: authError };

    try {
      const post = await prisma.blogPost.create({
        data: normalizeBlogPostData(values),
      });

      revalidateBlogPaths(post.slug);
      return { success: post };
    } catch (error) {
      return { error: formatPrismaError(error) };
    }
  });

export const updateBlogPost = action
  .schema(BlogPostUpdateSchema)
  .action(async ({ parsedInput: { id, ...values } }) => {
    const authError = await ensureAdminAction();
    if (authError) return { error: authError };

    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
      select: { slug: true, publishedAt: true },
    });

    if (!existingPost) {
      return { error: "Article introuvable." };
    }

    try {
      const post = await prisma.blogPost.update({
        where: { id },
        data: normalizeBlogPostData(values, existingPost),
      });

      revalidateBlogPaths(existingPost.slug, post.slug);
      return { success: post };
    } catch (error) {
      return { error: formatPrismaError(error) };
    }
  });

export const deleteBlogPost = action
  .schema(BlogPostDeleteSchema)
  .action(async ({ parsedInput: { id } }) => {
    const authError = await ensureAdminAction();
    if (authError) return { error: authError };

    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
      select: { slug: true },
    });

    if (!existingPost) {
      return { error: "Article introuvable." };
    }

    await prisma.blogPost.delete({ where: { id } });

    revalidateBlogPaths(existingPost.slug);
    return { success: true };
  });

export const importBlogPosts = action
  .schema(BlogPostImportSchema)
  .action(async ({ parsedInput: { articles } }) => {
    const authError = await ensureAdminAction();
    if (authError) return { error: authError };

    try {
      const posts = await prisma.$transaction(
        articles.map((article) =>
          prisma.blogPost.upsert({
            where: {
              locale_slug: {
                locale: article.locale,
                slug: article.slug,
              },
            },
            update: normalizeBlogPostData(article),
            create: normalizeBlogPostData(article),
          }),
        ),
      );

      revalidateBlogPaths(...posts.map((post) => post.slug));
      return { success: { importedCount: posts.length, posts } };
    } catch (error) {
      return { error: formatPrismaError(error) };
    }
  });
