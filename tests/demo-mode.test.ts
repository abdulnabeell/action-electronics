import assert from "node:assert/strict";
import { test } from "node:test";
import { demoDataEnabled, isDemoPromotionId, withoutDemo } from "../src/lib/demo-mode.ts";

test("demo data is off unless ALLOW_DEMO_DATA=true", () => {
  const prev = process.env.ALLOW_DEMO_DATA;
  delete process.env.ALLOW_DEMO_DATA;
  assert.equal(demoDataEnabled(), false);
  process.env.ALLOW_DEMO_DATA = "1";
  assert.equal(demoDataEnabled(), false);
  process.env.ALLOW_DEMO_DATA = "true";
  assert.equal(demoDataEnabled(), true);
  if (prev === undefined) delete process.env.ALLOW_DEMO_DATA;
  else process.env.ALLOW_DEMO_DATA = prev;
});

test("withoutDemo drops demo products, brands and seeded promotions but keeps real ones", () => {
  const out = withoutDemo({
    products: [{ id: "a", isDemo: true }, { id: "b", isDemo: false }],
    brands: [{ slug: "x", isDemo: true }, { slug: "y", isDemo: false }],
    promotions: [{ id: "demo-promo-games" }, { id: "6f1c-real" }],
  });
  assert.deepEqual(out.products.map((p) => p.id), ["b"]);
  assert.deepEqual(out.brands.map((b) => b.slug), ["y"]);
  assert.deepEqual(out.promotions.map((p) => p.id), ["6f1c-real"]);
  assert.ok(isDemoPromotionId("demo-promo-watches") && !isDemoPromotionId("summer-sale"));
});
