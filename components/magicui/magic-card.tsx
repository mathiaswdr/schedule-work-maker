import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function MagicCard({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "group/magic-card relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_70px_-56px_rgba(29,27,22,0.55)]",
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover/magic-card:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(249,115,22,0.12),transparent_32%),radial-gradient(circle_at_86%_14%,rgba(29,27,22,0.08),transparent_30%)]" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
