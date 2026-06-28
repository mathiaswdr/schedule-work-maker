import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AnimatedGradientTextProps = {
  children: ReactNode;
  className?: string;
};

export function AnimatedGradientText({
  children,
  className,
}: AnimatedGradientTextProps) {
  return (
    <span
      className={cn(
        "inline-flex bg-[linear-gradient(90deg,#f97316,#1d1b16,#f97316)] bg-[length:220%_100%] bg-clip-text text-transparent motion-safe:animate-[gradient-shift_8s_ease-in-out_infinite]",
        className,
      )}
    >
      {children}
    </span>
  );
}
