"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, REFRESH_COOKIE, REFRESH_MAX_AGE } from "@/lib/admin/cookies";
import { rateLimit } from "@/lib/rate-limit";
import { adminClient, hasAdminDb, publicClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, fd: FormData): Promise<LoginState> {
  if (!hasAdminDb()) return { error: "Supabase isn't configured. See ENVIRONMENT.md." };
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`login:${ip}`, 8, 10 * 60_000)) return { error: "Too many attempts. Try again in a few minutes." };

  const email = String(fd.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(fd.get("password") ?? "").slice(0, 200);
  if (!email || !password) return { error: "Enter your email and password." };

  const { data, error } = await publicClient().auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) return { error: "Invalid email or password." };

  // Signing in isn't enough: the user must be listed in admin_users.
  const { data: row } = await adminClient().from("admin_users").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!row) return { error: "This account isn't authorised for the admin dashboard." };

  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  const base = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };
  jar.set(ACCESS_COOKIE, data.session.access_token, { ...base, maxAge: Math.max(60, data.session.expires_in - 30) });
  jar.set(REFRESH_COOKIE, data.session.refresh_token, { ...base, maxAge: REFRESH_MAX_AGE });
  redirect("/admin");
}

export async function logout() {
  const jar = await cookies();
  // Revoke the session at Supabase too, so a copied token stops working immediately (best effort).
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (token && hasAdminDb()) await adminClient().auth.admin.signOut(token, "global").catch(() => {});
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  redirect("/admin/login");
}
