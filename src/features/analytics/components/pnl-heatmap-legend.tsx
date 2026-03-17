export function PnlHeatmapLegend() {
  const items = [
    { bg: 'bg-red-800', label: 'Large loss' },
    { bg: 'bg-red-400', label: 'Small loss' },
    { bg: 'bg-gray-300', label: 'Breakeven' },
    { bg: 'bg-muted', label: 'No trades' },
    { bg: 'bg-green-400', label: 'Small profit' },
    { bg: 'bg-green-800', label: 'Large profit' },
  ];

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span>Legend:</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <div className={`h-3 w-3 rounded-sm ${item.bg}`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
