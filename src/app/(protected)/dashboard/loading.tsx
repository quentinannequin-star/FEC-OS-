export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-zinc-200 rounded-md animate-pulse" />
        <div className="h-4 w-32 bg-zinc-100 rounded-md animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 bg-white p-4 space-y-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-zinc-100" />
              <div className="h-5 w-28 bg-zinc-100 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-zinc-100 rounded w-full" />
              <div className="h-3 bg-zinc-100 rounded w-3/4" />
            </div>
            <div className="h-8 bg-zinc-100 rounded-lg w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
