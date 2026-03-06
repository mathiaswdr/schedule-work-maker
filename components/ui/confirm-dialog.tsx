"use client";

import { useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-line sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-ink-muted">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="rounded-xl"
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook that provides a confirm() function returning a Promise<boolean>.
 * Usage:
 *   const { confirm, ConfirmDialogElement } = useConfirm();
 *   ...
 *   if (await confirm({ title, description })) { doAction(); }
 *   ...
 *   return <>{ConfirmDialogElement}</>
 */
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "destructive" | "default";
  }>({ open: false, title: "", description: "" });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback(
    (opts: {
      title: string;
      description: string;
      confirmLabel?: string;
      cancelLabel?: string;
      variant?: "destructive" | "default";
    }) => {
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setState({ open: true, ...opts });
      });
    },
    []
  );

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      resolveRef.current?.(false);
      resolveRef.current = null;
    }
    setState((prev) => ({ ...prev, open }));
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const ConfirmDialogElement = (
    <ConfirmDialog
      open={state.open}
      onOpenChange={handleOpenChange}
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      variant={state.variant}
      onConfirm={handleConfirm}
    />
  );

  return { confirm, ConfirmDialogElement };
}
