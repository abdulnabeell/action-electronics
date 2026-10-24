import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Two clients, both server-side only:
//   publicClient() — anon key, subject to RLS (read-only catalogue data).
//   adminClient()  — service-role key, bypasses RLS. Used ONLY after the caller has been authorised
//                    (orders API, admin server actions). The key is never sent to the browser: it has no
//                    NEXT_PUBLIC_ prefix and this module is marked server-only.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasPublicDb = () => !!url && !!anonKey;
export const hasAdminDb = () => !!url && !!serviceKey && !!anonKey;

const opts = { auth: { persistSession: false, autoRefreshToken: false } } as const;
let pub: SupabaseClient | undefined;
let adm: SupabaseClient | undefined;

export function publicClient(): SupabaseClient {
  if (!url || !anonKey) throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
  return (pub ??= createClient(url, anonKey, opts));
}

export function adminClient(): SupabaseClient {
  if (!url || !serviceKey) throw new Error("Supabase admin access is not configured (SUPABASE_SERVICE_ROLE_KEY).");
  return (adm ??= createClient(url, serviceKey, opts));
}

export const supabaseUrl = () => url;
export const supabaseAnonKey = () => anonKey;
