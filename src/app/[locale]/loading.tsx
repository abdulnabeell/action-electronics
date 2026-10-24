export default function Loading() {
  return (
    <div className="container-x py-10" role="status" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
