import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLocale, isLocale, localePath, negotiateLocale, parseLocale, swapLocale, locales } from "../src/i18n/config.ts";
import { en } from "../src/i18n/dictionaries/en.ts";
import { ar } from "../src/i18n/dictionaries/ar.ts";
import { availabilityOf, formatMoney, promoPercentFor, resolvePrice, roundMoney } from "../src/lib/pricing.ts";
import { buildWhatsAppMessage, computeTotals, generateOrderCode, whatsappLink } from "../src/lib/order-core.ts";
import { parseOrderPayload, validateCustomer } from "../src/lib/validators.ts";
import { collectValues, duplicateField, parseProductForm } from "../src/lib/admin/product-form.ts";
import { readFileSync } from "node:fs";
import { ancestry, buildTree, categoryDepth, isWithin, levelsBelow, productPath, validParents, visibleSlugs } from "../src/lib/categories.ts";
import { seedProducts, seedCategories, seedPromotions } from "../src/data/seed.ts";
import type { PromotionRecord } from "../src/types/catalog.ts";

const keys = (o: object, p = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === "object" && v ? keys(v, p + k + ".") : [p + k]));

test("English and Arabic dictionaries have identical keys and no empty strings", () => {
  assert.deepEqual(keys(ar).sort(), keys(en).sort());
  for (const k of keys(ar)) {
    const v = k.split(".").reduce((o: any, x) => o[x], ar);
    assert.ok(typeof v === "string" && v.length > 0, k);
  }
});

test("locale helpers: parse, path, swap, negotiate", () => {
  assert.equal(locales.length, 4);
  assert.ok(isLocale("oman-ar") && !isLocale("om-ar") && !isLocale(undefined));
  assert.deepEqual(parseLocale("oman-ar"), { country: "oman", lang: "ar" });
  assert.equal(localePath("uae-en", "/shop"), "/uae-en/shop");
  assert.equal(localePath("uae-en"), "/uae-en");
  assert.equal(swapLocale("/uae-en/product/x", "oman-ar"), "/oman-ar/product/x");
  assert.equal(negotiateLocale("oman-en", "ar"), "oman-en"); // saved choice wins
  assert.equal(negotiateLocale(undefined, "ar-AE,ar;q=0.9"), "uae-ar");
  assert.equal(negotiateLocale(undefined, "en-US"), defaultLocale);
});

test("pricing: rounding per currency, no conversion", () => {
  assert.equal(roundMoney(10.12345, 2), 10.12);
  assert.equal(roundMoney(10.12345, 3), 10.123);
  assert.equal(formatMoney(1234.5, "AED", 2, "en"), "AED 1,234.50");
  assert.equal(formatMoney(12.5, "OMR", 3, "en"), "OMR 12.500");
  assert.equal(formatMoney(12.5, "OMR", 3, "ar"), "12.500 ر.ع.");
});

test("pricing: compare-at discount and promotions (best wins, never stacks)", () => {
  assert.deepEqual(resolvePrice({ price: 80, compareAt: 100, stock: 1, available: true }, 0, 2), { price: 80, compareAt: 100, discountPct: 20 });
  assert.deepEqual(resolvePrice({ price: 80, compareAt: null, stock: 1, available: true }, 0, 2), { price: 80, compareAt: null, discountPct: null });
  assert.deepEqual(resolvePrice({ price: 100, compareAt: null, stock: 1, available: true }, 10, 2), { price: 90, compareAt: 100, discountPct: 10 });
  assert.deepEqual(resolvePrice({ price: 100, compareAt: 120, stock: 1, available: true }, 10, 2), { price: 90, compareAt: 120, discountPct: 25 });
  // compare-at below price is ignored
  assert.equal(resolvePrice({ price: 100, compareAt: 90, stock: 1, available: true }, 0, 2).compareAt, null);
  // OMR keeps 3 decimals
  assert.equal(resolvePrice({ price: 12.345, compareAt: null, stock: 1, available: true }, 10, 3).price, 11.111);

  const now = new Date("2026-10-22T00:00:00Z");
  const base: PromotionRecord = { id: "p", title: { en: "", ar: "" }, subtitle: { en: "", ar: "" }, imageUrl: null, linkPath: null, discountPercent: 10, scope: "category", scopeValue: "games", country: null, startsAt: null, endsAt: null, active: true, sort: 0 };
  const prod = { id: "x", category: "games", subcategory: "consoles", brand: "b" };
  assert.equal(promoPercentFor([base, { ...base, id: "q", discountPercent: 15, scope: "all" }], prod, "uae", now), 15);
  assert.equal(promoPercentFor([{ ...base, active: false }], prod, "uae", now), 0);
  assert.equal(promoPercentFor([{ ...base, country: "oman" }], prod, "uae", now), 0);
  assert.equal(promoPercentFor([{ ...base, endsAt: "2026-10-01T00:00:00Z" }], prod, "uae", now), 0);
  assert.equal(promoPercentFor([{ ...base, startsAt: "2026-11-01T00:00:00Z" }], prod, "uae", now), 0);
  assert.equal(promoPercentFor([{ ...base, scope: "brand", scopeValue: "other" }], prod, "uae", now), 0);
});

test("category promotions match descendants and keep legacy slugs working", () => {
  const now = new Date("2026-10-22T00:00:00Z");
  const promo = (scopeValue: string, discountPercent = 10): PromotionRecord => ({ id: scopeValue, title: { en: "", ar: "" }, subtitle: { en: "", ar: "" }, imageUrl: null, linkPath: null, discountPercent, scope: "category", scopeValue, country: null, startsAt: null, endsAt: null, active: true, sort: 0 });
  const iphone = { id: "i", category: "pre-owned", subcategory: "pre-owned-mobiles-iphones", brand: "b" }; // 3 levels deep
  const pct = (slug: string, prod = iphone) => promoPercentFor([promo(slug)], prod, "uae", now, seedCategories);
  assert.equal(pct("pre-owned"), 10, "top-level parent");
  assert.equal(pct("pre-owned-mobiles"), 10, "middle level");
  assert.equal(pct("pre-owned-mobiles-iphones"), 10, "leaf");
  assert.equal(pct("pre-owned-mobiles-android"), 0, "sibling leaf");
  assert.equal(pct("pre-owned-laptops"), 0, "sibling branch");
  assert.equal(pct("speakers"), 0, "unrelated category");
  // legacy: product row still stores the retired slug => still matches; ancestry also resolves via the current parent
  const legacy = { id: "l", category: "mobiles", subcategory: "mobile-phones", brand: "b" };
  assert.equal(pct("mobiles", legacy), 10, "retired slug still stored on the product");
  assert.equal(pct("mobile-tablets", legacy), 10, "re-parented subcategory reaches the new top-level");
  assert.equal(pct("photographic", legacy), 0);
  // without the category list the old direct matching is unchanged
  assert.equal(promoPercentFor([promo("pre-owned")], iphone, "uae", now), 10);
  assert.equal(promoPercentFor([promo("pre-owned-mobiles")], iphone, "uae", now), 0);
  // best discount wins, never stacked
  assert.equal(promoPercentFor([promo("pre-owned", 10), promo("pre-owned-mobiles-iphones", 25)], iphone, "uae", now, seedCategories), 25);
  // a null scope value never matches
  assert.equal(promoPercentFor([{ ...promo("x"), scopeValue: null }], iphone, "uae", now, seedCategories), 0);
});

test("availability", () => {
  assert.equal(availabilityOf(undefined), "out_of_stock");
  assert.equal(availabilityOf({ price: 1, compareAt: null, stock: 0, available: true }), "out_of_stock");
  assert.equal(availabilityOf({ price: 1, compareAt: null, stock: 5, available: false }), "out_of_stock");
  assert.equal(availabilityOf({ price: 1, compareAt: null, stock: 2, available: true }), "low_stock");
  assert.equal(availabilityOf({ price: 1, compareAt: null, stock: 9, available: true }), "in_stock");
});

test("cart totals use regional prices and delivery rules", () => {
  const lines = [{ qty: 2, unitPrice: 49.99 }, { qty: 1, unitPrice: 10.01 }];
  const o = { method: "delivery" as const, deliveryFee: 15, freeDeliveryOver: 100, decimals: 2 };
  assert.deepEqual(computeTotals(lines, o), { subtotal: 109.99, deliveryFee: 0, total: 109.99 });
  assert.deepEqual(computeTotals([{ qty: 1, unitPrice: 50 }], o), { subtotal: 50, deliveryFee: 15, total: 65 });
  assert.deepEqual(computeTotals([{ qty: 1, unitPrice: 50 }], { ...o, method: "pickup" }), { subtotal: 50, deliveryFee: 0, total: 50 });
  // OMR: 3 decimals
  assert.equal(computeTotals([{ qty: 3, unitPrice: 1.1 }], { method: "pickup", deliveryFee: 0, freeDeliveryOver: null, decimals: 3 }).total, 3.3);
});

test("order codes are country-prefixed, dated and use an unambiguous alphabet", () => {
  const rnd = (n: number) => Uint8Array.from({ length: n }, (_, i) => i * 7);
  const code = generateOrderCode("oman", new Date("2026-10-22T10:00:00Z"), rnd);
  assert.match(code, /^OM-261022-[A-HJ-NP-Z2-9]{6}$/);
  assert.match(generateOrderCode("uae", new Date("2026-01-05T00:00:00Z"), rnd), /^AE-260105-/);
});

test("WhatsApp message contains order id, items, totals and customer details", () => {
  const msg = buildWhatsAppMessage({
    code: "AE-261022-ABC234",
    lang: "en",
    storeName: "Action Electronics",
    currency: "AED",
    decimals: 2,
    lines: [{ id: "a", sku: "SKU1", name: "Camera", qty: 2, unitPrice: 100 }],
    totals: { subtotal: 200, deliveryFee: 0, total: 200 },
    customer: { name: "Sara", phone: "+971500000000", email: "", region: "Dubai", method: "delivery", address: "Deira", notes: "Call first" },
  });
  for (const s of ["AE-261022-ABC234", "Camera (SKU SKU1) - 2 x AED 100.00 = AED 200.00", "Total: AED 200.00", "Sara", "+971500000000", "Deira", "Call first", "Delivery: Free"]) assert.ok(msg.includes(s), s);
  assert.ok(buildWhatsAppMessage({ code: "X", lang: "en", storeName: "S", currency: "AED", decimals: 2, lines: [], totals: { subtotal: 0, deliveryFee: 0, total: 0 }, customer: { name: "a", phone: "1", email: "", region: "", method: "delivery", address: "x", notes: "" }, deliveryTbc: true }).includes("Delivery: To be confirmed on WhatsApp"));
  assert.ok(!buildWhatsAppMessage({ code: "X", lang: "en", storeName: "S", currency: "AED", decimals: 2, lines: [], totals: { subtotal: 0, deliveryFee: 0, total: 0 }, customer: { name: "a", phone: "1", email: "", region: "", method: "pickup", address: "", notes: "" } }).includes("Delivery:"));
  const url = whatsappLink("+971 55 254 2000", msg);
  assert.ok(url.startsWith("https://wa.me/971552542000?text="));
  assert.ok(decodeURIComponent(url).includes("AE-261022-ABC234"));
  const arMsg = buildWhatsAppMessage({ code: "X", lang: "ar", storeName: "أكشن", currency: "OMR", decimals: 3, lines: [], totals: { subtotal: 0, deliveryFee: 0, total: 0 }, customer: { name: "a", phone: "1", email: "", region: "", method: "pickup", address: "", notes: "" } });
  assert.ok(arMsg.includes("طلب جديد") && arMsg.includes("استلام من المتجر"));
});

test("customer and order payload validation", () => {
  const regions = ["Dubai", "Sharjah"];
  const good = validateCustomer({ name: " Sara ", phone: "+971 50 000 0000", method: "delivery", region: "Dubai", address: "Deira, Dubai" }, regions);
  assert.ok(good.ok && good.value.name === "Sara" && good.value.phone === "+971500000000");
  const bad = validateCustomer({ name: "x", phone: "12", method: "delivery", region: "Mars", address: "no", email: "bad" }, regions);
  assert.ok(!bad.ok && Object.keys(bad.errors).sort().join() === "address,email,name,phone,region");
  const pickup = validateCustomer({ name: "Sara", phone: "0500000000", method: "pickup" }, regions);
  assert.ok(pickup.ok);

  assert.ok(parseOrderPayload({ country: "uae", lang: "en", items: [{ id: "a", qty: 1 }, { id: "a", qty: 2 }], customer: {} }).ok);
  const merged = parseOrderPayload({ country: "uae", lang: "en", items: [{ id: "a", qty: 1 }, { id: "a", qty: 2 }], customer: {} });
  assert.ok(merged.ok && merged.value.items[0].qty === 3);
  for (const body of [{}, { country: "xx", lang: "en", items: [{ id: "a", qty: 1 }] }, { country: "uae", lang: "en", items: [] }, { country: "uae", lang: "en", items: [{ id: "a", qty: 0 }] }, { country: "uae", lang: "en", items: [{ id: "a", qty: 1.5 }] }, { country: "uae", lang: "en", items: [{ id: "a", qty: 999 }] }])
    assert.ok(!parseOrderPayload(body).ok, JSON.stringify(body));
});

test("category hierarchy matches the approved structure", () => {
  const names = (parent: string | null) => seedCategories.filter((c) => c.parent === parent && c.active).sort((a, b) => a.sort - b.sort).map((c) => c.name.en);
  const slugOf = (en: string, parent: string | null) => seedCategories.find((c) => c.parent === parent && c.active && c.name.en === en)!.slug;
  assert.deepEqual(names(null), ["Mobile & Tablets", "Pre-Owned", "Wearables & Smart Watches", "Earphones & Headphones", "Speakers", "Gaming"]);
  const sub = (top: string) => names(slugOf(top, null));
  assert.deepEqual(sub("Mobile & Tablets"), ["Mobile Phones", "Tablets"]);
  assert.deepEqual(names(slugOf("Mobile Phones", slugOf("Mobile & Tablets", null))), ["iPhones", "Android"]);
  assert.deepEqual(names(slugOf("Tablets", slugOf("Mobile & Tablets", null))), ["Android", "iOS"]);
  assert.deepEqual(sub("Pre-Owned"), ["Pre-Owned Mobiles", "Pre-Owned Laptops", "Pre-Owned Gaming"]);
  assert.deepEqual(names(slugOf("Pre-Owned Mobiles", slugOf("Pre-Owned", null))), ["Android", "iPhones"]);
  assert.deepEqual(sub("Wearables & Smart Watches"), ["Smart Watches", "Fitness Trackers", "Smart Glasses"]);
  assert.deepEqual(sub("Earphones & Headphones"), ["Earphones", "Headphones"]);
  assert.deepEqual(sub("Speakers"), ["Portable Speakers", "Wireless Speakers"]);
  assert.deepEqual(sub("Gaming"), ["PlayStation", "Gaming Accessories"]);
  assert.equal(seedCategories.length, new Set(seedCategories.map((c) => c.slug)).size, "unique slugs");
});

test("product paths follow the category ancestry and skip retired categories", () => {
  const cats = seedCategories;
  const path = (c: string, s: string | null) => productPath(cats, c, s).map((x) => x.slug);
  assert.deepEqual(path("pre-owned", "pre-owned-mobiles-iphones"), ["pre-owned", "pre-owned-mobiles", "pre-owned-mobiles-iphones"]);
  // a stale stored category (old "mobiles") is overridden by the subcategory's ancestry
  assert.deepEqual(path("mobiles", "mobile-phones"), ["mobile-tablets", "mobile-phones"]);
  // retired category: not browsable
  assert.deepEqual(path("photographic", "cameras"), []);
  // retired subcategory under an approved top: stops at the last active ancestor
  assert.deepEqual(path("games", "consoles"), ["games"]);
  assert.deepEqual(buildTree(cats).map((n) => n.slug), ["mobile-tablets", "pre-owned", "smart-watches", "earphones-headphones", "speakers", "games"]);
  assert.ok(isWithin(cats, "tablets-ios", "mobile-tablets") && !isWithin(cats, "tablets-ios", "speakers"));
  assert.equal(ancestry([{ slug: "a", name: { en: "", ar: "" }, parent: "b", sort: 0, active: true }, { slug: "b", name: { en: "", ar: "" }, parent: "a", sort: 0, active: true }], "a").length, 2, "cycles terminate");
});

test("demo seed is consistent: separate regional prices, valid references, products in active categories where mapped", () => {
  const slugs = new Set(seedCategories.map((c) => c.slug));
  const skus = new Set<string>();
  assert.ok(seedProducts.some((p) => p.condition === "pre_owned"));
  for (const p of seedProducts) {
    assert.ok(p.isDemo, p.id);
    assert.ok(!skus.has(p.sku), "duplicate sku " + p.sku);
    skus.add(p.sku);
    assert.ok(slugs.has(p.category) && (!p.subcategory || slugs.has(p.subcategory)), p.id);
    assert.ok(!p.subcategory || isWithin(seedCategories, p.subcategory, p.category), `${p.id}: subcategory outside its category`);
    assert.ok(p.prices.uae && p.prices.uae.price > 0, p.id);
    assert.ok(p.images.length > 0 && p.images.every((i) => i.endsWith(".jpg")), p.id);
    assert.ok(p.name.ar && p.description.ar, p.id);
  }
  assert.ok(seedProducts.some((p) => !p.prices.oman), "some products should be UAE-only");
  assert.ok(seedPromotions.length >= 2);
});

test("proxy matcher runs for locale and admin pages but not for assets or API routes", () => {
  const src = readFileSync(new URL("../src/proxy.ts", import.meta.url), "utf8");
  const literal = /matcher:\s*\[\s*("(?:[^"\\]|\\.)*")\s*\]/.exec(src)?.[1];
  assert.ok(literal, "matcher literal found");
  const pattern = new Function(`return ${literal}`)() as string; // what Next.js actually receives (escapes resolved)
  assert.ok(pattern.includes("\\."), "the dot must stay escaped after string parsing, otherwise every path is excluded");
  const re = new RegExp(`^${pattern}$`);
  for (const path of ["/", "/admin", "/admin/products", "/admin/login", "/uae-en", "/uae-ar/shop", "/shop", "/oman-en/category/mobile-tablets"]) assert.ok(re.test(path), `should run for ${path}`);
  for (const path of ["/sitemap.xml", "/robots.txt", "/icon.png", "/products/a.jpg", "/_next/static/chunk.js", "/api/orders", "/api/admin/upload"]) assert.ok(!re.test(path), `should skip ${path}`);
});

test("product form: field-specific errors, duplicates and a valid save", () => {
  const categories = [
    { slug: "mobile-tablets", parent: null },
    { slug: "mobile-phones", parent: "mobile-tablets" },
    { slug: "mobile-phones-iphones", parent: "mobile-phones" },
    { slug: "speakers", parent: null },
  ];
  const ctx = { create: true, brandSlugs: ["acme"], categories };
  const fdOf = (o: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(o)) f.set(k, v);
    return f;
  };
  const good = { id: "iphone-15", sku: "IP15", name_en: "iPhone 15", brand_slug: "acme", category_slug: "mobile-tablets", subcategory_slug: "mobile-phones-iphones", condition: "new", sell_uae: "on", price_uae: "3,499", stock_uae: "5", avail_uae: "on", images: "/products/a.jpg\n/products/b.jpg" };

  const ok = parseProductForm(fdOf(good), ctx);
  assert.deepEqual(ok.errors, {});
  assert.equal(ok.parsed!.row.subcategory_slug, "mobile-phones-iphones");
  assert.deepEqual(ok.parsed!.prices.map((p) => [p.country_code, p.price, p.stock]), [["uae", 3499, 5]]);
  assert.deepEqual(ok.parsed!.removeFrom, ["oman"]);
  assert.equal(ok.parsed!.row.images.length, 2);

  // everything wrong at once: each problem is reported against its own field
  const bad = parseProductForm(fdOf({ id: "Bad ID", sku: "", name_en: "", brand_slug: "ghost", category_slug: "mobile-phones", sell_uae: "on", price_uae: "", stock_uae: "1.5", sell_oman: "on", price_oman: "-1", stock_oman: "2", images: "https://evil.example/x.jpg" }), ctx);
  assert.deepEqual(Object.keys(bad.errors).sort(), ["brand_slug", "category_slug", "id", "images", "name_en", "price_oman", "price_uae", "sku", "stock_uae"]);
  assert.equal(bad.parsed, undefined);

  // subcategory under a different main category
  assert.ok(parseProductForm(fdOf({ ...good, category_slug: "speakers" }), ctx).errors.subcategory_slug);
  // editing: the id comes from the hidden field and must be present
  assert.deepEqual(parseProductForm(fdOf(good), { ...ctx, create: false }).errors, {});
  assert.ok(parseProductForm(fdOf({ ...good, id: "" }), { ...ctx, create: false }).errors.id);
  // a product that isn't sold anywhere is allowed
  assert.deepEqual(parseProductForm(fdOf({ ...good, sell_uae: "" }), ctx).parsed!.prices, []);

  // submitted text comes back verbatim so the form can be refilled
  assert.equal(collectValues(fdOf({ sku: "  IP15 ", images: "a\nb" })).sku, "  IP15 ");

  // duplicate violations map to the right field
  assert.equal(duplicateField({ code: "23505", message: 'duplicate key value violates unique constraint "products_sku_key"' }), "sku");
  assert.equal(duplicateField({ code: "23505", message: 'duplicate key value violates unique constraint "products_pkey"' }), "id");
  assert.equal(duplicateField({ code: "23503", message: "x" }), null);
  assert.equal(duplicateField({ code: "23505", message: 'violates unique constraint "something_else"' }), null);
});

test("category admin rules: valid parents, depth limit and storefront visibility", () => {
  const cats = seedCategories;
  const parents = (slug: string | null) => validParents(cats, slug).map((c) => c.slug);
  // a new category can go at the top or under a main category or a subcategory, but not under a third-level type
  assert.ok(parents(null).includes("speakers") && parents(null).includes("mobile-phones"));
  assert.ok(!parents(null).includes("mobile-phones-iphones"), "no fourth level");
  // a main category with subcategories (2 levels below) can't move under anything
  assert.deepEqual(parents("mobile-tablets"), []);
  // a subcategory with children (1 level below) can go under a main category only, never under itself or its own children
  const p = parents("mobile-phones");
  assert.ok(p.includes("speakers") && !p.includes("mobile-phones") && !p.includes("mobile-phones-iphones") && !p.includes("tablets"));
  // a type (leaf) can move under any main category or subcategory except its current branch rules
  assert.ok(parents("mobile-phones-iphones").includes("tablets"));
  assert.equal(levelsBelow(cats, "mobile-tablets"), 2);
  assert.equal(levelsBelow(cats, "mobile-phones-iphones"), 0);
  assert.equal(categoryDepth(cats, "tablets-ios"), 2);

  // visibility: same rule the storefront uses; a hidden parent hides its children
  const shown = visibleSlugs(cats);
  assert.ok(shown.has("mobile-tablets") && shown.has("playstation") && shown.has("gaming-accessories"));
  assert.ok(!shown.has("photographic") && !shown.has("cameras") && !shown.has("consoles"));
  const withHiddenParent = cats.map((c) => (c.slug === "speakers" ? { ...c, active: false } : c));
  const s2 = visibleSlugs(withHiddenParent);
  assert.ok(!s2.has("speakers") && !s2.has("portable-speakers"), "children of a hidden category are hidden too");
});

test("product prices respect currency decimals (AED 2, OMR 3)", () => {
  const categories = [{ slug: "speakers", parent: null }];
  const ctx = { create: true, brandSlugs: ["acme"], categories };
  const fdOf = (o: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(o)) f.set(k, v);
    return f;
  };
  const base = { id: "spk-1", sku: "SPK1", name_en: "Speaker", brand_slug: "acme", category_slug: "speakers", sell_uae: "on", sell_oman: "on", stock_uae: "1", stock_oman: "1" };
  assert.deepEqual(parseProductForm(fdOf({ ...base, price_uae: "99.99", price_oman: "12.345" }), ctx).errors, {});
  assert.ok(parseProductForm(fdOf({ ...base, price_uae: "99.999", price_oman: "12" }), ctx).errors.price_uae, "AED allows 2 decimals");
  assert.ok(parseProductForm(fdOf({ ...base, price_uae: "10", price_oman: "12.3456" }), ctx).errors.price_oman, "OMR allows 3 decimals");
  assert.ok(parseProductForm(fdOf({ ...base, price_uae: "10", compare_uae: "12.345", price_oman: "1" }), ctx).errors.compare_uae);
  // decimals can be overridden from the countries table
  assert.deepEqual(parseProductForm(fdOf({ ...base, price_uae: "99.999", price_oman: "1" }), { ...ctx, decimals: { uae: 3 } }).errors, {});
});
