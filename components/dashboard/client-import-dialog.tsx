"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { AnimatePresence, motion } from "framer-motion";
import { Check, FileSpreadsheet, Loader2, Sparkles, Upload } from "lucide-react";
import { z } from "zod";
import { importClients } from "@/server/actions/clients";
import { ClientImportRowSchema } from "@/types/client-schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type ClientImportRow = z.infer<typeof ClientImportRowSchema>;
type ImportField = keyof ClientImportRow;

type ClientImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

type ParsedSheet = {
  headers: string[];
  rows: string[][];
};

type FieldMapping = Record<ImportField, string>;

const IMPORT_FIELDS: ImportField[] = [
  "name",
  "email",
  "address",
  "postalCode",
  "city",
  "country",
  "notes",
];

const IGNORE_VALUE = "__ignore__";

const HEADER_ALIASES: Record<ImportField, string[]> = {
  name: [
    "name",
    "nom",
    "client",
    "customer",
    "customer name",
    "client name",
    "nom client",
    "company",
    "company name",
    "business",
    "business name",
    "entreprise",
    "nom entreprise",
    "societe",
    "raison sociale",
    "account name",
  ],
  email: [
    "email",
    "e-mail",
    "mail",
    "courriel",
    "email address",
    "mail client",
    "courriel client",
    "client email",
    "contact email",
    "adresse email",
    "adresse mail",
  ],
  address: [
    "address",
    "adresse",
    "street",
    "street address",
    "address line 1",
    "address 1",
    "adresse 1",
    "adresse ligne 1",
    "billing address",
    "adresse facturation",
  ],
  postalCode: [
    "postal code",
    "postcode",
    "zip",
    "zip code",
    "code postal",
    "npa",
    "cp",
    "post code",
  ],
  city: [
    "city",
    "ville",
    "town",
    "commune",
    "localite",
    "locality",
  ],
  country: [
    "country",
    "pays",
    "country code",
    "nation",
  ],
  notes: [
    "notes",
    "note",
    "comment",
    "comments",
    "commentaire",
    "commentaires",
    "remarque",
    "remarques",
    "memo",
    "description",
    "details",
  ],
};

const normalizeHeader = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const getHeaderScore = (header: string, aliases: string[]) => {
  const normalizedHeader = normalizeHeader(header);
  if (!normalizedHeader) return 0;

  let bestScore = 0;
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    if (!normalizedAlias) continue;

    if (normalizedHeader === normalizedAlias) {
      bestScore = Math.max(bestScore, 100);
      continue;
    }

    if (
      normalizedHeader.replace(/\s+/g, "") === normalizedAlias.replace(/\s+/g, "")
    ) {
      bestScore = Math.max(bestScore, 95);
      continue;
    }

    if (
      normalizedHeader.startsWith(`${normalizedAlias} `) ||
      normalizedHeader.endsWith(` ${normalizedAlias}`) ||
      normalizedHeader.includes(` ${normalizedAlias} `)
    ) {
      bestScore = Math.max(bestScore, 82);
      continue;
    }

    if (normalizedAlias.length >= 4 && normalizedHeader.includes(normalizedAlias)) {
      bestScore = Math.max(bestScore, 68);
    }
  }

  return bestScore;
};

const inferFieldMappings = (headers: string[]): FieldMapping => {
  const usedHeaders = new Set<string>();
  const nextMapping = Object.fromEntries(
    IMPORT_FIELDS.map((field) => [field, ""])
  ) as FieldMapping;

  for (const field of IMPORT_FIELDS) {
    let bestHeader = "";
    let bestScore = 0;

    for (const header of headers) {
      if (!header || usedHeaders.has(header)) continue;

      const score = getHeaderScore(header, HEADER_ALIASES[field]);
      if (score > bestScore) {
        bestHeader = header;
        bestScore = score;
      }
    }

    if (bestHeader && bestScore > 0) {
      nextMapping[field] = bestHeader;
      usedHeaders.add(bestHeader);
    }
  }

  return nextMapping;
};

const isAcceptedFile = (file: File) =>
  /\.(xlsx|xls|csv)$/i.test(file.name);

const getDecodingScore = (value: string) => {
  const mojibakeCount =
    value.match(/Ã.|Â.|â.|�/g)?.length ?? 0;
  const accentedCount =
    value.match(/[éèàùçêëîïôöûüÉÈÀÙÇÊËÎÏÔÖÛÜ]/g)?.length ?? 0;

  return accentedCount * 2 - mojibakeCount * 6;
};

const decodeCsvBuffer = (buffer: ArrayBuffer) => {
  const candidates = ["utf-8", "windows-1252", "iso-8859-1"].map((encoding) => {
    const text = new TextDecoder(encoding).decode(buffer);
    return {
      encoding,
      text,
      score: getDecodingScore(text),
    };
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.text ?? "";
};

const getFieldLabel = (t: ReturnType<typeof useTranslations>, field: ImportField) => {
  switch (field) {
    case "name":
      return t("clients.name");
    case "email":
      return t("clients.email");
    case "address":
      return t("clients.address");
    case "postalCode":
      return t("clients.postalCode");
    case "city":
      return t("clients.city");
    case "country":
      return t("clients.country");
    case "notes":
      return t("clients.notes");
  }
};

export default function ClientImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: ClientImportDialogProps) {
  const t = useTranslations("dashboard");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const [fileName, setFileName] = useState("");
  const [sheet, setSheet] = useState<ParsedSheet>({ headers: [], rows: [] });
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>(() =>
    Object.fromEntries(IMPORT_FIELDS.map((field) => [field, ""])) as FieldMapping
  );
  const [autoMapping, setAutoMapping] = useState<FieldMapping>(() =>
    Object.fromEntries(IMPORT_FIELDS.map((field) => [field, ""])) as FieldMapping
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const resetState = () => {
    setFileName("");
    setSheet({ headers: [], rows: [] });
    setIsDragging(false);
    setIsParsing(false);
    const emptyMapping = Object.fromEntries(
      IMPORT_FIELDS.map((field) => [field, ""])
    ) as FieldMapping;
    setFieldMapping(emptyMapping);
    setAutoMapping(emptyMapping);
    dragCounter.current = 0;
    if (inputRef.current) inputRef.current.value = "";
  };

  const parseWorkbookFile = useCallback(
    async (file: File) => {
      if (!isAcceptedFile(file)) {
        toast.error(t("clients.import.invalidFormat"));
        return;
      }

      setIsParsing(true);
      setFileName(file.name);

      try {
        const XLSX = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const workbook = file.name.toLocaleLowerCase().endsWith(".csv")
          ? XLSX.read(decodeCsvBuffer(buffer), { type: "string" })
          : XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        if (!firstSheet) {
          toast.error(t("clients.import.emptyFile"));
          resetState();
          return;
        }

        const rows = XLSX.utils.sheet_to_json<Array<string | number | boolean | null>>(
          firstSheet,
          {
            header: 1,
            defval: "",
            blankrows: false,
          }
        );

        if (rows.length === 0) {
          toast.error(t("clients.import.emptyFile"));
          resetState();
          return;
        }

        const [headerRow = [], ...dataRows] = rows;
        const headers = headerRow.map((cell, index) => {
          const label = String(cell ?? "").trim();
          return label || `${t("clients.import.columnFallback")} ${index + 1}`;
        });

        const cleanedRows = dataRows
          .map((row) => headers.map((_, index) => String(row[index] ?? "").trim()))
          .filter((row) => row.some((value) => value !== ""));

        if (headers.length === 0 || cleanedRows.length === 0) {
          toast.error(t("clients.import.emptyFile"));
          resetState();
          return;
        }

        const inferredMapping = inferFieldMappings(headers);
        setSheet({ headers, rows: cleanedRows });
        setAutoMapping(inferredMapping);
        setFieldMapping(inferredMapping);
      } catch {
        toast.error(t("clients.import.parseError"));
        resetState();
      } finally {
        setIsParsing(false);
      }
    },
    [t]
  );

  const handleFileSelection = useCallback(
    (file: File | null) => {
      if (!file) return;
      void parseWorkbookFile(file);
    },
    [parseWorkbookFile]
  );

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current += 1;
    if (event.dataTransfer.items?.length) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;
      handleFileSelection(event.dataTransfer.files?.[0] ?? null);
    },
    [handleFileSelection]
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelection(event.target.files?.[0] ?? null);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFileSelection]
  );

  const parsedResult = useMemo(() => {
    if (sheet.headers.length === 0 || sheet.rows.length === 0) {
      return {
        clients: [] as ClientImportRow[],
        skippedRows: 0,
        duplicateRows: 0,
      };
    }

    const headerIndex = new Map(sheet.headers.map((header, index) => [header, index]));
    const seenNames = new Set<string>();
    const nextClients: ClientImportRow[] = [];
    let skippedRows = 0;
    let duplicateRows = 0;

    for (const row of sheet.rows) {
      const candidate = Object.fromEntries(
        IMPORT_FIELDS.map((field) => {
          const header = fieldMapping[field];
          if (!header) return [field, ""];
          const index = headerIndex.get(header);
          return [field, index === undefined ? "" : row[index] ?? ""];
        })
      ) as ClientImportRow;

      const parsed = ClientImportRowSchema.safeParse(candidate);
      if (!parsed.success) {
        skippedRows += 1;
        continue;
      }

      const normalizedName = parsed.data.name.trim().toLocaleLowerCase();
      if (seenNames.has(normalizedName)) {
        duplicateRows += 1;
        continue;
      }

      seenNames.add(normalizedName);
      nextClients.push(parsed.data);
    }

    return {
      clients: nextClients,
      skippedRows,
      duplicateRows,
    };
  }, [fieldMapping, sheet.headers, sheet.rows]);

  const previewClients = useMemo(
    () => parsedResult.clients.slice(0, 5),
    [parsedResult.clients]
  );

  const missingRequiredName = !fieldMapping.name;

  const { execute, status } = useAction(importClients, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success(
          t("clients.import.success", {
            count: data.success.importedCount,
            skipped:
              data.success.skippedExistingCount + data.success.skippedDuplicateCount,
          })
        );
        resetState();
        onOpenChange(false);
        onSuccess();
        return;
      }

      if (data?.error === "limit") {
        toast.error(
          t("clients.import.limitReached", {
            remaining: data.remaining ?? 0,
            attempted: data.attempted ?? parsedResult.clients.length,
          })
        );
        return;
      }

      if (data?.error === "no_new_clients") {
        toast.error(t("clients.import.noNewClients"));
        return;
      }

      toast.error(t("clients.import.submitError"));
    },
    onError: () => {
      toast.error(t("clients.import.submitError"));
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetState();
    onOpenChange(nextOpen);
  };

  const isSubmitting = status === "executing";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-3xl border-line sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("clients.import.title")}</DialogTitle>
          <DialogDescription className="text-ink-muted">
            {t("clients.import.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-5 overflow-y-auto pr-1">
          <div className="rounded-3xl border border-line bg-panel/70 p-5">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleInputChange}
            />

            <motion.div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => !isParsing && !isSubmitting && inputRef.current?.click()}
              className="group cursor-pointer"
            >
              <motion.div
                animate={{
                  borderColor: isDragging
                    ? "rgb(249 115 22)"
                    : "rgb(229 231 235)",
                  backgroundColor: isDragging
                    ? "rgb(249 115 22 / 0.06)"
                    : "rgb(255 255 255 / 0.7)",
                  scale: isDragging ? 1.01 : 1,
                }}
                transition={{ duration: 0.2 }}
                className="rounded-[28px] border-2 border-dashed p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-ink">
                      {t("clients.import.accepted")}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {t("clients.import.expectedColumns")}
                    </p>
                    <p className="text-xs text-ink-muted/80">
                      {t("clients.import.columns")}
                    </p>
                  </div>

                  <AnimatePresence mode="wait">
                    {isParsing ? (
                      <motion.div
                        key="parsing"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink"
                      >
                        <Loader2 className="h-4 w-4 animate-spin text-brand" />
                        {t("clients.import.parsing")}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        className="flex flex-col items-start gap-3 lg:items-end"
                      >
                        <Button
                          type="button"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            inputRef.current?.click();
                          }}
                          disabled={isSubmitting}
                          className="rounded-2xl"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {t("clients.import.chooseFile")}
                        </Button>
                        <motion.p
                          animate={{ opacity: isDragging ? 1 : 0.65, y: isDragging ? 0 : 2 }}
                          className="text-xs font-medium text-brand"
                        >
                          {isDragging
                            ? t("clients.import.dropHere")
                            : t("clients.import.dropzone")}
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {fileName && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2 rounded-2xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-ink"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-brand" />
                    <span className="truncate font-medium">{fileName}</span>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-line bg-white/80 px-4 py-3">
              <p className="text-xs uppercase text-ink-muted">
                {t("clients.import.ready")}
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink">
                {parsedResult.clients.length}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-white/80 px-4 py-3">
              <p className="text-xs uppercase text-ink-muted">
                {t("clients.import.skipped")}
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink">
                {parsedResult.skippedRows}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-white/80 px-4 py-3">
              <p className="text-xs uppercase text-ink-muted">
                {t("clients.import.duplicates")}
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink">
                {parsedResult.duplicateRows}
              </p>
            </div>
          </div>

          {sheet.headers.length > 0 && (
            <div className="rounded-3xl border border-line bg-white/80 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {t("clients.import.mappingTitle")}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {t("clients.import.mappingSubtitle")}
                  </p>
                </div>
                <div className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                  {t("clients.import.detectedColumns", { count: sheet.headers.length })}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {IMPORT_FIELDS.map((field) => {
                  const selectedHeader = fieldMapping[field];
                  const isAutoDetected = !!selectedHeader && selectedHeader === autoMapping[field];
                  return (
                    <div
                      key={field}
                      className="rounded-2xl border border-line bg-panel/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-ink">
                            {getFieldLabel(t, field)}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                              field === "name"
                                ? "bg-brand/10 text-brand"
                                : "bg-ink-soft text-ink-muted"
                            }`}
                          >
                            {field === "name"
                              ? t("clients.import.required")
                              : t("clients.import.optional")}
                          </span>
                        </div>
                        {selectedHeader ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              isAutoDetected
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {isAutoDetected ? (
                              <Sparkles className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            {isAutoDetected
                              ? t("clients.import.autoDetected")
                              : t("clients.import.manualMapping")}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3">
                        <Select
                          value={selectedHeader || IGNORE_VALUE}
                          onValueChange={(value) =>
                            setFieldMapping((current) => ({
                              ...current,
                              [field]: value === IGNORE_VALUE ? "" : value,
                            }))
                          }
                        >
                          <SelectTrigger className="rounded-xl border-line bg-white">
                            <SelectValue placeholder={t("clients.import.sourceColumn")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={IGNORE_VALUE}>
                              {t("clients.import.ignore")}
                            </SelectItem>
                            {sheet.headers.map((header) => (
                              <SelectItem key={`${field}-${header}`} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {missingRequiredName && (
                <div className="mt-4 rounded-2xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-brand">
                  {t("clients.import.nameRequiredHint")}
                </div>
              )}
            </div>
          )}

          <div className="rounded-3xl border border-line bg-white/80 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {t("clients.import.previewTitle")}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  {t("clients.import.previewSubtitle")}
                </p>
              </div>
              {parsedResult.clients.length > 5 && (
                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                  {t("clients.import.moreRows", { count: parsedResult.clients.length - 5 })}
                </span>
              )}
            </div>

            {previewClients.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-line">
                <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-panel px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <span>{t("clients.name")}</span>
                  <span>{t("clients.email")}</span>
                  <span>{t("clients.city")}</span>
                </div>
                <div className="divide-y divide-line">
                  {previewClients.map((client, index) => (
                    <div
                      key={`${client.name}-${index}`}
                      className="grid grid-cols-[1.4fr_1fr_1fr] gap-3 px-4 py-3 text-sm text-ink"
                    >
                      <span className="truncate font-medium">{client.name}</span>
                      <span className="truncate text-ink-muted">
                        {client.email || "—"}
                      </span>
                      <span className="truncate text-ink-muted">
                        {client.city || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-line bg-panel/70 px-4 py-8 text-center text-sm text-ink-muted">
                {sheet.headers.length > 0 && missingRequiredName
                  ? t("clients.import.previewNeedsMapping")
                  : t("clients.import.previewEmpty")}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="rounded-2xl"
            >
              {t("clients.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => execute({ clients: parsedResult.clients })}
              disabled={
                parsedResult.clients.length === 0 ||
                isParsing ||
                isSubmitting ||
                missingRequiredName
              }
              className="rounded-2xl bg-brand text-white hover:bg-brand/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("clients.import.submit")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
