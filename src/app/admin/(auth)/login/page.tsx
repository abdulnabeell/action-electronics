"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login, type LoginState } from "@/lib/admin/auth-actions";
import { Icon } from "../../icons";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-brand-light/60 to-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="" width={56} height={56} className="size-14 rounded-xl border border-slate-200 bg-white object-contain shadow-sm" priority />
          <h1 className="mt-3 text-xl font-extrabold tracking-tight">Action Electronics</h1>
          <p className="text-sm text-slate-500">Admin dashboard</p>
        </div>
        <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" required className="input" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
          </div>
          {state.error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
              <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
              <p>{state.error}</p>
            </div>
          )}
          <button type="submit" className="btn-primary w-full" disabled={pending} aria-busy={pending}>{pending ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">Staff accounts only. Contact the store owner if you need access.</p>
      </div>
    </main>
  );
}
