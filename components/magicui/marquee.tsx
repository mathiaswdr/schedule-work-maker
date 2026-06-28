import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Marquee({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "group relative flex overflow-hidden [--gap:1rem] [--duration:28s]",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-full shrink-0 items-center justify-around gap-[var(--gap)] motion-safe:animate-[marquee_var(--duration)_linear_infinite] group-hover:[animation-play-state:paused]">
        {children}
      </div>
      <div
        aria-hidden="true"
        className="flex min-w-full shrink-0 items-center justify-around gap-[var(--gap)] motion-safe:animate-[marquee_var(--duration)_linear_infinite] group-hover:[animation-play-state:paused]"
      >
        {children}
      </div>
    </div>
  );
}
