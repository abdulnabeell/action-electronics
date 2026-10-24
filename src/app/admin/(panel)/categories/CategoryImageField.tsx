"use client";

import { useState } from "react";

// Optional category picture. Uploads through the admin-only /api/admin/upload route (server checks type, size and
// session); the resulting URL is submitted as `image_url`. `orig_image_url` lets the server skip the column when
// nothing changed, so saving a category never depends on the image feature being switched on.
export default function CategoryImageField({ initial }: { initial: string | null }) {
  const [url, setUrl] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.set("file", file);
    fd.set("folder", "categories");
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "Upload failed.");
      else setUrl(data.url);
    } catch {
      setError("Upload failed. Check your connection and try again.");
    }
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-3">
      <input type="hidden" name="image_url" value={url} />
      <input type="hidden" name="orig_image_url" value={initial ?? ""} />
      <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Category image preview" className="size-full object-contain p-1" />
        ) : (
          "No image"
        )}
      </span>
      <div className="text-xs">
        <label className={`btn-outline !min-h-9 cursor-pointer !px-3 ${busy ? "opacity-60" : ""}`}>
          {busy ? "Uploading…" : url ? "Replace" : "Upload image"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {url && !busy && (
          <button type="button" className="ms-2 font-semibold text-red-600 hover:underline" onClick={() => setUrl("")}>Remove</button>
        )}
        <p className="mt-1 text-slate-500">JPEG, PNG or WebP, up to 4 MB. Square, clean background works best. Applied when you press Save.</p>
        {error && <p className="mt-1 font-semibold text-red-600" role="alert">{error}</p>}
      </div>
    </div>
  );
}
