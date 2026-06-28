import type { Metadata } from "next";
import Link from "next/link";
import { FileText, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Space_Grotesk } from "next/font/google";

import ArticlesAdminClient from "@/components/admin/articles-admin-client";
import { serializeForClient } from "@/lib/utils";
import { getAdminSession } from "@/server/admin-auth";
import { prisma } from "@/server/prisma";

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Studio Kronoma",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminStudioPage() {
  const [session, posts] = await Promise.all([
    getAdminSession(),
    prisma.blogPost.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        translationKey: true,
        slug: true,
        locale: true,
        title: true,
        excerpt: true,
        content: true,
        coverImageUrl: true,
        tags: true,
        authorName: true,
        readingMinutes: true,
        metaTitle: true,
        metaDescription: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return (
    <div className={`${body.className} min-h-screen bg-paper text-ink`}>
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-line bg-white/75 px-4 py-4 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 lg:sticky lg:top-6 lg:block">
            <div>
              <Link href="/my-studio-457" className="inline-flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-white">
                  <LayoutDashboard className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-xs uppercase text-ink-muted">
                    Kronoma
                  </span>
                  <span className="block text-lg font-semibold leading-tight">
                    Studio
                  </span>
                </span>
              </Link>
              <p className="mt-3 hidden text-sm leading-6 text-ink-muted lg:block">
                Gestion interne des contenus publics.
              </p>
            </div>

            <nav className="flex items-center gap-2 lg:mt-8 lg:block lg:space-y-2">
              <Link
                href="/my-studio-457"
                className="inline-flex items-center gap-3 rounded-2xl border border-line-strong bg-white px-3 py-2 text-sm font-semibold text-ink shadow-[0_18px_40px_-32px_rgba(15,118,110,0.45)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <FileText className="h-4 w-4" />
                </span>
                Articles
              </Link>
            </nav>

            <div className="mt-8 hidden rounded-2xl border border-line bg-white/80 p-4 text-sm text-ink-muted lg:block">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-brand-2" />
                Acces admin
              </div>
              <p className="mt-2 leading-6">
                Connecte en tant que {session.user.email}.
              </p>
            </div>
          </div>
        </aside>

        <ArticlesAdminClient
          initialPosts={serializeForClient(posts)}
        />
      </div>
    </div>
  );
}
