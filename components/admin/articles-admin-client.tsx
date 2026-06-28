"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
  CheckCircle2,
  ExternalLink,
  FileJson,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { z } from "zod";

import {
  createBlogPost,
  deleteBlogPost,
  importBlogPosts,
  updateBlogPost,
} from "@/server/actions/blog-posts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BlogPostMutationSchema } from "@/types/blog-post-schema";

type BlogPostMutationPayload = z.infer<typeof BlogPostMutationSchema>;
type BlogStatus = "DRAFT" | "PUBLISHED";
type BlogLocale = "fr" | "en";

type AdminBlogPost = {
  id: string;
  translationKey: string;
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  content: unknown;
  coverImageUrl: string | null;
  tags: string[];
  authorName: string;
  readingMinutes: number;
  metaTitle: string | null;
  metaDescription: string | null;
  status: BlogStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type BlogFormState = {
  id: string | null;
  translationKey: string;
  slug: string;
  locale: BlogLocale;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  tags: string;
  authorName: string;
  readingMinutes: string;
  metaTitle: string;
  metaDescription: string;
  status: BlogStatus;
};

type ArticlesAdminClientProps = {
  initialPosts: AdminBlogPost[];
};

type BlogPostActionData = {
  error?: string;
  success?: AdminBlogPost;
};

type DeleteActionData = {
  error?: string;
  success?: boolean;
};

type ImportActionData = {
  error?: string;
  success?: {
    importedCount: number;
    posts?: AdminBlogPost[];
  };
};

const EMPTY_CONTENT = JSON.stringify(
  {
    intro: "Introduction courte de l'article.",
    sections: [
      {
        heading: "Titre de section",
        body: ["Premier paragraphe de la section."],
        bullets: ["Point important a retenir."],
      },
    ],
    faq: [
      {
        question: "Question frequente ?",
        answer: "Reponse courte et utile.",
      },
    ],
  },
  null,
  2,
);

const inputClassName =
  "rounded-xl border-line bg-white text-ink placeholder:text-ink-muted";
const labelClassName = "text-xs font-semibold uppercase text-ink-muted";

function createEmptyForm(): BlogFormState {
  return {
    id: null,
    translationKey: "",
    slug: "",
    locale: "fr",
    title: "",
    excerpt: "",
    content: EMPTY_CONTENT,
    coverImageUrl: "",
    tags: "",
    authorName: "Kronoma",
    readingMinutes: "4",
    metaTitle: "",
    metaDescription: "",
    status: "DRAFT",
  };
}

function formatDate(value: string | null) {
  if (!value) return "Non publie";

  return new Intl.DateTimeFormat("fr-CH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function normalizeReturnedPost(post: AdminBlogPost): AdminBlogPost {
  return {
    ...post,
    publishedAt: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : null,
    createdAt: new Date(post.createdAt).toISOString(),
    updatedAt: new Date(post.updatedAt).toISOString(),
  };
}

function formFromPost(post: AdminBlogPost): BlogFormState {
  return {
    id: post.id,
    translationKey: post.translationKey,
    slug: post.slug,
    locale: post.locale === "en" ? "en" : "fr",
    title: post.title,
    excerpt: post.excerpt,
    content: JSON.stringify(post.content, null, 2),
    coverImageUrl: post.coverImageUrl ?? "",
    tags: post.tags.join(", "),
    authorName: post.authorName,
    readingMinutes: String(post.readingMinutes),
    metaTitle: post.metaTitle ?? "",
    metaDescription: post.metaDescription ?? "",
    status: post.status,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === "string");
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeImportItem(item: unknown): BlogPostMutationPayload {
  if (!isRecord(item)) {
    throw new Error("Chaque article doit etre un objet JSON.");
  }

  return {
    translationKey: getString(item.translationKey) || undefined,
    slug: getString(item.slug),
    locale: getString(item.locale) === "en" ? "en" : "fr",
    title: getString(item.title),
    excerpt: getString(item.excerpt),
    content: isRecord(item.content) ? item.content : { intro: "", sections: [] },
    coverImageUrl: getString(item.coverImageUrl),
    tags: getTags(item.tags),
    authorName: getString(item.authorName) || "Kronoma",
    readingMinutes: Number(item.readingMinutes) || 4,
    metaTitle: getString(item.metaTitle),
    metaDescription: getString(item.metaDescription),
    status: getString(item.status) === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    publishedAt: getString(item.publishedAt) || null,
  } as BlogPostMutationPayload;
}

function getImportArticles(payload: unknown) {
  if (Array.isArray(payload)) return payload.map(normalizeImportItem);

  if (isRecord(payload) && Array.isArray(payload.articles)) {
    return payload.articles.map(normalizeImportItem);
  }

  return [normalizeImportItem(payload)];
}

export default function ArticlesAdminClient({
  initialPosts,
}: ArticlesAdminClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState(initialPosts);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<BlogFormState>(createEmptyForm);

  const stats = useMemo(() => {
    const published = posts.filter((post) => post.status === "PUBLISHED").length;
    return {
      total: posts.length,
      published,
      drafts: posts.length - published,
    };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return posts;

    return posts.filter((post) =>
      [post.title, post.slug, post.translationKey, post.locale, post.status]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [posts, query]);

  const upsertLocalPost = (post: AdminBlogPost) => {
    const normalizedPost = normalizeReturnedPost(post);
    setPosts((current) => {
      const exists = current.some((item) => item.id === normalizedPost.id);
      const nextPosts = exists
        ? current.map((item) =>
            item.id === normalizedPost.id ? normalizedPost : item,
          )
        : [normalizedPost, ...current];

      return nextPosts.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    });
  };

  const { execute: executeCreate, status: createStatus } = useAction(
    createBlogPost,
    {
      onSuccess: ({ data }) => {
        const result = data as BlogPostActionData | undefined;
        if (result?.error) {
          toast.error(result.error);
          return;
        }

        if (result?.success) {
          upsertLocalPost(result.success);
          setForm(createEmptyForm());
          toast.success("Article cree.");
          router.refresh();
        }
      },
    },
  );

  const { execute: executeUpdate, status: updateStatus } = useAction(
    updateBlogPost,
    {
      onSuccess: ({ data }) => {
        const result = data as BlogPostActionData | undefined;
        if (result?.error) {
          toast.error(result.error);
          return;
        }

        if (result?.success) {
          upsertLocalPost(result.success);
          setForm(formFromPost(normalizeReturnedPost(result.success)));
          toast.success("Article mis a jour.");
          router.refresh();
        }
      },
    },
  );

  const { execute: executeDelete, status: deleteStatus } = useAction(
    deleteBlogPost,
    {
      onSuccess: ({ data, input }) => {
        const result = data as DeleteActionData | undefined;
        if (result?.error) {
          toast.error(result.error);
          return;
        }

        if (result?.success) {
          setPosts((current) => current.filter((post) => post.id !== input.id));
          if (form.id === input.id) {
            setForm(createEmptyForm());
          }
          toast.success("Article supprime.");
          router.refresh();
        }
      },
    },
  );

  const { execute: executeImport, status: importStatus } = useAction(
    importBlogPosts,
    {
      onSuccess: ({ data }) => {
        const result = data as ImportActionData | undefined;
        if (result?.error) {
          toast.error(result.error);
          return;
        }

        if (result?.success) {
          if (result.success.posts?.length) {
            for (const post of result.success.posts) {
              upsertLocalPost(post);
            }
          }
          toast.success(`${result.success.importedCount} article(s) importe(s).`);
          router.refresh();
        }
      },
    },
  );

  const isSubmitting =
    createStatus === "executing" || updateStatus === "executing";
  const isDeleting = deleteStatus === "executing";
  const isImporting = importStatus === "executing";
  const isEditing = Boolean(form.id);

  const updateField = <T extends keyof BlogFormState>(
    field: T,
    value: BlogFormState[T],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const buildPayload = () => {
    let content: unknown;
    try {
      content = JSON.parse(form.content);
    } catch {
      toast.error("Le contenu doit etre un JSON valide.");
      return null;
    }

    const payload = {
      translationKey: form.translationKey.trim() || undefined,
      slug: form.slug.trim(),
      locale: form.locale,
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content,
      coverImageUrl: form.coverImageUrl.trim(),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      authorName: form.authorName.trim() || "Kronoma",
      readingMinutes: Number(form.readingMinutes) || 4,
      metaTitle: form.metaTitle.trim(),
      metaDescription: form.metaDescription.trim(),
      status: form.status,
    } as BlogPostMutationPayload;

    return payload;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = buildPayload();
    if (!payload) return;

    if (form.id) {
      executeUpdate({ id: form.id, ...payload });
      return;
    }

    executeCreate(payload);
  };

  const handleEdit = (post: AdminBlogPost) => {
    setForm(formFromPost(post));
    document.getElementById("article-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleDelete = (post: AdminBlogPost) => {
    if (!window.confirm(`Supprimer "${post.title}" ?`)) return;
    executeDelete({ id: post.id });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const isJson =
      file.name.toLowerCase().endsWith(".json") &&
      (!file.type || file.type === "application/json");

    if (!isJson) {
      toast.error("Import refuse: seul un fichier .json est accepte.");
      return;
    }

    try {
      const parsed = JSON.parse(await file.text());
      const articles = getImportArticles(parsed);
      executeImport({ articles });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de lire ce fichier JSON.",
      );
    }
  };

  return (
    <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <header className="flex flex-col gap-5 border-b border-line pb-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase text-ink-muted">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">
              Gestion des articles
            </h1>
            <p className="mt-3 text-sm leading-6 text-ink-muted sm:text-base">
              Creer, modifier et importer les articles affiches sur le blog
              public Kronoma.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
            <div className="rounded-2xl border border-line bg-white/75 p-4">
              <p className="text-xs uppercase text-ink-muted">Total</p>
              <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-line bg-white/75 p-4">
              <p className="text-xs uppercase text-ink-muted">Publies</p>
              <p className="mt-2 text-2xl font-semibold text-brand-2">
                {stats.published}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-white/75 p-4">
              <p className="text-xs uppercase text-ink-muted">Brouillons</p>
              <p className="mt-2 text-2xl font-semibold text-brand">
                {stats.drafts}
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-start">
          <section className="min-w-0 space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white/75 p-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher un article"
                  className={`${inputClassName} pl-9`}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleImportClick}
                  disabled={isImporting}
                  className="gap-2 rounded-xl border-line bg-white"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Importer JSON
                </Button>
                <Button
                  type="button"
                  onClick={() => setForm(createEmptyForm())}
                  className="gap-2 rounded-xl bg-brand text-white hover:bg-brand/90"
                >
                  <Plus className="h-4 w-4" />
                  Nouvel article
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white/75">
              <div className="flex items-center gap-2 border-b border-line px-4 py-3 text-sm text-ink-muted">
                <FileJson className="h-4 w-4" />
                Import accepte uniquement les fichiers `.json`.
              </div>

              {filteredPosts.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-soft">
                    <FileText className="h-5 w-5 text-ink-muted" />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold">
                    Aucun article trouve
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-ink-muted">
                    Creez un premier article ou importez un fichier JSON avec
                    une propriete `articles`.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {filteredPosts.map((post) => (
                    <article
                      key={post.id}
                      className="grid gap-4 px-4 py-4 transition hover:bg-white md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              post.status === "PUBLISHED"
                                ? "bg-brand-2/10 text-brand-2"
                                : "bg-brand/10 text-brand"
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {post.status === "PUBLISHED"
                              ? "Publie"
                              : "Brouillon"}
                          </span>
                          <span className="rounded-full bg-ink-soft px-2.5 py-1 text-xs font-semibold uppercase text-ink-muted">
                            {post.locale}
                          </span>
                          <span className="text-xs text-ink-muted">
                            {formatDate(post.publishedAt)}
                          </span>
                        </div>
                        <h2 className="mt-3 truncate text-base font-semibold text-ink">
                          {post.title}
                        </h2>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-muted">
                          {post.excerpt}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-muted">
                          <span>/{post.slug}</span>
                          <span>{post.readingMinutes} min</span>
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-white px-2 py-0.5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 md:justify-end">
                        {post.status === "PUBLISHED" ? (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="gap-2 rounded-xl border-line bg-white"
                          >
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                              Voir
                            </Link>
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(post)}
                          className="gap-2 rounded-xl border-line bg-white"
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(post)}
                          disabled={isDeleting}
                          className="gap-2 rounded-xl border-line bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section
            id="article-form"
            className="rounded-2xl border border-line bg-white/75 p-5 xl:sticky xl:top-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase text-ink-muted">
                  {isEditing ? "Edition" : "Creation"}
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {isEditing ? "Modifier l'article" : "Nouvel article"}
                </h2>
              </div>
              {isEditing ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm(createEmptyForm())}
                  className="gap-2 rounded-xl border-line bg-white"
                >
                  <X className="h-4 w-4" />
                  Annuler
                </Button>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={labelClassName} htmlFor="article-locale">
                    Langue
                  </label>
                  <select
                    id="article-locale"
                    value={form.locale}
                    onChange={(event) =>
                      updateField("locale", event.target.value as BlogLocale)
                    }
                    className={`${inputClassName} flex h-10 w-full px-3 text-sm`}
                  >
                    <option value="fr">Francais</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelClassName} htmlFor="article-status">
                    Statut
                  </label>
                  <select
                    id="article-status"
                    value={form.status}
                    onChange={(event) =>
                      updateField("status", event.target.value as BlogStatus)
                    }
                    className={`${inputClassName} flex h-10 w-full px-3 text-sm`}
                  >
                    <option value="DRAFT">Brouillon</option>
                    <option value="PUBLISHED">Publie</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClassName} htmlFor="article-title">
                  Titre
                </label>
                <Input
                  id="article-title"
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  required
                  className={inputClassName}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={labelClassName} htmlFor="article-slug">
                    Slug
                  </label>
                  <Input
                    id="article-slug"
                    value={form.slug}
                    onChange={(event) => updateField("slug", event.target.value)}
                    required
                    placeholder="mon-article"
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClassName} htmlFor="article-key">
                    Cle traduction
                  </label>
                  <Input
                    id="article-key"
                    value={form.translationKey}
                    onChange={(event) =>
                      updateField("translationKey", event.target.value)
                    }
                    placeholder="laisser vide = slug"
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClassName} htmlFor="article-excerpt">
                  Extrait
                </label>
                <Textarea
                  id="article-excerpt"
                  value={form.excerpt}
                  onChange={(event) => updateField("excerpt", event.target.value)}
                  required
                  rows={3}
                  className={inputClassName}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={labelClassName} htmlFor="article-tags">
                    Tags
                  </label>
                  <Input
                    id="article-tags"
                    value={form.tags}
                    onChange={(event) => updateField("tags", event.target.value)}
                    placeholder="SEO, Freelance"
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClassName} htmlFor="article-reading">
                    Lecture min
                  </label>
                  <Input
                    id="article-reading"
                    type="number"
                    min={1}
                    max={90}
                    value={form.readingMinutes}
                    onChange={(event) =>
                      updateField("readingMinutes", event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClassName} htmlFor="article-cover">
                  Image de couverture
                </label>
                <Input
                  id="article-cover"
                  value={form.coverImageUrl}
                  onChange={(event) =>
                    updateField("coverImageUrl", event.target.value)
                  }
                  placeholder="https://..."
                  className={inputClassName}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={labelClassName} htmlFor="article-author">
                    Auteur
                  </label>
                  <Input
                    id="article-author"
                    value={form.authorName}
                    onChange={(event) =>
                      updateField("authorName", event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClassName} htmlFor="article-meta-title">
                    Meta title
                  </label>
                  <Input
                    id="article-meta-title"
                    value={form.metaTitle}
                    onChange={(event) =>
                      updateField("metaTitle", event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className={labelClassName}
                  htmlFor="article-meta-description"
                >
                  Meta description
                </label>
                <Textarea
                  id="article-meta-description"
                  value={form.metaDescription}
                  onChange={(event) =>
                    updateField("metaDescription", event.target.value)
                  }
                  rows={2}
                  className={inputClassName}
                />
              </div>

              <div className="space-y-2">
                <label className={labelClassName} htmlFor="article-content">
                  Contenu JSON
                </label>
                <Textarea
                  id="article-content"
                  value={form.content}
                  onChange={(event) => updateField("content", event.target.value)}
                  required
                  rows={13}
                  spellCheck={false}
                  className={`${inputClassName} font-mono text-xs leading-5`}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full gap-2 rounded-xl bg-brand text-white hover:bg-brand/90"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isEditing ? "Enregistrer les changements" : "Creer l'article"}
              </Button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
