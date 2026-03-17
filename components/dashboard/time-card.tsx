"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

export default function TimeCard() {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const formatter = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [locale]);

  return (
    <div className="rounded-2xl border border-line bg-white/80 px-4 py-3 text-right shadow-[0_18px_40px_-34px_rgba(29,27,22,0.25)]">
      <p className="text-[10px] uppercase text-ink-muted">
        {t("currentTime")}
      </p>
      <p className="mt-1 text-lg font-semibold text-ink">
        {formatter.format(now)}
      </p>
    </div>
  );
}
