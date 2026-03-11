"use client";

import { useEffect, useState } from "react";

type BreakData = {
  startedAt: string;
  endedAt: string | null;
};

type LiveTimerProps = {
  /** ISO string — session start */
  startedAt: string;
  /** ISO string — session end (null = still running) */
  endedAt: string | null;
  /** Session breaks */
  breaks: BreakData[];
  /** When true, stops the interval (used for PAUSED sessions) */
  paused?: boolean;
  /** CSS class for the wrapper element */
  className?: string;
  /** Optional render function for custom formatting. Receives elapsed ms. */
  children?: (elapsedMs: number) => React.ReactNode;
};

function computeElapsedMs(
  startedAt: string,
  endedAt: string | null,
  breaks: BreakData[],
  now: Date
) {
  const start = new Date(startedAt);
  const end = endedAt ? new Date(endedAt) : now;
  const breakMs = breaks.reduce((total, b) => {
    const bStart = new Date(b.startedAt);
    const bEnd = b.endedAt ? new Date(b.endedAt) : now;
    return total + (bEnd.getTime() - bStart.getTime());
  }, 0);
  return Math.max(end.getTime() - start.getTime() - breakMs, 0);
}

function formatTimer(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Self-contained timer that ticks every second without re-rendering the parent.
 * When `endedAt` is set, the timer stops ticking and shows the final value.
 */
export default function LiveTimer({
  startedAt,
  endedAt,
  breaks,
  paused,
  className,
  children,
}: LiveTimerProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (endedAt || paused) return;
    // Refresh now immediately so the first render after resume is accurate
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [endedAt, paused]);

  const elapsedMs = computeElapsedMs(startedAt, endedAt, breaks, now);

  if (children) {
    return <>{children(elapsedMs)}</>;
  }

  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {formatTimer(elapsedMs)}
    </span>
  );
}
