"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DISMISS_KEY = "business-profile-prompt-dismissed";

export default function BusinessProfilePrompt({
  shouldPrompt,
  labels,
}: {
  shouldPrompt: boolean;
  labels: {
    title: string;
    subtitle: string;
    cta: string;
    dismiss: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!shouldPrompt) {
      sessionStorage.removeItem(DISMISS_KEY);
      setOpen(false);
      return;
    }

    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (dismissed) return;
    setOpen(true);
  }, [shouldPrompt]);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  const handleGoToSettings = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
    router.push("/dashboard/settings");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="rounded-3xl border-line bg-white/95 backdrop-blur-xl sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
            <Building2 className="h-7 w-7 text-brand" />
          </div>
          <DialogTitle className="text-lg font-semibold">{labels.title}</DialogTitle>
          <DialogDescription className="text-sm text-ink-muted">
            {labels.subtitle}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleGoToSettings}
            className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:bg-brand/90"
          >
            {labels.cta}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm font-medium text-ink-muted transition hover:bg-white hover:text-ink"
          >
            {labels.dismiss}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
