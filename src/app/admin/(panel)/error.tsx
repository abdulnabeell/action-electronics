"use client";

import Link from "next/link";

// Friendly fallback when an admin page cannot load (for example the database is unreachable).
// Technical details stay in the server log; only a reference code is shown.
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6" role="alert">
      <h1 className="text-lg font-extrabold text-red-800">This page couldn't load</h1>
      <p className="mt-1 text-sm text-red-800">Nothing has been changed. Check your internet connection and try again. If it keeps happening, tell your developer{error.digest ? <> this reference: <code>{error.digest}</code></> : null}.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={reset} className="btn-primary">Try again</button>
        <Link href="/admin" className="btn-outline">Back to dashboard</Link>
      </div>
    </div>
  );
}
