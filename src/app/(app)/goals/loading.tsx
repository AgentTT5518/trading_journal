export default function GoalsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded bg-muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-xl bg-muted ring-1 ring-foreground/10"
          />
        ))}
      </div>
    </div>
  );
}
