"use client";

import { useEffect, useState } from "react";

// Manages a product's image list. Uploads go to /api/admin/upload (admin-only, stored in Supabase Storage);
// the resulting URLs are submitted with the form as one URL per line. The first image is the main photo.
const MAX_IMAGES = 10;

export default function ImageManager({ initial, onBusyChange, onDirty }: { initial: string[]; onBusyChange?: (busy: boolean) => void; onDirty?: () => void }) {
  const [images, setImages] = useState<string[]>(initial);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Tell the form while an upload is running so it can not be saved without the image, and when the list changed.
  useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);
  useEffect(() => {
    if (images !== initial && images.join("|") !== initial.join("|")) onDirty?.();
  }, [images, initial, onDirty]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_IMAGES - images.length;
    const chosen = Array.from(files).slice(0, Math.max(0, room));
    setBusy(true);
    setError(files.length > chosen.length ? `Only ${MAX_IMAGES} images fit on a product - the extra photos were skipped.` : "");
    for (const file of chosen) {
      const fd = new FormData();
      fd.set("file", file);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) setError(data.error ?? "Upload failed.");
        else setImages((s) => [...s, data.url]);
      } catch {
        setError("Upload failed.");
      }
    }
    setBusy(false);
  };

  const move = (i: number, d: number) =>
    setImages((s) => {
      const n = [...s];
      const j = i + d;
      if (j < 0 || j >= n.length) return s;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  return (
    <div>
      <input type="hidden" name="images" value={images.join("\n")} />
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {images.map((src, i) => (
            <li key={src + i} className="overflow-hidden rounded-xl border border-slate-200 bg-white text-xs shadow-xs">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={i === 0 ? "Main product image" : `Product image ${i + 1}`} className="aspect-square w-full bg-slate-50 object-contain p-1" />
                <span className={`absolute start-1.5 top-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${i === 0 ? "bg-brand text-white" : "bg-white/90 text-slate-600"}`}>{i === 0 ? "Main" : i + 1}</span>
              </div>
              <div className="flex items-center gap-1 border-t border-slate-100 p-1.5">
                <button type="button" className="grid size-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move image ${i + 1} earlier`}>←</button>
                <button type="button" className="grid size-8 place-items-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label={`Move image ${i + 1} later`}>→</button>
                <button type="button" className="ms-auto rounded-lg border border-red-200 px-2 py-1.5 font-semibold text-red-600 hover:bg-red-50" onClick={() => setImages((s) => s.filter((_, k) => k !== i))} aria-label={`Remove image ${i + 1}`}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <label className={`mt-3 flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${images.length >= MAX_IMAGES ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400" : "border-slate-300 hover:border-brand hover:bg-brand-light/40"}`}>
        <span className="text-sm font-semibold">{busy ? "Uploading…" : images.length === 0 ? "Click to upload product photos" : "Add more photos"}</span>
        <span className="text-xs text-slate-500">JPEG, PNG or WebP · up to 4 MB each · {images.length} of {MAX_IMAGES} used</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={busy || images.length >= MAX_IMAGES} onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste a /products/ path or storage URL" className="input !w-72 max-w-full" aria-label="Image URL" />
        <button type="button" className="btn-outline" disabled={images.length >= MAX_IMAGES} onClick={() => { if (url.trim()) { setImages((s) => [...s, url.trim()]); setUrl(""); } }}>Add URL</button>
      </div>
      <p className="mt-2 text-xs text-slate-500">The first image is the main photo shown in the shop. Use real photographs on a clean background. Removing an image here only takes effect when you save.</p>
      {error && <p className="mt-1 text-sm font-semibold text-red-600" role="alert">{error}</p>}
    </div>
  );
}
