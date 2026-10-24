import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { adminClient, hasAdminDb } from "@/lib/supabase/server";
import { phoneDigits } from "@/lib/validators";

export const dynamic = "force-dynamic";

// Public order lookup: needs BOTH the order code and the phone number used at checkout.
export async function POST(req: Request) {
  if (!rateLimit(`track:${clientIp(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const body = (await req.json().catch(() => null)) as { code?: unknown; phone?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase().slice(0, 40) : "";
  const phone = typeof body?.phone === "string" ? phoneDigits(body.phone) : "";
  if (!code || phone.length < 7) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!hasAdminDb()) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data } = await adminClient()
    .from("orders")
    .select("order_code, status, total, currency, created_at, customer_phone")
    .eq("order_code", code)
    .maybeSingle();
  // Same response whether the code or the phone is wrong, so codes can't be probed.
  if (!data || phoneDigits(data.customer_phone) !== phone) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ code: data.order_code, status: data.status, total: Number(data.total), currency: data.currency, createdAt: data.created_at });
}
