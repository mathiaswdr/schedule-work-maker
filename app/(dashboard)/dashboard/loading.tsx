import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-line bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,118,110,0.45)] sm:p-8">
      {/* Decorative blobs — matches real pages */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 bg-[radial-gradient(circle_at_30%_30%,rgba(15,118,110,0.25),transparent_60%)] blur-2xl will-change-transform"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 bg-[radial-gradient(circle_at_40%_40%,rgba(249,115,22,0.25),transparent_60%)] blur-3xl will-change-transform"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(29,27,22,0.07)_1px,transparent_0)] bg-[length:18px_18px] opacity-30 will-change-transform"
      />

      <div className="relative space-y-8">
        {/* Header: eyebrow / title / subtitle */}
        <div className="space-y-3">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="h-7 w-56 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>

        {/* 3-column summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="space-y-3 rounded-2xl border border-line bg-white/80 px-5 py-4"
            >
              <Skeleton className="h-3 w-16 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-lg" />
              <Skeleton className="h-3 w-20 rounded-full" />
            </div>
          ))}
        </div>

        {/* Large content area */}
        <div className="rounded-3xl border border-line bg-panel p-6 shadow-[0_30px_60px_-46px_rgba(15,118,110,0.35)]">
          <div className="space-y-4">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
