import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE } from "@/lib/admin/cookies";
import { adminClient, hasAdminDb } from "@/lib/supabase/server";

export type Admin = { userId: string; email: string; role: "admin" | "staff" };

/**
 * Verifies the signed-in user on the server: the access token is validated by Supabase Auth and the user
 * must have a row in `admin_users`. Never trust the browser — call this in every page and every action.
 */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  if (!hasAdminDb()) return null;
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  const db = adminClient();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: row } = await db.from("admin_users").select("role, email").eq("user_id", data.user.id).maybeSingle();
  if (!row) return null;
  return { userId: data.user.id, email: row.email ?? data.user.email ?? "", role: row.role === "staff" ? "staff" : "admin" };
});

/** For pages: redirects to the login screen when not signed in; staff are limited to orders. */
export async function requirePage(role: "admin" | "staff" = "admin"): Promise<Admin> {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  if (role === "admin" && a.role !== "admin") redirect("/admin/orders");
  return a;
}

/** For server actions / route handlers: throws instead of redirecting. */
export async function requireAction(role: "admin" | "staff" = "admin"): Promise<Admin> {
  const a = await getAdmin();
  if (!a) throw new Error("Not signed in");
  if (role === "admin" && a.role !== "admin") throw new Error("Not allowed");
  return a;
}
