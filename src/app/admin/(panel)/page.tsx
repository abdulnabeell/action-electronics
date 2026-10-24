import Link from "next/link";
import { requirePage } from "@/lib/admin/auth";
import { getDashboard } from "@/lib/admin/queries";
import { formatMoney } from "@/lib/pricing";
import { orderStatuses } from "@/types/catalog";
import { CardHeader, EmptyState, PageTitle, StatCard, StatusBadge, card, td, th } from "../ui";

export const dynamic = "force-dynamic";

const dec = (c: string) => (c === "OMR" ? 3 : 2);

export default async function Dashboard() {
  await requirePage("admin");
  const d = await getDashboard();
  const money = (n: number, c: string) => formatMoney(n, c, dec(c), "en");
  const pending = d.byStatus.pending ?? 0;
  const sales = Object.entries(d.sales);

  return (
    <div className="space-y-6">
      <PageTitle title="Dashboard" description="A quick look at your store. Everything here comes from your live orders and catalogue." action={{ href: "/admin/products/new", label: "Add product" }}>
        <Link href="/admin/categories" className="btn-outline">Manage categories</Link>
      </PageTitle>

      <section aria-label="Key numbers" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Orders to review" value={pending} hint={pending ? "Waiting for confirmation" : "Nothing waiting"} href="/admin/orders?status=pending" tone={pending ? "warn" : "default"} />
        <StatCard label="Total orders" value={d.totalOrders} hint="All time, all countries" href="/admin/orders" />
        <StatCard label="Products" value={d.productCount} hint={`${d.activeProducts} visible in the shop${d.productCount - d.activeProducts ? ` · ${d.productCount - d.activeProducts} hidden` : ""}`} href="/admin/products" />
        <StatCard label="Active promotions" value={d.activePromotions} hint="Discounts and banners" href="/admin/promotions" />
      </section>

      <section aria-label="Sales" className={card}>
        <CardHeader title="Sales" description="Confirmed, processing, shipped and completed orders. Each currency is shown separately — AED and OMR are never added together." />
        {sales.length === 0 ? (
          <EmptyState title="No sales yet" text="Sales appear here once an order is confirmed." />
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {sales.map(([cur, s]) => (
              <div key={cur} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{cur === "OMR" ? "Oman (OMR)" : cur === "AED" ? "UAE (AED)" : cur}</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight">{money(s.total, cur)}</p>
                <p className="text-xs text-slate-500">{s.orders} order{s.orders === 1 ? "" : "s"}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Orders by status" className={card}>
        <CardHeader title="Orders by status" description="Select a status to see those orders." />
        <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {orderStatuses.map((s) => (
            <Link key={s} href={`/admin/orders?status=${s}`} className="rounded-xl border border-slate-200 p-3 transition hover:border-brand hover:bg-slate-50">
              <StatusBadge status={s} />
              <p className="mt-2 text-2xl font-extrabold">{d.byStatus[s] ?? 0}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className={`${card} !p-0`}>
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <CardHeader title="Recent orders" />
            <Link href="/admin/orders" className="text-sm font-semibold text-brand">View all</Link>
          </div>
          {d.recent.length === 0 ? (
            <EmptyState title="No orders yet" text="New orders placed through WhatsApp checkout will show up here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Total</th><th className={th}>Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {d.recent.map((o: any) => (
                    <tr key={o.id}>
                      <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand hover:underline">{o.order_code}</Link></td>
                      <td className={td}>{o.customer_name}</td>
                      <td className={td}>{money(Number(o.total), o.currency)}</td>
                      <td className={td}><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={`${card} !p-0`}>
          <div className="border-b border-slate-100 p-5">
            <CardHeader title="Low stock" description="Products with 3 or fewer left in a country where they are on sale." />
          </div>
          {d.lowStock.length === 0 ? (
            <EmptyState title="Stock levels look fine" text="Nothing is running low right now." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className={th}>Product</th><th className={th}>Country</th><th className={th}>Stock</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {d.lowStock.map((l: any) => (
                    <tr key={`${l.product_id}-${l.country_code}`}>
                      <td className={td}><Link href={`/admin/products/${l.product_id}`} className="font-semibold hover:text-brand">{l.products?.name_en ?? l.product_id}</Link></td>
                      <td className={td}>{String(l.country_code).toUpperCase()}</td>
                      <td className={td}><span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">{l.stock} left</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className={`${card} !p-0`}>
        <div className="border-b border-slate-100 p-5">
          <CardHeader title="Best-selling products" description="Units sold, excluding cancelled orders." />
        </div>
        {d.bestSellers.length === 0 ? (
          <EmptyState title="No sales data yet" text="Your best sellers will be listed here after the first orders." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className={th}>Product</th><th className={th}>Units</th><th className={th}>Revenue</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {d.bestSellers.map((b) => (
                  <tr key={`${b.product_id}-${b.currency}`}>
                    <td className={td}>{b.name}<span className="block text-xs text-slate-500">{b.sku}</span></td>
                    <td className={td}>{b.units}</td>
                    <td className={td}>{money(Number(b.revenue), b.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
