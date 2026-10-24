import Link from "next/link";
import { requirePage } from "@/lib/admin/auth";
import { listBrands, listCategories, listCountries } from "@/lib/admin/queries";
import { Notice, PageTitle } from "../../../ui";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProduct({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requirePage("admin");
  const sp = await searchParams;
  const [brands, categories, countries] = await Promise.all([listBrands(), listCategories(), listCountries()]);
  return (
    <div>
      <PageTitle title="Add product" description="Fill in the details, add photos and set the price for each country. Nothing is shown to customers until you save.">
        <Link href="/admin/products" className="btn-outline">Back to products</Link>
      </PageTitle>
      <Notice error={sp.error} />
      <ProductForm brands={brands} categories={categories} countries={countries} />
    </div>
  );
}
