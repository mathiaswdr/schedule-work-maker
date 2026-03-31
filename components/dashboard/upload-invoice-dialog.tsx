"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  uploadInvoice,
  updateUploadedInvoice,
} from "@/server/actions/uploaded-invoices";
import { toast } from "sonner";
import { FileText, Check, Upload, Loader2 } from "lucide-react";

type ClientOption = { id: string; name: string; color: string | null };
type ProjectOption = { id: string; name: string; clientId: string | null };

type UploadedInvoiceData = {
  id: string;
  fileUrl: string | null;
  clientId: string | null;
  projectId: string | null;
  displayNumber: string;
  total: number;
  issueDate: string;
  dueDate: string | null;
  notes: string | null;
  status: string;
};

type UploadInvoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: UploadedInvoiceData | null;
  onSuccess: () => void;
};

export default function UploadInvoiceDialog({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}: UploadInvoiceDialogProps) {
  const t = useTranslations("dashboard.invoices");

  // Form state
  const [fileUrl, setFileUrl] = useState("");
  const [displayNumber, setDisplayNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [total, setTotal] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [notes, setNotes] = useState("");

  // Drag & drop
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const ACCEPTED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  const uploadFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("PDF, JPG, PNG uniquement");
        return;
      }
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "invoice");
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }
        const data = await res.json();
        if (data.url) setFileUrl(data.url);
      } catch {
        toast.error("Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items?.length) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;
      const file = e.dataTransfer.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [uploadFile]
  );

  // Data
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []))
      .catch(() => null);
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .catch(() => null);
  }, [open]);

  // Reset/populate form
  useEffect(() => {
    if (!open) return;
    if (invoice) {
      setFileUrl(invoice.fileUrl || "");
      setDisplayNumber(invoice.displayNumber || "");
      setClientId(invoice.clientId || "");
      setProjectId(invoice.projectId || "");
      setTotal(String(invoice.total || ""));
      setIssueDate(invoice.issueDate.slice(0, 10));
      setDueDate(invoice.dueDate?.slice(0, 10) || "");
      setStatus(invoice.status || "DRAFT");
      setNotes(invoice.notes || "");
    } else {
      setFileUrl("");
      setDisplayNumber("");
      setClientId("");
      setProjectId("");
      setTotal("");
      setIssueDate(new Date().toISOString().slice(0, 10));
      setDueDate("");
      setStatus("DRAFT");
      setNotes("");
    }
  }, [open, invoice]);

  const { execute: execUpload, status: uploadStatus } = useAction(
    uploadInvoice,
    {
      onSuccess: () => {
        toast.success(t("uploadCreated"));
        onOpenChange(false);
        onSuccess();
      },
      onError: () => {
        toast.error(t("upload.submit"));
      },
    }
  );

  const { execute: execUpdate, status: updateStatus } = useAction(
    updateUploadedInvoice,
    {
      onSuccess: () => {
        toast.success(t("uploadUpdated"));
        onOpenChange(false);
        onSuccess();
      },
      onError: () => {
        toast.error(t("upload.update"));
      },
    }
  );

  const isExecuting =
    uploadStatus === "executing" || updateStatus === "executing";

  const filteredProjects = clientId
    ? projects.filter(
        (p) => p.clientId === clientId || p.clientId === null
      )
    : projects;

  const handleSubmit = () => {
    if (!fileUrl || !clientId || !total) return;

    const payload = {
      fileUrl,
      clientId,
      projectId: projectId && projectId !== "none" ? projectId : null,
      displayNumber: displayNumber || undefined,
      total: parseFloat(total),
      issueDate,
      dueDate: dueDate || null,
      status: status as "DRAFT" | "SENT" | "PAID",
      notes: notes || undefined,
    };

    if (invoice) {
      execUpdate({ id: invoice.id, ...payload });
    } else {
      execUpload(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("upload.title")}</DialogTitle>
          <p className="text-sm text-ink-muted">{t("upload.subtitle")}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* File upload — drag & drop */}
          <div className="space-y-2">
            <label className="text-xs uppercase text-ink-muted">
              {t("upload.file")}
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInput}
              className="hidden"
            />

            <AnimatePresence mode="wait">
              {fileUrl ? (
                <motion.div
                  key="uploaded"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                  >
                    <FileText className="h-5 w-5 text-brand" />
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
                      >
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      </motion.div>
                      <span className="text-sm font-medium text-ink">
                        {t("upload.fileUploaded")}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">
                      {fileUrl.split("/").pop()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="rounded-xl bg-white/80 px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-white disabled:opacity-60"
                  >
                    {isUploading ? t("upload.uploading") : t("upload.replaceFile")}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className="group cursor-pointer"
                >
                  <motion.div
                    animate={{
                      borderColor: isDragging
                        ? "rgb(249 115 22)" // brand/orange
                        : "rgb(229 231 235)", // line
                      backgroundColor: isDragging
                        ? "rgb(249 115 22 / 0.05)"
                        : "rgb(255 255 255 / 0.5)",
                      scale: isDragging ? 1.02 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border-2 border-dashed p-8 text-center transition-colors group-hover:border-brand/40 group-hover:bg-brand/[0.02]"
                  >
                    <AnimatePresence mode="wait">
                      {isUploading ? (
                        <motion.div
                          key="uploading"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col items-center"
                        >
                          <Loader2 className="h-8 w-8 animate-spin text-brand" />
                          <p className="mt-3 text-sm font-medium text-brand">
                            {t("upload.uploading")}
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="idle"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col items-center"
                        >
                          <motion.div
                            animate={{
                              y: isDragging ? -6 : 0,
                              scale: isDragging ? 1.15 : 1,
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                            <Upload
                              className={`h-8 w-8 transition-colors duration-200 ${
                                isDragging
                                  ? "text-brand"
                                  : "text-ink-muted/40 group-hover:text-ink-muted/60"
                              }`}
                            />
                          </motion.div>
                          <motion.p
                            animate={{ opacity: isDragging ? 0 : 1 }}
                            className="mt-3 text-sm font-medium text-ink-muted/70"
                          >
                            {t("upload.dropzone")}
                          </motion.p>
                          <motion.p
                            animate={{ opacity: isDragging ? 0 : 1 }}
                            className="mt-1 text-xs text-ink-muted/50"
                          >
                            PDF, JPG, PNG
                          </motion.p>
                          <AnimatePresence>
                            {isDragging && (
                              <motion.p
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                className="mt-3 text-sm font-semibold text-brand"
                              >
                                {t("upload.dropHere")}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Invoice number + Total */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase text-ink-muted">
                {t("upload.invoiceNumber")}
              </label>
              <Input
                value={displayNumber}
                onChange={(e) => setDisplayNumber(e.target.value)}
                placeholder={t("upload.invoiceNumberPlaceholder")}
                className="border-line"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-ink-muted">
                {t("upload.totalAmount")}
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="0.00"
                className="border-line"
              />
            </div>
          </div>

          {/* Client */}
          <div className="space-y-2">
            <label className="text-xs uppercase text-ink-muted">
              {t("form.selectClient")}
            </label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder={t("form.selectClient")} />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      {c.color && (
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                      )}
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project */}
          <div className="space-y-2">
            <label className="text-xs uppercase text-ink-muted">
              {t("form.selectProject")}
            </label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder={t("form.noProject")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("form.noProject")}</SelectItem>
                {filteredProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates + Status */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs uppercase text-ink-muted">
                {t("form.issueDate")}
              </label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="border-line"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-ink-muted">
                {t("form.dueDate")}
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="border-line"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-ink-muted">
                {t("upload.status")}
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["DRAFT", "SENT", "PAID"] as const).map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs uppercase text-ink-muted">
              {t("notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={3}
              className="w-full rounded-2xl border border-line bg-white/60 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isExecuting || !fileUrl || !clientId || !total}
              className="rounded-2xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {invoice ? t("upload.update") : t("upload.submit")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
