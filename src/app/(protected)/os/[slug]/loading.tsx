export default function OsLoading() {
  return (
    <div className="space-y-6 max-w-4xl animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-zinc-200" />
        <div className="space-y-2">
          <div className="h-7 w-48 bg-zinc-200 rounded" />
          <div className="h-4 w-32 bg-zinc-100 rounded" />
        </div>
      </div>
      <div className="h-4 w-2/3 bg-zinc-100 rounded" />
      <div className="rounded-xl border-2 border-dashed border-zinc-200 h-56" />
    </div>
  );
}
