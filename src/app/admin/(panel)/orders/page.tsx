import Link from "next/link";
import { requirePage } from "@/lib/admin/auth";
import { PAGE_SIZE, listOrders } from "@/lib/admin/queries";
import { formatMoney } from "@/lib/pricing";
import { orderStatuses } from "@/types/catalog";
import { EmptyState, Notice, PageTitle, Pager, StatusBadge, card, td, th } from "../../ui";

export const dynamic = "force-dynamic";

type SP = Promise<{ q?: string; status?: string; country?: string; page?: string; error?: string; saved?: string }>;

export default async function OrdersPage({ searchParams }: { searchParams: SP }) {
  await requirePage("staff");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = orderStatuses.includes(sp.status as never) ? sp.status! : "";
  const country = sp.country === "uae" || sp.country === "oman" ? sp.country : "";
  const { rows, total } = await listOrders({ q: sp.q ?? "", status, country, page });
  const base = `/admin/orders?${new URLSearchParams({ q: sp.q ?? "", status, country }).toString()}`;

  return (
    <div>
      <PageTitle title="Orders" description="Orders placed through your shop. Open an order to update its status or contact the customer." />
      <Notice error={sp.error} saved={sp.saved} />
      <form className={`${card} mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]`}>
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search order ID, name or phone" className="input" aria-label="Search orders" />
        <select name="status" defaultValue={status} className="input" aria-label="Status">
          <option value="">All statuses</option>
          {orderStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="country" defaultValue={country} className="input" aria-label="Country">
          <option value="">All countries</option>
          <option value="uae">UAE</option>
          <option value="oman">Oman</option>
        </select>
        <button className="btn-primary">Filter</button>
      </form>

      <div className={`${card} overflow-x-auto !p-0`}>
        <table className="w-full">
          <thead className="border-b border-slate-200"><tr><th className={th}>Order</th><th className={th}>Date</th><th className={th}>Customer</th><th className={th}>Country</th><th className={th}>Total</th><th className={th}>Status</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && <tr><td colSpan={6}><EmptyState title="No orders found" text="New orders appear here. Try clearing the filters if you expected some." action={{ href: "/admin/orders", label: "Clear filters" }} /></td></tr>}
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand">{o.order_code}</Link></td>
                <td className={td}>{new Date(o.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className={td}>{o.customer_name}<span className="block text-xs text-slate-500" dir="ltr">{o.customer_phone}</span></td>
                <td className={td}>{String(o.country_code).toUpperCase()}</td>
                <td className={td}>{formatMoney(Number(o.total), o.currency, o.currency === "OMR" ? 3 : 2, "en")}</td>
                <td className={td}><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager base={base} page={page} total={total} size={PAGE_SIZE} />
    </div>
  );
}
