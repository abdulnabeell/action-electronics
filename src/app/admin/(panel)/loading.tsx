// Shown while any admin page is loading, so the screen never looks frozen.
export default function Loading() {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
