import Link from "next/link";
import { updateStock } from "@/lib/admin/actions";
import { requirePage } from "@/lib/admin/auth";
import { PAGE_SIZE, listInventory } from "@/lib/admin/queries";
import SubmitButton from "../../SubmitButton";
import { EmptyState, Notice, PageTitle, Pager, card, td, th } from "../../ui";

export const dynamic = "force-dynamic";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; error?: string; saved?: string }> }) {
  await requirePage("admin");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total } = await listInventory(sp.q ?? "", page);
  return (
    <div>
      <PageTitle title="Inventory" description="Quickly update stock and availability for each country. Stock drops automatically when you confirm an order." />
      <Notice error={sp.error} saved={sp.saved} />
      <form className={`${card} mb-4 flex gap-2`}>
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search name or SKU" className="input" aria-label="Search inventory" />
        <button className="btn-primary">Search</button>
      </form>
      <div className={`${card} overflow-x-auto !p-0`}>
        <table className="w-full">
          <thead className="border-b border-slate-200"><tr><th className={th}>Product</th><th className={th}>Country</th><th className={th}>Price</th><th className={th}>Stock &amp; availability</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && <tr><td colSpan={4}><EmptyState title="No products found" text="Try a different search." /></td></tr>}
            {rows.flatMap((p: any) =>
              (p.product_prices ?? []).map((r: any) => (
                <tr key={`${p.id}-${r.country_code}`}>
                  <td className={td}><Link href={`/admin/products/${p.id}`} className="font-semibold hover:text-brand">{p.name_en}</Link><span className="block text-xs text-slate-500">{p.sku}{p.active ? "" : " · hidden"}</span></td>
                  <td className={td}>{String(r.country_code).toUpperCase()}</td>
                  <td className={td}>{Number(r.price)}</td>
                  <td className={td}>
                    <form action={updateStock} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="product_id" value={p.id} />
                      <input type="hidden" name="country" value={r.country_code} />
                      <input name="stock" type="number" min="0" step="1" defaultValue={r.stock} className="input !w-24" aria-label={`Stock for ${p.name_en} in ${r.country_code}`} />
                      <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="available" defaultChecked={r.available} className="size-4" /> Available</label>
                      <SubmitButton className="btn-outline !min-h-9 !px-3" pendingText="Saving…">Save</SubmitButton>
                    </form>
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
      <Pager base={`/admin/inventory?q=${encodeURIComponent(sp.q ?? "")}`} page={page} total={total} size={PAGE_SIZE} />
      <p className="mt-2 text-xs text-slate-500">Only products that are sold in at least one country appear here. Add or remove a country on the product itself.</p>
    </div>
  );
}
