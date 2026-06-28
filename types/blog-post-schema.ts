import { z } from "zod";

export const BlogPostStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);
export const BlogPostLocaleSchema = z.enum(["fr", "en"]);

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

const optionalUrl = z
  .string()
  .trim()
  .url()
  .or(z.literal(""))
  .optional()
  .nullable();

export const BlogContentSchema = z
  .object({
    intro: z.string().trim().max(2000).default(""),
    sections: z
      .array(
        z.object({
          heading: z.string().trim().min(1).max(180),
          body: z.array(z.string().trim().min(1).max(3000)).min(1).max(12),
          bullets: z.array(z.string().trim().min(1).max(400)).max(12).optional(),
        }),
      )
      .max(24)
      .default([]),
    faq: z
      .array(
        z.object({
          question: z.string().trim().min(1).max(220),
          answer: z.string().trim().min(1).max(1200),
        }),
      )
      .max(12)
      .optional(),
    cta: z
      .object({
        title: z.string().trim().min(1).max(160),
        body: z.string().trim().min(1).max(700),
        href: z.string().trim().min(1).max(240),
        label: z.string().trim().min(1).max(80),
      })
      .optional(),
  })
  .passthrough();

export const BlogPostMutationSchema = z.object({
  translationKey: z
    .string()
    .trim()
    .max(160)
    .optional()
    .nullable(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Use a lowercase slug with hyphens.",
    }),
  locale: BlogPostLocaleSchema.default("fr"),
  title: z.string().trim().min(1).max(220),
  excerpt: z.string().trim().min(1).max(520),
  content: BlogContentSchema,
  coverImageUrl: optionalUrl,
  tags: z.array(z.string().trim().min(1).max(48)).max(12).default([]),
  authorName: z.string().trim().min(1).max(120).default("Kronoma"),
  readingMinutes: z.coerce.number().int().min(1).max(90).default(4),
  metaTitle: optionalText(220),
  metaDescription: optionalText(520),
  status: BlogPostStatusSchema.default("DRAFT"),
  publishedAt: z.string().datetime().optional().nullable(),
});

export const BlogPostUpdateSchema = BlogPostMutationSchema.extend({
  id: z.string().cuid(),
});

export const BlogPostDeleteSchema = z.object({
  id: z.string().cuid(),
});

export const BlogPostImportSchema = z.object({
  articles: z.array(BlogPostMutationSchema).min(1).max(50),
});
