export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-36 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl bg-muted ring-1 ring-foreground/10"
          />
        ))}
      </div>

      <div className="h-[360px] animate-pulse rounded-xl bg-muted ring-1 ring-foreground/10" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-[310px] animate-pulse rounded-xl bg-muted ring-1 ring-foreground/10" />
        <div className="h-[310px] animate-pulse rounded-xl bg-muted ring-1 ring-foreground/10" />
      </div>
    </div>
  );
}
