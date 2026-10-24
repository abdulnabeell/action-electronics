import { deleteCategory, saveCategory } from "@/lib/admin/actions";
import { requirePage } from "@/lib/admin/auth";
import { categoryVisibilityReady, getCategoryProductCounts, listCategories } from "@/lib/admin/queries";
import { ancestry, buildTree, categoryDepth, validParents, visibleSlugs, type CategoryNode } from "@/lib/categories";
import type { CategoryRecord } from "@/types/catalog";
import ConfirmSubmit from "../../ConfirmSubmit";
import CategoryImageField from "./CategoryImageField";
import SubmitButton from "../../SubmitButton";
import { Field, Notice, PageTitle, VisibilityBadge, card } from "../../ui";

export const dynamic = "force-dynamic";

const LEVEL = ["Main category", "Subcategory", "Type"];

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  await requirePage("admin");
  const sp = await searchParams;
  const [cats, ready] = await Promise.all([listCategories(), categoryVisibilityReady()]);
  const counts = await getCategoryProductCounts(cats);

  // Same rule as the storefront (src/lib/categories.ts): a category is shown only if it and all its parents are visible.
  const shown = visibleSlugs(cats);
  const visibleRows = (nodes: CategoryNode[], depth = 0): { cat: CategoryRecord; depth: number }[] =>
    nodes.flatMap((n) => [{ cat: cats.find((c) => c.slug === n.slug)!, depth }, ...visibleRows(n.children, depth + 1)]);
  const visible = visibleRows(buildTree(cats));
  const path = (slug: string) => ancestry(cats, slug).map((c) => c.name.en).join(" › ");
  const hidden = cats.filter((c) => !shown.has(c.slug)).sort((a, b) => path(a.slug).localeCompare(path(b.slug)));
  const parentOptions = (slug: string | null) => validParents(cats, slug).map((c) => ({ slug: c.slug, label: path(c.slug), visible: shown.has(c.slug) }));

  const Row = ({ cat, depth, isVisible }: { cat: CategoryRecord; depth: number; isVisible: boolean }) => {
    const n = counts[cat.slug] ?? 0;
    const parents = parentOptions(cat.slug);
    const why = cat.active ? "Hidden because a parent category is hidden." : "Turned off.";
    return (
      <div className={`mb-2 rounded-xl border border-s-4 p-3 ${isVisible ? "border-slate-200 border-s-green-500 bg-white" : "border-amber-200 border-s-amber-500 bg-amber-50"}`} style={{ marginInlineStart: isVisible ? depth * 20 : 0 }}>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <VisibilityBadge on={isVisible} onLabel="Visible in shop" offLabel="Hidden from shop" />
          <span className="font-semibold text-slate-600">{LEVEL[categoryDepth(cats, cat.slug)] ?? "Category"}</span>
          <span className="text-slate-500">· {n} product{n === 1 ? "" : "s"}</span>
          {!cat.name.ar && isVisible && <span className="rounded-md bg-blue-100 px-2 py-0.5 font-bold text-blue-800">Arabic name needed</span>}
          {!isVisible && <span className="text-amber-900">{why}</span>}
          <code className="ms-auto text-slate-500">{cat.slug}</code>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <form action={saveCategory} className="flex flex-1 flex-wrap items-end gap-2">
            <input type="hidden" name="mode" value="update" />
            <input type="hidden" name="slug" value={cat.slug} />
            <Field label="Name (English)" className="min-w-40 flex-1"><input name="name_en" defaultValue={cat.name.en} required className="input" /></Field>
            <Field label="Name (Arabic)" className="min-w-40 flex-1"><input name="name_ar" dir="rtl" defaultValue={cat.name.ar} placeholder="Needs translation" className="input" /></Field>
            <Field label="Inside" className="min-w-44">
              <select name="parent_slug" defaultValue={cat.parent ?? ""} className="input">
                <option value="">— Main category —</option>
                {parents.map((p) => <option key={p.slug} value={p.slug}>{p.label}{p.visible ? "" : " (hidden)"}</option>)}
              </select>
            </Field>
            <Field label="Order" hint="Lower first"><input name="sort" type="number" defaultValue={cat.sort} className="input !w-20" /></Field>
            <div className="basis-full"><CategoryImageField initial={cat.image ?? null} /></div>
            <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
              <input type="hidden" name="active" value="0" />
              <input type="checkbox" name="active" value="1" defaultChecked={cat.active} className="size-4" /> Visible
            </label>
            <SubmitButton className="btn-outline" pendingText="Saving…">Save</SubmitButton>
          </form>
          <form action={deleteCategory}>
            <input type="hidden" name="slug" value={cat.slug} />
            <ConfirmSubmit
              message={`Delete the category “${cat.name.en}”?\n\nIt can only be deleted when no products and no subcategories use it, and no promotion targets it.\nTo take it out of the shop but keep it, press Cancel and untick “Visible” instead.`}
              className="btn-outline !text-red-600"
              aria-label={`Delete ${cat.name.en}`}
            >
              Delete
            </ConfirmSubmit>
          </form>
        </div>
        {cat.active && n > 0 && <p className="mt-1 text-xs text-slate-500">Unticking “Visible” also hides its {n} product{n === 1 ? "" : "s"} from category pages (they stay in the shop search and keep their web address).</p>}
      </div>
    );
  };

  const addParents = parentOptions(null).filter((p) => p.visible);

  return (
    <div className="space-y-6">
      <PageTitle title="Categories" description="Organise your shop into main categories, subcategories and types. Customers browse in this order." action={{ href: "#add-category", label: "Add category" }} />
      <Notice error={sp.error} saved={sp.saved} />
      {!ready && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
          The category database update has not been applied yet, so saving or hiding categories will fail until it is. Run
          <code className="mx-1">supabase/migrations/20261022000200_category_hierarchy.sql</code> once in the Supabase SQL Editor, then reload this page.
        </p>
      )}
      <p className="text-sm text-slate-600">
        <strong>{visible.length}</strong> categories are shown on the website{hidden.length ? <> and <strong>{hidden.length}</strong> are hidden (kept in the database, listed at the bottom)</> : null}. Customers see main categories in the menu, then subcategories as filters.
      </p>

      <form id="add-category" action={saveCategory} className={`${card} grid scroll-mt-20 gap-3 sm:grid-cols-5`}>
        <input type="hidden" name="mode" value="create" />
        <h2 className="font-bold sm:col-span-5">Add a category or subcategory</h2>
        <Field label="Slug" hint="Web address part. Letters, numbers, dashes. Can't be changed later."><input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="input" placeholder="e.g. smart-rings" /></Field>
        <Field label="Name (English)"><input name="name_en" required className="input" /></Field>
        <Field label="Name (Arabic)" hint="Optional - shows English until added."><input name="name_ar" dir="rtl" className="input" /></Field>
        <Field label="Inside" hint="Up to three levels, e.g. Mobile & Tablets › Mobile Phones › iPhones.">
          <select name="parent_slug" className="input" defaultValue="">
            <option value="">— Main category —</option>
            {addParents.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Order" hint="Lower numbers come first."><input name="sort" type="number" defaultValue={cats.length} className="input" /></Field>
        <div className="sm:col-span-5"><CategoryImageField initial={null} /></div>
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold sm:col-span-5">
          <input type="hidden" name="active" value="0" />
          <input type="checkbox" name="active" value="1" defaultChecked className="size-4" /> Visible in the shop
        </label>
        <div className="sm:col-span-5"><SubmitButton pendingText="Adding…">Add category</SubmitButton></div>
      </form>

      <section aria-label="Categories shown on the website">
        <h2 className="mb-2 font-bold">Shown on the website</h2>
        {visible.map(({ cat, depth }) => <Row key={cat.slug} cat={cat} depth={depth} isVisible />)}
        {visible.length === 0 && <p className="text-sm text-slate-500">No visible categories yet.</p>}
      </section>

      {hidden.length > 0 && (
        <details className={card}>
          <summary className="cursor-pointer font-bold">Hidden categories ({hidden.length})</summary>
          <p className="my-2 text-sm text-slate-600">These are not shown on the website. Nothing is deleted: products that use them stay in the shop. Tick “Visible” and save to bring one back.</p>
          {hidden.map((cat) => <Row key={cat.slug} cat={cat} depth={0} isVisible={false} />)}
        </details>
      )}
    </div>
  );
}
