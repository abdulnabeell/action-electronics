import assert from "node:assert/strict";
import { test } from "node:test";
import { categoryCardImage } from "../src/lib/category-image.ts";
import { buildTree } from "../src/lib/categories.ts";
import { imageAllowed } from "../src/lib/admin/product-form.ts";

const prods = [
  { condition: "pre_owned", images: ["/products/a.jpg"] },
  { condition: "new", images: [] },
  { condition: "new", images: ["/products/b.jpg"] },
];

test("category card prefers the uploaded image, then a new product's photo, then nothing (icon)", () => {
  assert.equal(categoryCardImage({ imageUrl: "/products/cat.jpg" }, prods), "/products/cat.jpg");
  assert.equal(categoryCardImage({ imageUrl: null }, prods), "/products/b.jpg");
  assert.equal(categoryCardImage({ imageUrl: null }, [prods[0]]), "/products/a.jpg");
  assert.equal(categoryCardImage({ imageUrl: null }, [prods[1]]), null);
  assert.equal(categoryCardImage({ imageUrl: null }, []), null);
});

test("category images are carried through the category tree", () => {
  const cats = [
    { slug: "a", name: { en: "A", ar: "" }, parent: null, sort: 0, active: true, image: "/products/x.jpg" },
    { slug: "b", name: { en: "B", ar: "" }, parent: "a", sort: 0, active: true },
  ];
  const tree = buildTree(cats);
  assert.equal(tree[0].image, "/products/x.jpg");
  assert.equal(tree[0].children[0].image, null);
});

test("category image URLs must be local or from this project's storage", () => {
  const base = "https://proj.supabase.co";
  assert.ok(imageAllowed(`${base}/storage/v1/object/public/product-images/categories/2026/a.png`, base));
  assert.ok(!imageAllowed("https://evil.example/x.png", base));
  assert.ok(!imageAllowed("javascript:alert(1)", base));
});
