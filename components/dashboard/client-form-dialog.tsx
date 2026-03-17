"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ClientSchema } from "@/types/client-schema";
import { createClient, updateClient } from "@/server/actions/clients";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ClientFormValues = z.infer<typeof ClientSchema>;

type ClientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingClient?: {
    id: string;
    name: string;
    email: string | null;
    color: string | null;
    notes: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
  } | null;
};

const PRESET_COLORS = [
  "#3B82F6", "#8B5CF6", "#EF4444", "#F59E0B",
  "#10B981", "#EC4899", "#6366F1", "#14B8A6",
];

export default function ClientFormDialog({
  open,
  onOpenChange,
  onSuccess,
  editingClient,
}: ClientFormDialogProps) {
  const t = useTranslations("dashboard");
  const isEditing = !!editingClient;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(ClientSchema),
    defaultValues: {
      name: editingClient?.name ?? "",
      email: editingClient?.email ?? "",
      color: editingClient?.color ?? "#3B82F6",
      notes: editingClient?.notes ?? "",
      address: editingClient?.address ?? "",
      postalCode: editingClient?.postalCode ?? "",
      city: editingClient?.city ?? "",
      country: editingClient?.country ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      name: editingClient?.name ?? "",
      email: editingClient?.email ?? "",
      color: editingClient?.color ?? "#3B82F6",
      notes: editingClient?.notes ?? "",
      address: editingClient?.address ?? "",
      postalCode: editingClient?.postalCode ?? "",
      city: editingClient?.city ?? "",
      country: editingClient?.country ?? "",
    });
  }, [editingClient, form]);

  const { execute: executeCreate, status: createStatus } = useAction(createClient, {
    onSuccess: () => {
      toast.success(t("clients.created"));
      form.reset();
      onOpenChange(false);
      onSuccess();
    },
  });

  const { execute: executeUpdate, status: updateStatus } = useAction(updateClient, {
    onSuccess: () => {
      toast.success(t("clients.updated"));
      form.reset();
      onOpenChange(false);
      onSuccess();
    },
  });

  const isLoading = createStatus === "executing" || updateStatus === "executing";

  const onSubmit = (values: ClientFormValues) => {
    if (isEditing && editingClient) {
      executeUpdate({ id: editingClient.id, ...values });
    } else {
      executeCreate(values);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-line sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("clients.editClient") : t("clients.addClient")}
          </DialogTitle>
          <DialogDescription className="text-ink-muted">
            {t("clients.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="client-name" className="text-xs font-medium text-ink-muted">
              {t("clients.name")}
            </label>
            <Input
              id="client-name"
              {...form.register("name")}
              placeholder="Acme Inc."
              className="rounded-xl"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-600">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="client-email" className="text-xs font-medium text-ink-muted">
              {t("clients.email")}
            </label>
            <Input
              id="client-email"
              {...form.register("email")}
              type="email"
              placeholder="contact@acme.com"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="client-address" className="text-xs font-medium text-ink-muted">
              {t("clients.address")}
            </label>
            <Input
              id="client-address"
              {...form.register("address")}
              placeholder="123 Rue Example"
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label htmlFor="client-postal-code" className="text-xs font-medium text-ink-muted">
                {t("clients.postalCode")}
              </label>
              <Input
                id="client-postal-code"
                {...form.register("postalCode")}
                placeholder="75001"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="client-city" className="text-xs font-medium text-ink-muted">
                {t("clients.city")}
              </label>
              <Input
                id="client-city"
                {...form.register("city")}
                placeholder="Paris"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="client-country" className="text-xs font-medium text-ink-muted">
              {t("clients.country")}
            </label>
            <Input
              id="client-country"
              {...form.register("country")}
              placeholder="France"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-ink-muted">
              {t("clients.color")}
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => form.setValue("color", color)}
                  className={`h-7 w-7 rounded-full border-2 transition ${
                    form.watch("color") === color
                      ? "border-ink scale-110"
                      : "border-transparent hover:border-line"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="client-notes" className="text-xs font-medium text-ink-muted">
              {t("clients.notes")}
            </label>
            <Textarea
              id="client-notes"
              {...form.register("notes")}
              placeholder="..."
              className="rounded-xl"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              {t("clients.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-brand text-white hover:bg-brand/90"
            >
              {t("clients.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
