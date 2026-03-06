"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { updateWorkSession, deleteWorkSession } from "@/server/actions/work-session-update";
import { useConfirm } from "@/components/ui/confirm-dialog";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ClientOption = { id: string; name: string; color: string | null };
type ProjectOption = { id: string; name: string };

type SessionEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  sessionId: string;
  currentClientId: string | null;
  currentProjectId: string | null;
  currentStartedAt: string;
  currentEndedAt: string | null;
  currentStatus: "RUNNING" | "PAUSED" | "ENDED";
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SessionEditDialog({
  open,
  onOpenChange,
  onSuccess,
  sessionId,
  currentClientId,
  currentProjectId,
  currentStartedAt,
  currentEndedAt,
  currentStatus,
}: SessionEditDialogProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { confirm, ConfirmDialogElement } = useConfirm();
  const [clientId, setClientId] = useState<string | null>(currentClientId);
  const [projectId, setProjectId] = useState<string | null>(currentProjectId);
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  useEffect(() => {
    if (open) {
      setClientId(currentClientId);
      setProjectId(currentProjectId);
      setStartedAt(toLocalInput(currentStartedAt));
      setEndedAt(currentEndedAt ? toLocalInput(currentEndedAt) : "");
      fetch("/api/clients", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setClients(d.clients))
        .catch(() => null);
    }
  }, [open, currentClientId, currentProjectId, currentStartedAt, currentEndedAt]);

  useEffect(() => {
    if (open) {
      const url = clientId
        ? `/api/projects?clientId=${clientId}`
        : "/api/projects";
      fetch(url, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setProjects(d.projects))
        .catch(() => null);
    }
  }, [open, clientId]);

  const { execute, status } = useAction(updateWorkSession, {
    onSuccess: () => {
      toast.success(t("sessionEdit.updated"));
      onOpenChange(false);
      onSuccess();
    },
  });

  const { execute: executeDelete, status: deleteStatus } = useAction(deleteWorkSession, {
    onSuccess: () => {
      toast.success(t("sessionEdit.deleted"));
      onOpenChange(false);
      onSuccess();
    },
  });

  const handleSave = () => {
    const originalStart = toLocalInput(currentStartedAt);
    const originalEnd = currentEndedAt ? toLocalInput(currentEndedAt) : "";

    execute({
      sessionId,
      clientId,
      projectId,
      startedAt: startedAt !== originalStart ? new Date(startedAt).toISOString() : undefined,
      endedAt: endedAt && endedAt !== originalEnd ? new Date(endedAt).toISOString() : undefined,
    });
  };

  const isLoading = status === "executing" || deleteStatus === "executing";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-line sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("sessionEdit.title")}</DialogTitle>
          <DialogDescription className="text-ink-muted">
            {t("sessionEdit.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">
              {t("projects.client")}
            </label>
            <Select
              value={clientId ?? "none"}
              onValueChange={(v) => {
                setClientId(v === "none" ? null : v);
                setProjectId(null);
              }}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={t("timer.selectClient")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("timer.noClient")}</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: c.color ?? "#6B7280" }}
                      />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">
              {t("projects.title")}
            </label>
            <Select
              value={projectId ?? "none"}
              onValueChange={(v) => setProjectId(v === "none" ? null : v)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={t("timer.selectProject")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("timer.noProject")}</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time section */}
          <div className="border-t border-line pt-4">
            <p className="mb-3 text-xs font-medium text-ink-muted">
              {t("sessionEdit.timeSection")}
            </p>
          </div>

          {/* Start time */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">
              {t("sessionEdit.startTime")}
            </label>
            <input
              type="datetime-local"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              max={endedAt || undefined}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* End time */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">
              {t("sessionEdit.endTime")}
            </label>
            <input
              type="datetime-local"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
              min={startedAt || undefined}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {currentStatus !== "ENDED" && endedAt && (
              <p className="text-xs text-brand-3">
                {t("sessionEdit.endTimeWarning")}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              {t("sessionEdit.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="rounded-xl bg-brand text-white hover:bg-brand/90"
            >
              {t("sessionEdit.save")}
            </Button>
          </div>

          {/* Delete */}
          <div className="border-t border-line pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={async () => {
                const ok = await confirm({
                  title: t("sessionEdit.title"),
                  description: t("sessionEdit.deleteConfirm"),
                  confirmLabel: tc("delete"),
                  cancelLabel: tc("cancel"),
                });
                if (ok) executeDelete({ sessionId });
              }}
              disabled={isLoading}
              className="w-full rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              {t("sessionEdit.delete")}
            </Button>
          </div>
          {ConfirmDialogElement}
        </div>
      </DialogContent>
    </Dialog>
  );
}
