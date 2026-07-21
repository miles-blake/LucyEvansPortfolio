export default function GalleryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Filter bar skeleton */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-sm bg-ink/8 animate-pulse shrink-0" />
        ))}
      </div>
      {/* Grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="aspect-square bg-ink/8 rounded-sm animate-pulse" />
        ))}
      </div>
    </div>
  );
}
