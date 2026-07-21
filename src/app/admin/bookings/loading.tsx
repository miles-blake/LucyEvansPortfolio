export default function BookingsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-40 bg-ink/8 rounded-sm animate-pulse" />
      <div className="border border-border rounded-sm divide-y divide-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="h-4 w-32 bg-ink/8 rounded-sm animate-pulse" />
            <div className="h-4 w-24 bg-ink/8 rounded-sm animate-pulse" />
            <div className="h-4 w-20 bg-ink/8 rounded-sm animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
