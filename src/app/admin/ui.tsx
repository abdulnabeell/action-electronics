import Link from "next/link";
import { Icon } from "./icons";

// Shared building blocks for every admin page, so all screens look and behave the same.

export function Notice({ error, saved }: { error?: string; saved?: string }) {
  if (error)
    return (
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800" role="alert">
        <Icon name="alert" className="mt-0.5 size-5 shrink-0" />
        <p>{error}</p>
      </div>
    );
  if (saved)
    return (
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-3.5 text-sm font-semibold text-green-800" role="status">
        <Icon name="check" className="mt-0.5 size-5 shrink-0" />
        <p>Saved.</p>
      </div>
    );
  return null;
}

export function PageTitle({ title, description, action, children }: { title: string; description?: string; action?: { href: string; label: string }; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {action && (
          <Link href={action.href} className="btn-primary">
            <Icon name="plus" className="size-4" /> {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}

export function Field({ label, children, hint, error, className = "" }: { label: string; children: React.ReactNode; hint?: string; error?: string; className?: string }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-semibold text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-semibold text-red-600" role="alert">{error}</span>}
    </label>
  );
}

/** Card heading with an optional description and action, used at the top of each section of a page or form. */
export function CardHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 sm:col-span-full lg:col-span-full">
      <div>
        <h2 className="text-base font-bold">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400"><Icon name="inbox" className="size-6" /></span>
      <p className="mt-3 font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <Link href={action.href} className="btn-outline mt-4">{action.label}</Link>}
    </div>
  );
}

/** KPI tile. Only render it for numbers that really come from the database. */
export function StatCard({ label, value, hint, href, tone = "default" }: { label: string; value: React.ReactNode; hint?: React.ReactNode; href?: string; tone?: "default" | "warn" }) {
  const body = (
    <>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold tracking-tight ${tone === "warn" ? "text-amber-700" : ""}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </>
  );
  const cls = "block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  return href ? <Link href={href} className={`${cls} transition hover:border-brand hover:shadow`}>{body}</Link> : <div className={cls}>{body}</div>;
}

export const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
export const th = "whitespace-nowrap bg-slate-50 px-4 py-2.5 text-start text-xs font-bold uppercase tracking-wide text-slate-500";
export const td = "px-4 py-3 align-middle text-sm";

const STATUS: Record<string, { cls: string; dot: string }> = {
  pending: { cls: "bg-amber-100 text-amber-900", dot: "bg-amber-500" },
  confirmed: { cls: "bg-blue-100 text-blue-900", dot: "bg-blue-500" },
  processing: { cls: "bg-indigo-100 text-indigo-900", dot: "bg-indigo-500" },
  shipped: { cls: "bg-cyan-100 text-cyan-900", dot: "bg-cyan-500" },
  completed: { cls: "bg-green-100 text-green-800", dot: "bg-green-500" },
  cancelled: { cls: "bg-slate-200 text-slate-700", dot: "bg-slate-500" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { cls: "bg-slate-100 text-slate-700", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${s.cls}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {status}
    </span>
  );
}

/** Visible / Hidden (or Active / Paused) pill with a text label, never colour alone. */
export function VisibilityBadge({ on, onLabel = "Visible", offLabel = "Hidden" }: { on: boolean; onLabel?: string; offLabel?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${on ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}>
      <span className={`size-1.5 rounded-full ${on ? "bg-green-500" : "bg-amber-500"}`} aria-hidden="true" />
      {on ? onLabel : offLabel}
    </span>
  );
}

export function Pager({ base, page, total, size }: { base: string; page: number; total: number; size: number }) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  const href = (p: number) => `${base}${base.includes("?") ? "&" : "?"}page=${p}`;
  return (
    <nav className="mt-4 flex items-center justify-between gap-2 text-sm" aria-label="Pagination">
      {page > 1 ? <Link className="btn-outline" href={href(page - 1)}>Previous</Link> : <span />}
      <span className="text-slate-500">Page {page} of {pages} · {total} total</span>
      {page < pages ? <Link className="btn-outline" href={href(page + 1)}>Next</Link> : <span />}
    </nav>
  );
}
