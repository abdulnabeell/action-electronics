import { deleteBrand, saveBrand } from "@/lib/admin/actions";
import { requirePage } from "@/lib/admin/auth";
import { listBrands } from "@/lib/admin/queries";
import ConfirmSubmit from "../../ConfirmSubmit";
import SubmitButton from "../../SubmitButton";
import { EmptyState, Field, Notice, PageTitle, card } from "../../ui";

export const dynamic = "force-dynamic";

export default async function BrandsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  await requirePage("admin");
  const sp = await searchParams;
  const brands = await listBrands();
  return (
    <div className="space-y-6">
      <PageTitle title="Brands" description="The makers of your products. A brand can only be deleted once no product uses it." />
      <Notice error={sp.error} saved={sp.saved} />
      <form action={saveBrand} className={`${card} flex flex-wrap items-end gap-3`}>
        <input type="hidden" name="mode" value="create" />
        <Field label="Slug"><input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="input" placeholder="e.g. acme" /></Field>
        <Field label="Name"><input name="name" required className="input" /></Field>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="is_demo" className="size-4" /> Demo brand</label>
        <SubmitButton pendingText="Adding…">Add brand</SubmitButton>
      </form>
      <section className={card}>
        {brands.map((b) => (
          <div key={b.slug} className="flex flex-wrap items-end gap-2 border-b border-slate-100 py-2 last:border-0">
            <form action={saveBrand} className="flex flex-1 flex-wrap items-end gap-2">
              <input type="hidden" name="mode" value="update" />
              <input type="hidden" name="slug" value={b.slug} />
              <Field label={`Brand · ${b.slug}`} className="min-w-48 flex-1"><input name="name" defaultValue={b.name} required className="input" /></Field>
              <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="is_demo" defaultChecked={b.isDemo} className="size-4" /> Demo</label>
              <SubmitButton className="btn-outline">Save</SubmitButton>
            </form>
            <form action={deleteBrand}>
              <input type="hidden" name="slug" value={b.slug} />
              <ConfirmSubmit
                message={`Delete the brand “${b.name}”?

It can only be deleted if no products use it. This cannot be undone.`}
                className="btn-outline !text-red-600"
                aria-label={`Delete ${b.name}`}
              >
                Delete
              </ConfirmSubmit>
            </form>
          </div>
        ))}
        {brands.length === 0 && <EmptyState title="No brands yet" text="Add a brand above, then choose it when you create products." />}
      </section>
    </div>
  );
}
