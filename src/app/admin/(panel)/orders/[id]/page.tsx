import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/admin/auth";
import { updateOrderStatus } from "@/lib/admin/actions";
import { getOrder } from "@/lib/admin/queries";
import { formatMoney } from "@/lib/pricing";
import { whatsappLink } from "@/lib/order-core";
import { orderStatuses } from "@/types/catalog";
import SubmitButton from "../../../SubmitButton";
import { Notice, StatusBadge, card, td, th } from "../../../ui";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  await requirePage("staff");
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID.test(id)) notFound();
  const data = await getOrder(id);
  if (!data) notFound();
  const { order: o, items } = data;
  const dec = o.currency === "OMR" ? 3 : 2;
  const money = (n: number) => formatMoney(Number(n), o.currency, dec, "en");
  const customerPhone = String(o.customer_phone).replace(/\D/g, "");

  return (
    <div className="space-y-4">
      <p className="text-sm"><Link href="/admin/orders" className="font-semibold text-brand hover:underline">← Back to orders</Link></p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold" dir="ltr">{o.order_code}</h1>
        <StatusBadge status={o.status} />
      </div>
      <Notice error={sp.error} saved={sp.saved} />

      <section className={card}>
        <h2 className="font-bold">Update status</h2>
        <form action={updateOrderStatus} className="mt-2 flex flex-wrap items-center gap-2">
          <input type="hidden" name="order_id" value={o.id} />
          <input type="hidden" name="back" value={`/admin/orders/${o.id}`} />
          <select name="status" defaultValue={o.status} className="input !w-auto" aria-label="Status">
            {orderStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <SubmitButton pendingText="Saving…">Save status</SubmitButton>
        </form>
        <p className="mt-2 text-xs text-slate-500">Moving to Confirmed/Processing/Shipped/Completed deducts stock once; moving back to Pending or Cancelled restores it.</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={card}>
          <h2 className="font-bold">Customer</h2>
          <dl className="mt-2 grid grid-cols-[110px_1fr] gap-y-1 text-sm">
            <dt className="text-slate-500">Name</dt><dd>{o.customer_name}</dd>
            <dt className="text-slate-500">Phone</dt><dd dir="ltr" className="text-start">{o.customer_phone}</dd>
            {o.customer_email && (<><dt className="text-slate-500">Email</dt><dd>{o.customer_email}</dd></>)}
            <dt className="text-slate-500">Country</dt><dd>{String(o.country_code).toUpperCase()} · {o.lang === "ar" ? "Arabic" : "English"}</dd>
            <dt className="text-slate-500">Method</dt><dd>{o.method === "delivery" ? "Delivery" : "Store pickup"}</dd>
            {o.region && (<><dt className="text-slate-500">Region</dt><dd>{o.region}</dd></>)}
            {o.address && (<><dt className="text-slate-500">Address</dt><dd>{o.address}</dd></>)}
            {o.notes && (<><dt className="text-slate-500">Notes</dt><dd>{o.notes}</dd></>)}
            <dt className="text-slate-500">Placed</dt><dd>{new Date(o.created_at).toLocaleString("en-GB")}</dd>
          </dl>
          {customerPhone.length >= 7 && (
            <a className="btn-wa mt-3" target="_blank" rel="noopener noreferrer" href={whatsappLink(customerPhone, `Hello ${o.customer_name}, regarding your order ${o.order_code} at Action Electronics.`)}>Message customer on WhatsApp</a>
          )}
        </section>

        <section className={card}>
          <h2 className="font-bold">Items</h2>
          <table className="mt-2 w-full">
            <thead><tr><th className={th}>Item</th><th className={th}>Qty</th><th className={th}>Unit</th><th className={th}>Total</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((i) => (
                <tr key={i.id}>
                  <td className={td}>{i.name}<span className="block text-xs text-slate-500">{i.sku}</span></td>
                  <td className={td}>{i.qty}</td>
                  <td className={td}>{money(i.unit_price)}</td>
                  <td className={td}>{money(i.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(o.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd>{Number(o.delivery_fee) === 0 ? "—" : money(o.delivery_fee)}</dd></div>
            <div className="flex justify-between text-base font-extrabold"><dt>Total</dt><dd>{money(o.total)}</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}
