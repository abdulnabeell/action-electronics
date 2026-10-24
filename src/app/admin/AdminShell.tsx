"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/admin/auth-actions";
import { Icon } from "./icons";

export type NavItem = { href: string; label: string; icon: string; exact?: boolean };
export type NavGroup = { label: string; items: NavItem[] };

const TITLES: Record<string, string> = {
  "/admin/orders": "Orders",
  "/admin/products": "Products",
  "/admin/inventory": "Inventory",
  "/admin/categories": "Categories",
  "/admin/brands": "Brands",
  "/admin/promotions": "Promotions",
  "/admin/settings": "Countries & contact",
};

function crumbs(pathname: string): { label: string; href?: string }[] {
  const parts = pathname.split("/").filter(Boolean); // ["admin", "products", "new"]
  if (parts.length <= 1) return [{ label: "Dashboard" }];
  const base = `/admin/${parts[1]}`;
  const out: { label: string; href?: string }[] = [{ label: "Admin", href: "/admin" }, { label: TITLES[base] ?? parts[1], href: parts.length > 2 ? base : undefined }];
  if (parts.length > 2) out.push({ label: parts[2] === "new" ? "New" : parts[1] === "orders" ? "Order details" : "Edit" });
  return out;
}

const STORAGE_KEY = "ae_admin_sidebar_collapsed";

export default function AdminShell({ groups, email, role, children }: { groups: NavGroup[]; email: string; role: "admin" | "staff"; children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const account = useRef<HTMLDetailsElement>(null);

  // Remember the sidebar state per browser (optional convenience; the page works without it).
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {}
  }, []);
  const toggleCollapsed = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });

  // Close the drawer / account menu after navigating, on Escape, and lock page scroll while the drawer is open.
  useEffect(() => {
    setDrawer(false);
    account.current?.removeAttribute("open");
  }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawer(false);
        account.current?.removeAttribute("open");
      }
    };
    const onClick = (e: MouseEvent) => {
      if (account.current?.open && !account.current.contains(e.target as Node)) account.current.removeAttribute("open");
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  const isActive = (i: NavItem) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`));

  const brand = (compact: boolean) => (
    <Link href="/admin" className="flex items-center gap-3 overflow-hidden" aria-label="Action Electronics admin home">
      <Image src="/logo.png" alt="" width={36} height={36} className="size-9 shrink-0 rounded-lg border border-slate-200 bg-white object-contain" priority />
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-extrabold tracking-tight">Action Electronics</span>
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Admin</span>
        </span>
      )}
    </Link>
  );

  const nav = (compact: boolean) => (
    <nav aria-label="Admin" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {groups.map((g) => (
        <div key={g.label}>
          {!compact ? <p className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{g.label}</p> : <div className="mx-2 mb-2 border-t border-slate-100" />}
          <ul className="space-y-0.5">
            {g.items.map((i) => {
              const active = isActive(i);
              return (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    title={compact ? i.label : undefined}
                    aria-label={compact ? i.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold transition ${compact ? "justify-center" : ""} ${active ? "bg-brand-light text-brand" : "text-slate-600 hover:bg-slate-100 hover:text-ink"}`}
                  >
                    <Icon name={i.icon} className={`size-5 shrink-0 ${active ? "text-brand" : "text-slate-400 group-hover:text-slate-600"}`} />
                    {!compact && <span className="truncate">{i.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const trail = crumbs(pathname);
  const initial = (email.trim()[0] ?? "A").toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className={`fixed inset-y-0 start-0 z-30 hidden flex-col border-e border-slate-200 bg-white transition-[width] duration-200 lg:flex ${collapsed ? "w-[4.5rem]" : "w-64"}`}>
        <div className={`flex h-14 items-center border-b border-slate-100 ${collapsed ? "justify-center px-2" : "px-4"}`}>
          {brand(collapsed)}
        </div>
        {nav(collapsed)}
        <div className="border-t border-slate-100 p-3">
          <button type="button" onClick={toggleCollapsed} className="flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-ink" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-pressed={collapsed}>
            <Icon name={collapsed ? "chevronRight" : "chevronLeft"} className="size-4 rtl:rotate-180" />
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      {/* Mobile / tablet drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close menu" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
              {brand(false)}
              <button type="button" onClick={() => setDrawer(false)} className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close menu">
                <Icon name="close" className="size-5" />
              </button>
            </div>
            {nav(false)}
          </aside>
        </div>
      )}

      <div className={`transition-[padding] duration-200 ${collapsed ? "lg:ps-[4.5rem]" : "lg:ps-64"}`}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button type="button" onClick={() => setDrawer(true)} className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu" aria-expanded={drawer}>
            <Icon name="menu" />
          </button>
          <button type="button" onClick={toggleCollapsed} className="hidden size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:grid" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <Icon name="menu" className="size-5" />
          </button>
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 truncate text-sm">
              {trail.map((c, i) => (
                <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
                  {i > 0 && <span className="text-slate-300" aria-hidden="true">/</span>}
                  {c.href ? <Link href={c.href} className="truncate text-slate-500 hover:text-brand">{c.label}</Link> : <span className="truncate font-semibold" aria-current={i === trail.length - 1 ? "page" : undefined}>{c.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
          <a href="/" target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:inline-flex">
            View store <Icon name="external" className="size-4" />
          </a>
          <details ref={account} className="relative">
            <summary className="grid size-9 cursor-pointer list-none place-items-center rounded-full bg-brand text-sm font-bold text-white marker:hidden [&::-webkit-details-marker]:hidden" aria-label="Account menu">{initial}</summary>
            <div className="absolute end-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-semibold">{email || "Signed in"}</p>
                <p className="text-xs capitalize text-slate-500">{role === "admin" ? "Administrator" : "Staff (orders only)"}</p>
              </div>
              <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:hidden">
                <Icon name="external" className="size-4" /> View store
              </a>
              <form action={logout}>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                  <Icon name="logout" className="size-4" /> Sign out
                </button>
              </form>
            </div>
          </details>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-7xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
