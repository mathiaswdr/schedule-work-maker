import { cn } from "@/lib/utils";

type BorderBeamProps = {
  className?: string;
};

export function BorderBeam({ className }: BorderBeamProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]",
        className,
      )}
    >
      <span className="absolute left-0 top-0 h-px w-32 bg-gradient-to-r from-transparent via-brand to-transparent motion-safe:animate-[border-beam-x_4.8s_linear_infinite]" />
      <span className="absolute bottom-0 right-0 h-px w-32 bg-gradient-to-r from-transparent via-brand to-transparent motion-safe:animate-[border-beam-x-reverse_4.8s_linear_infinite]" />
      <span className="absolute right-0 top-0 h-32 w-px bg-gradient-to-b from-transparent via-brand to-transparent motion-safe:animate-[border-beam-y_5.4s_linear_infinite]" />
      <span className="absolute bottom-0 left-0 h-32 w-px bg-gradient-to-b from-transparent via-brand to-transparent motion-safe:animate-[border-beam-y-reverse_5.4s_linear_infinite]" />
    </div>
  );
}
