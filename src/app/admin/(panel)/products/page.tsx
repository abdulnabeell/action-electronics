import Image from "next/image";
import Link from "next/link";
import { deleteProduct, setProductVisibility } from "@/lib/admin/actions";
import { requirePage } from "@/lib/admin/auth";
import { PAGE_SIZE, listCategories, listProducts, type ProductFilters } from "@/lib/admin/queries";
import { ancestry, buildTree, visibleSlugs, type CategoryNode } from "@/lib/categories";
import ConfirmSubmit from "../../ConfirmSubmit";
import SubmitButton from "../../SubmitButton";
import { EmptyState, Notice, PageTitle, Pager, VisibilityBadge, card, td, th } from "../../ui";

export const dynamic = "force-dynamic";

type SP = Promise<{ q?: string; page?: string; status?: string; category?: string; sort?: string; error?: string; saved?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  await requirePage("admin");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const cats = await listCategories();
  const shown = visibleSlugs(cats);

  const status: ProductFilters["status"] = sp.status === "active" || sp.status === "hidden" ? sp.status : "";
  const sort: ProductFilters["sort"] = sp.sort === "name" ? "name" : "new";
  const top = cats.find((c) => c.slug === sp.category && !c.parent);
  // A main category filter includes everything below it.
  const subtree = (slug: string): string[] => [slug, ...cats.filter((c) => c.parent === slug).flatMap((c) => subtree(c.slug))];
  const { rows, total } = await listProducts(sp.q ?? "", page, { status, categorySlugs: top ? subtree(top.slug) : null, sort });

  const tree = buildTree(cats, true);
  const labelOf = (p: { category_slug: string; subcategory_slug: string | null }) => {
    const chain = ancestry(cats, p.subcategory_slug ?? p.category_slug);
    // The storefront lists a product under its main category as long as that is visible (a hidden subcategory is simply skipped).
    return { text: chain.map((c) => c.name.en).join(" › ") || p.category_slug, listed: !!chain[0] && shown.has(chain[0].slug) };
  };
  const base = `/admin/products?${new URLSearchParams({ q: sp.q ?? "", status, category: top?.slug ?? "", sort }).toString()}`;

  return (
    <div>
      <PageTitle title="Products" description="Add, edit, hide or remove the products in your shop. Hidden products stay saved but customers cannot see them." action={{ href: "/admin/products/new", label: "Add product" }} />
      <Notice error={sp.error} saved={sp.saved} />
      <form className={`${card} mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]`}>
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search name, SKU or ID" className="input" aria-label="Search products" />
        <select name="category" defaultValue={top?.slug ?? ""} className="input" aria-label="Category">
          <option value="">All categories</option>
          {tree.map((c: CategoryNode) => <option key={c.slug} value={c.slug}>{c.name.en}{c.active ? "" : " (hidden)"}</option>)}
        </select>
        <select name="status" defaultValue={status} className="input" aria-label="Status">
          <option value="">All products</option>
          <option value="active">Visible in shop</option>
          <option value="hidden">Hidden</option>
        </select>
        <select name="sort" defaultValue={sort} className="input" aria-label="Sort">
          <option value="new">Newest first</option>
          <option value="name">Name A-Z</option>
        </select>
        <button className="btn-primary">Filter</button>
      </form>
      <div className={`${card} overflow-x-auto !p-0`}>
        <table className="w-full">
          <thead className="border-b border-slate-200"><tr><th className={th}>Product</th><th className={th}>Category</th><th className={th}>Prices</th><th className={th}>Status</th><th className={th}></th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5}>
                  {sp.q || status || top ? (
                    <EmptyState title="No products match these filters" text="Try a different search or clear the filters." action={{ href: "/admin/products", label: "Clear filters" }} />
                  ) : (
                    <EmptyState title="No products yet" text="Add your first product to start selling." action={{ href: "/admin/products/new", label: "Add product" }} />
                  )}
                </td>
              </tr>
            )}
            {rows.map((p) => {
              const cat = labelOf(p);
              return (
                <tr key={p.id}>
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                        {p.images?.[0] && <Image src={p.images[0]} alt="" fill sizes="48px" className="object-contain" />}
                      </span>
                      <span>
                        <Link href={`/admin/products/${p.id}`} className="font-semibold hover:text-brand">{p.name_en}</Link>
                        <span className="block text-xs text-slate-500">{p.sku} · {p.condition === "pre_owned" ? "Pre-owned" : "New"}{p.is_demo && " · demo"}</span>
                      </span>
                    </div>
                  </td>
                  <td className={td}>
                    <span className="text-xs">{cat.text}</span>
                    {!cat.listed && <span className="mt-0.5 block text-xs font-semibold text-amber-800">Not listed under a visible category</span>}
                  </td>
                  <td className={td}>
                    {(p.product_prices ?? []).map((r: any) => (
                      <span key={r.country_code} className="block text-xs">{String(r.country_code).toUpperCase()}: {Number(r.price)} · stock {r.stock}{r.available ? "" : " (unavailable)"}</span>
                    ))}
                    {!(p.product_prices ?? []).length && <span className="text-xs text-slate-500">Not sold anywhere</span>}
                  </td>
                  <td className={td}>
                    <VisibilityBadge on={p.active} />
                  </td>
                  <td className={td}>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/products/${p.id}`} className="btn-outline !min-h-9 !px-3">Edit</Link>
                      {p.active && <a href={`/product/${p.id}`} target="_blank" rel="noopener noreferrer" className="btn-outline !min-h-9 !px-3" aria-label={`View ${p.name_en} in the shop`}>View</a>}
                      <form action={setProductVisibility}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="active" value={p.active ? "0" : "1"} />
                        <SubmitButton className="btn-outline !min-h-9 !px-3" pendingText="…" aria-label={`${p.active ? "Hide" : "Show"} ${p.name_en}`}>{p.active ? "Hide" : "Show"}</SubmitButton>
                      </form>
                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmSubmit
                          message={`Permanently delete “${p.name_en}” (${p.sku}) and its prices?\n\nThis cannot be undone (past orders keep their item details).\nTo take it out of the shop without deleting it, press Cancel and use “Hide” instead.`}
                          className="btn-outline !min-h-9 !px-3 !text-red-600"
                          aria-label={`Delete ${p.name_en}`}
                        >
                          Delete
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pager base={base} page={page} total={total} size={PAGE_SIZE} />
      <p className="mt-2 text-xs text-slate-500">Deleting a product also removes its prices; past orders keep their item snapshot. Use “Hide” to take a product out of the shop without deleting it.</p>
    </div>
  );
}
