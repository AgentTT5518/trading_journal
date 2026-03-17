export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-36 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>

      <div className="rounded-xl ring-1 ring-foreground/10 p-6">
        <div className="h-5 w-32 animate-pulse rounded bg-muted mb-4" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, j) => (
                  <div
                    key={j}
                    className="aspect-square animate-pulse rounded-sm bg-muted"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
