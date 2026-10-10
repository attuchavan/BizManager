export function MetricCardSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-24 rounded-md bg-slate-200 dark:bg-slate-800" />
        <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="mt-4 h-7 w-32 rounded-md bg-slate-200 dark:bg-slate-800" />
      <div className="mt-3 flex items-center gap-2">
        <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-28 rounded bg-slate-100 dark:bg-slate-800/60" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="animate-pulse border-b border-slate-100 dark:border-slate-800/80">
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx} className="px-5 py-4">
          <div className="space-y-1.5">
            <div
              className="h-3.5 rounded-md bg-slate-200 dark:bg-slate-800"
              style={{ width: `${60 + (idx % 3) * 15}%` }}
            />
            {idx === 0 && (
              <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-slate-800/50" />
            )}
          </div>
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-left">
        <thead className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/50">
          <tr>
            {Array.from({ length: cols }).map((_, idx) => (
              <th key={idx} className="px-5 py-3">
                <div className="h-3 w-18 rounded bg-slate-200/80 dark:bg-slate-800 animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, idx) => (
            <TableRowSkeleton key={idx} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-7 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-72 rounded bg-slate-100 dark:bg-slate-800/60" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      {/* Launchpad Ribbon Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-2.5 w-14 rounded bg-slate-100 dark:bg-slate-800/60" />
            </div>
          </div>
        ))}
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex justify-between">
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-7 w-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-52 rounded-2xl bg-slate-100 dark:bg-slate-800/40" />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-800" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-18 rounded-2xl bg-slate-100 dark:bg-slate-800/40" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CustomerPortalSkeleton() {
  return (
    <div className="space-y-6 animate-pulse select-none">
      {/* Top Welcome Hero Skeleton */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="h-5 w-48 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-8 w-72 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-96 max-w-full rounded-lg bg-slate-100 dark:bg-slate-800/60" />
        <div className="flex gap-3 pt-2">
          <div className="h-10 w-36 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-10 w-32 rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
        </div>
      </div>

      {/* Recommended Next Step Skeleton */}
      <div className="h-14 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 flex items-center justify-between">
        <div className="h-4 w-64 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-2.5"
          >
            <div className="flex justify-between">
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-7 w-12 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-2.5 w-24 rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
        ))}
      </div>

      {/* Smart Booking Suggestions Carousel Skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-6 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
