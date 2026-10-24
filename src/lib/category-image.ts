// Which picture a category card shows. Pure so it can be unit-tested.
//   1. the image an admin uploaded for the category,
//   2. otherwise a photo of one of its products (new items first),
//   3. otherwise null - the caller draws the SVG icon, so there is never a broken or empty image.
export function categoryCardImage(
  cat: { imageUrl: string | null },
  products: { condition: string; images: string[] }[],
): string | null {
  if (cat.imageUrl) return cat.imageUrl;
  const withPhoto = products.filter((p) => p.images[0]);
  return (withPhoto.find((p) => p.condition === "new") ?? withPhoto[0])?.images[0] ?? null;
}
