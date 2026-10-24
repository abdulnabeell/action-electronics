import { deletePromotion, savePromotion } from "@/lib/admin/actions";
import { requirePage } from "@/lib/admin/auth";
import { listBrands, listCategories, listPromotions } from "@/lib/admin/queries";
import type { PromotionRecord } from "@/types/catalog";
import ConfirmSubmit from "../../ConfirmSubmit";
import SubmitButton from "../../SubmitButton";
import { Field, Notice, PageTitle, VisibilityBadge, card } from "../../ui";

export const dynamic = "force-dynamic";

const localInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

function PromoForm({ p }: { p?: PromotionRecord }) {
  return (
    <form action={savePromotion} className={`${card} grid gap-3 sm:grid-cols-2 lg:grid-cols-4`}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <h2 className="flex flex-wrap items-center gap-2 text-base font-bold sm:col-span-2 lg:col-span-4">
        {p ? p.title.en : "Add a promotion"}
        {p && <VisibilityBadge on={p.active} onLabel="Active" offLabel="Paused" />}
      </h2>
      <Field label="Title (English)"><input name="title_en" required defaultValue={p?.title.en} className="input" /></Field>
      <Field label="Title (Arabic)"><input name="title_ar" dir="rtl" defaultValue={p?.title.ar} className="input" /></Field>
      <Field label="Subtitle (English)"><input name="subtitle_en" defaultValue={p?.subtitle.en} className="input" /></Field>
      <Field label="Subtitle (Arabic)"><input name="subtitle_ar" dir="rtl" defaultValue={p?.subtitle.ar} className="input" /></Field>
      <Field label="Discount %" hint="0 = banner only. Best discount wins; they never stack."><input name="discount_percent" type="number" min="0" max="90" step="0.5" defaultValue={p?.discountPercent ?? 0} className="input" /></Field>
      <Field label="Applies to">
        <select name="scope" defaultValue={p?.scope ?? "all"} className="input">
          <option value="all">Everything</option>
          <option value="category">Category (slug)</option>
          <option value="brand">Brand (slug)</option>
          <option value="product">Product (ID)</option>
        </select>
      </Field>
      <Field label="Category / brand slug or product ID" hint="Start typing for suggestions. Checked when you save - a wrong name is rejected."><input name="scope_value" list="promo-targets" defaultValue={p?.scopeValue ?? ""} className="input" placeholder="e.g. games" autoComplete="off" /></Field>
      <Field label="Country">
        <select name="country_code" defaultValue={p?.country ?? ""} className="input">
          <option value="">All countries</option>
          <option value="uae">UAE</option>
          <option value="oman">Oman</option>
        </select>
      </Field>
      <Field label="Banner link (path)"><input name="link_path" defaultValue={p?.linkPath ?? ""} className="input" placeholder="/pre-owned" /></Field>
      <Field label="Banner image (optional)"><input name="image_url" defaultValue={p?.imageUrl ?? ""} className="input" placeholder="storage URL or /products/…" /></Field>
      <Field label="Starts (UTC)"><input name="starts_at" type="datetime-local" defaultValue={localInput(p?.startsAt ?? null)} className="input" /></Field>
      <Field label="Ends (UTC)"><input name="ends_at" type="datetime-local" defaultValue={localInput(p?.endsAt ?? null)} className="input" /></Field>
      <Field label="Sort"><input name="sort" type="number" defaultValue={p?.sort ?? 0} className="input" /></Field>
      <label className="flex min-h-11 items-center gap-2 self-end text-sm font-semibold"><input type="checkbox" name="active" defaultChecked={p?.active ?? true} className="size-4" /> Active</label>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
        <SubmitButton>{p ? "Save" : "Add promotion"}</SubmitButton>
      </div>
    </form>
  );
}

export default async function PromotionsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  await requirePage("admin");
  const sp = await searchParams;
  const [promos, cats, brands] = await Promise.all([listPromotions(), listCategories(), listBrands()]);
  return (
    <div className="space-y-6">
      <PageTitle title="Promotions & discounts" description="Percentage discounts and homepage banners. The best discount applies; discounts never stack." />
      <Notice error={sp.error} saved={sp.saved} />
      <datalist id="promo-targets">
        {cats.filter((c) => c.active).map((c) => <option key={`c-${c.slug}`} value={c.slug}>Category: {c.name.en}</option>)}
        {brands.map((b) => <option key={`b-${b.slug}`} value={b.slug}>Brand: {b.name}</option>)}
      </datalist>
      <PromoForm />
      {promos.map((p) => (
        <div key={p.id} className="space-y-1">
          <PromoForm p={p} />
          <form action={deletePromotion}>
            <input type="hidden" name="id" value={p.id} />
            <ConfirmSubmit
              message={`Delete the promotion “${p.title.en}”?

The discount and banner stop immediately and this cannot be undone.
To pause it instead, press Cancel and untick “Active”.`}
              className="text-sm font-semibold text-red-600"
            >
              Delete “{p.title.en}”
            </ConfirmSubmit>
          </form>
        </div>
      ))}
    </div>
  );
}
