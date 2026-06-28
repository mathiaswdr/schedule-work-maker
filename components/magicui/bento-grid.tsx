import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function BentoGrid({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid auto-rows-[minmax(176px,auto)] grid-cols-1 gap-4 md:grid-cols-6",
        className,
      )}
      {...props}
    />
  );
}

export function BentoCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_20px_60px_-52px_rgba(29,27,22,0.38)] transition duration-300 hover:-translate-y-0.5 hover:border-line-strong",
        className,
      )}
      {...props}
    />
  );
}
