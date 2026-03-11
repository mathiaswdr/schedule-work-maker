"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { pickVariants } from "@/lib/motion-variants";
import { useAction } from "next-safe-action/hooks";
import { FolderKanban, Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { deleteProject } from "@/server/actions/projects";
import ProjectFormDialog from "@/components/dashboard/project-form-dialog";
import ServiceTypeFormDialog from "@/components/dashboard/service-type-form-dialog";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

type ProjectItem = {
  id: string;
  name: string;
  description: string | null;
  clientId: string | null;
  serviceTypeId: string | null;
  client: { id: string; name: string; color: string | null } | null;
  serviceType: { id: string; name: string; color: string | null } | null;
  _count: { workSessions: number };
};

type ProjectsClientProps = {
  displayClassName: string;
  initialProjects?: ProjectItem[];
};

export default function ProjectsClient({ displayClassName, initialProjects }: ProjectsClientProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const shouldReduceMotion = useReducedMotion();
  const { confirm, ConfirmDialogElement } = useConfirm();
  const hasInitialProjects = initialProjects !== undefined;
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects ?? []);
  const [isLoading, setIsLoading] = useState(!hasInitialProjects);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [serviceTypeDialogOpen, setServiceTypeDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  const { execute: executeDelete } = useAction(deleteProject, {
    onSuccess: () => {
      toast.success(t("projects.deleted"));
      fetchProjects();
    },
  });

  const fetchProjects = async () => {
    const response = await fetch("/api/projects", { cache: "no-store" });
    const payload = await response.json();
    setProjects(payload.projects);
  };

  useEffect(() => {
    if (hasInitialProjects) return;

    let isMounted = true;
    fetchProjects()
      .catch(() => null)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [hasInitialProjects]);

  const handleEdit = (project: ProjectItem) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProject(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t("projects.deleteProject"),
      description: t("projects.deleteConfirm"),
      confirmLabel: tc("delete"),
      cancelLabel: tc("cancel"),
    });
    if (ok) executeDelete({ id });
  };

  const v = pickVariants(shouldReduceMotion);

  return (
    <main className="w-full">
      <div className="relative overflow-hidden rounded-[32px] border border-line bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,118,110,0.45)] sm:p-8">
        <div className="pointer-events-none absolute -top-24 right-[-6rem] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(15,118,110,0.22),transparent_60%)] blur-2xl will-change-transform" />
        <div className="pointer-events-none absolute bottom-[-12rem] left-[-6rem] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(249,115,22,0.22),transparent_60%)] blur-3xl will-change-transform" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(29,27,22,0.07)_1px,transparent_0)] bg-[length:18px_18px] opacity-30 will-change-transform" />

        <motion.div
          className="relative z-10 space-y-8"
          variants={v.container}
          initial="hidden"
          animate="show"
        >
          <motion.section
            variants={v.fadeUp}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                {t("eyebrow")}
              </p>
              <h1 className={`${displayClassName} text-2xl font-semibold sm:text-3xl`}>
                {t("projects.title")}
              </h1>
              <p className="max-w-xl text-sm text-ink-muted sm:text-base">
                {t("projects.subtitle")}
              </p>
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => setServiceTypeDialogOpen(true)}
                className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-line bg-white/80 px-4 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-white hover:text-ink sm:flex-none"
              >
                <Settings2 className="h-4 w-4" />
                {t("projects.manageServiceTypes")}
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:bg-brand/90 sm:flex-none"
              >
                <Plus className="h-4 w-4" />
                {t("projects.addProject")}
              </button>
            </div>
          </motion.section>

          {isLoading ? (
            <motion.div variants={v.fadeUp} className="text-sm text-ink-muted">
              {t("loading")}
            </motion.div>
          ) : projects.length === 0 ? (
            <motion.section
              variants={v.fadeUp}
              className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-line bg-white/50 py-16"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-soft">
                <FolderKanban className="h-6 w-6 text-ink-muted" />
              </div>
              <div className="text-center">
                <p className="font-semibold">{t("projects.emptyTitle")}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {t("projects.emptySubtitle")}
                </p>
              </div>
            </motion.section>
          ) : (
            <motion.section variants={v.fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <motion.div key={project.id} variants={v.item}>
                <div className="group relative rounded-2xl border border-line bg-white/80 px-5 py-4 transition hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{project.name}</p>
                      {project.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 transition sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleEdit(project)}
                        className="rounded-lg p-1.5 text-ink-muted hover:bg-ink-soft hover:text-ink"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(project.id)}
                        className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.client && (
                      <span className="flex items-center gap-1.5 rounded-full bg-ink-soft px-2.5 py-1 text-xs">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: project.client.color ?? "#6B7280" }}
                        />
                        {project.client.name}
                      </span>
                    )}
                    {project.serviceType && (
                      <span className="flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs text-brand">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: project.serviceType.color ?? "#6B7280" }}
                        />
                        {project.serviceType.name}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 text-xs text-ink-muted">
                    {t("projects.sessions", { count: project._count.workSessions })}
                  </div>
                </div>
                </motion.div>
              ))}
            </motion.section>
          )}
        </motion.div>
      </div>

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchProjects}
        editingProject={editingProject}
      />

      <ServiceTypeFormDialog
        open={serviceTypeDialogOpen}
        onOpenChange={setServiceTypeDialogOpen}
        onSuccess={fetchProjects}
      />
      {ConfirmDialogElement}
    </main>
  );
}
