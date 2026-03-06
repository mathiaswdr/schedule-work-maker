"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createServiceType, updateServiceType, deleteServiceType } from "@/server/actions/service-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ServiceTypeItem = {
  id: string;
  name: string;
  color: string | null;
};

type ServiceTypeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const PRESET_COLORS = [
  "#3B82F6", "#8B5CF6", "#EF4444", "#F59E0B",
  "#10B981", "#EC4899", "#6366F1", "#14B8A6",
];

export default function ServiceTypeFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: ServiceTypeFormDialogProps) {
  const t = useTranslations("dashboard");
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeItem[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchServiceTypes = async () => {
    const response = await fetch("/api/service-types", { cache: "no-store" });
    const payload = await response.json();
    setServiceTypes(payload.serviceTypes);
  };

  useEffect(() => {
    if (open) fetchServiceTypes();
  }, [open]);

  const { execute: executeCreate } = useAction(createServiceType, {
    onSuccess: () => {
      toast.success(t("projects.serviceTypeCreated"));
      setName("");
      setColor("#3B82F6");
      fetchServiceTypes();
      onSuccess();
    },
  });

  const { execute: executeUpdate } = useAction(updateServiceType, {
    onSuccess: () => {
      toast.success(t("projects.serviceTypeUpdated"));
      setName("");
      setColor("#3B82F6");
      setEditingId(null);
      fetchServiceTypes();
      onSuccess();
    },
  });

  const { execute: executeDelete } = useAction(deleteServiceType, {
    onSuccess: () => {
      toast.success(t("projects.serviceTypeDeleted"));
      fetchServiceTypes();
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editingId) {
      executeUpdate({ id: editingId, name: name.trim(), color });
    } else {
      executeCreate({ name: name.trim(), color });
    }
  };

  const handleEdit = (item: ServiceTypeItem) => {
    setEditingId(item.id);
    setName(item.name);
    setColor(item.color ?? "#3B82F6");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setColor("#3B82F6");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-line sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("projects.manageServiceTypes")}</DialogTitle>
          <DialogDescription className="text-ink-muted">
            {t("projects.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {serviceTypes.length > 0 ? (
            <div className="space-y-2">
              {serviceTypes.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-white/80 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color ?? "#6B7280" }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="rounded-lg p-1.5 text-ink-muted hover:bg-ink-soft hover:text-ink"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => executeDelete({ id: item.id })}
                      className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-ink-muted py-4">
              {t("projects.noServiceTypes")}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 border-t border-line pt-4">
            <p className="text-xs font-medium text-ink-muted">
              {editingId ? t("projects.editServiceType") : t("projects.addServiceType")}
            </p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("projects.serviceTypeName")}
              className="rounded-xl"
            />
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full border-2 transition ${
                    color === c ? "border-ink scale-110" : "border-transparent hover:border-line"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={!name.trim()}
                className="rounded-xl bg-brand text-white hover:bg-brand/90"
                size="sm"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                {editingId ? t("clients.save") : t("projects.addServiceType")}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="rounded-xl"
                >
                  {t("clients.cancel")}
                </Button>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
