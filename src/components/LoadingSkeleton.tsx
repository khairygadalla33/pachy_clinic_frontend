

export default function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-surface-200 dark:bg-surface-700 rounded w-full"></div>
      ))}
    </div>
  );
}
