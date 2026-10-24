import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin/auth";
import { adminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// Detect the real file type from its first bytes — the browser-reported type can be faked.
function sniff(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return null;
}

export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Not allowed" }, { status: 401 });

  // Same-origin only (the session cookie is SameSite=Lax; this is an extra CSRF guard).
  const origin = req.headers.get("origin");
  if (origin) {
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {} // malformed or "null" origin
    if (originHost !== req.headers.get("host")) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size === 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "Image must be under 4 MB." }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type || !TYPES[type]) return NextResponse.json({ error: "Only JPEG, PNG or WebP images are allowed." }, { status: 415 });

  const folder = form?.get("folder") === "categories" ? "categories/" : "";
  const path = `${folder}${new Date().getUTCFullYear()}/${randomBytes(12).toString("hex")}.${TYPES[type]}`;
  const db = adminClient();
  const { error } = await db.storage.from("product-images").upload(path, bytes, { contentType: type, cacheControl: "31536000", upsert: false });
  if (error) return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  const { data } = db.storage.from("product-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
