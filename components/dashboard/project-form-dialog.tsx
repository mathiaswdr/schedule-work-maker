"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ProjectSchema } from "@/types/project-schema";
import { createProject, updateProject } from "@/server/actions/projects";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ProjectFormValues = z.infer<typeof ProjectSchema>;

type ClientOption = { id: string; name: string; color: string | null };
type ServiceTypeOption = { id: string; name: string; color: string | null };

type ProjectFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingProject?: {
    id: string;
    name: string;
    description: string | null;
    clientId: string | null;
    serviceTypeId: string | null;
  } | null;
};

export default function ProjectFormDialog({
  open,
  onOpenChange,
  onSuccess,
  editingProject,
}: ProjectFormDialogProps) {
  const t = useTranslations("dashboard");
  const isEditing = !!editingProject;
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeOption[]>([]);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: {
      name: editingProject?.name ?? "",
      description: editingProject?.description ?? "",
      clientId: editingProject?.clientId ?? null,
      serviceTypeId: editingProject?.serviceTypeId ?? null,
    },
  });

  useEffect(() => {
    if (open) {
      Promise.all([
        fetch("/api/clients", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/service-types", { cache: "no-store" }).then((r) => r.json()),
      ]).then(([clientsData, serviceTypesData]) => {
        setClients(clientsData.clients);
        setServiceTypes(serviceTypesData.serviceTypes);
      });
    }
  }, [open]);

  const { execute: executeCreate, status: createStatus } = useAction(createProject, {
    onSuccess: () => {
      toast.success(t("projects.created"));
      form.reset();
      onOpenChange(false);
      onSuccess();
    },
  });

  const { execute: executeUpdate, status: updateStatus } = useAction(updateProject, {
    onSuccess: () => {
      toast.success(t("projects.updated"));
      form.reset();
      onOpenChange(false);
      onSuccess();
    },
  });

  const isLoading = createStatus === "executing" || updateStatus === "executing";

  const onSubmit = (values: ProjectFormValues) => {
    if (isEditing && editingProject) {
      executeUpdate({ id: editingProject.id, ...values });
    } else {
      executeCreate(values);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-line sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("projects.editProject") : t("projects.addProject")}
          </DialogTitle>
          <DialogDescription className="text-ink-muted">
            {t("projects.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">
              {t("projects.name")}
            </label>
            <Input
              {...form.register("name")}
              placeholder="Website Redesign"
              className="rounded-xl"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-600">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">
              {t("projects.description")}
            </label>
            <Textarea
              {...form.register("description")}
              placeholder="..."
              className="rounded-xl"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">
              {t("projects.client")}
            </label>
            <Select
              value={form.watch("clientId") ?? "none"}
              onValueChange={(v) =>
                form.setValue("clientId", v === "none" ? null : v)
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={t("projects.noClient")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("projects.noClient")}</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: client.color ?? "#6B7280" }}
                      />
                      {client.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">
              {t("projects.serviceType")}
            </label>
            <Select
              value={form.watch("serviceTypeId") ?? "none"}
              onValueChange={(v) =>
                form.setValue("serviceTypeId", v === "none" ? null : v)
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={t("projects.noServiceType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("projects.noServiceType")}</SelectItem>
                {serviceTypes.map((st) => (
                  <SelectItem key={st.id} value={st.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: st.color ?? "#6B7280" }}
                      />
                      {st.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              {t("projects.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-brand text-white hover:bg-brand/90"
            >
              {t("projects.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
