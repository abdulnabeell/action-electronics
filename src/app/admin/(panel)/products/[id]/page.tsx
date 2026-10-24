import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/admin/auth";
import { getProduct, listBrands, listCategories, listCountries } from "@/lib/admin/queries";
import { Notice, PageTitle } from "../../../ui";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  await requirePage("admin");
  const { id } = await params;
  const sp = await searchParams;
  const [product, brands, categories, countries] = await Promise.all([getProduct(id), listBrands(), listCategories(), listCountries()]);
  if (!product) notFound();
  return (
    <div>
      <PageTitle title={`Edit: ${product.name.en}`} description={`${product.sku} · ${product.active ? "Visible in the shop" : "Hidden from the shop"}`}>
        <Link href="/admin/products" className="btn-outline">Back to products</Link>
      </PageTitle>
      <Notice error={sp.error} saved={sp.saved} />
      <ProductForm product={product} brands={brands} categories={categories} countries={countries} />
    </div>
  );
}
