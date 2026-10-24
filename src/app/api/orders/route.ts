import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parseOrderPayload } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!rateLimit(`order:${clientIp(req)}`, 8, 10 * 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (body && typeof body.website === "string" && body.website !== "") {
    // Honeypot field filled in: pretend success so bots don't retry.
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const parsed = parseOrderPayload(body);
  if (!parsed.ok) return NextResponse.json({ error: "bad_request", detail: parsed.error }, { status: 400 });
  try {
    const result = await createOrder(parsed.value);
    if (!result.ok) return NextResponse.json(result, { status: result.status });
    return NextResponse.json(result);
  } catch (e) {
    console.error("order failed", e);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
