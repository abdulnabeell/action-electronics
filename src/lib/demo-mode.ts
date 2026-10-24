// Demo/sample data is OFF unless ALLOW_DEMO_DATA=true is set explicitly (local development, tests).
// It is never enabled implicitly: a missing database configuration is an error, not a reason to show fake products.
export const demoDataEnabled = () => process.env.ALLOW_DEMO_DATA === "true";

/** Promotions seeded by supabase/seed.sql have ids starting with "demo-". */
export const isDemoPromotionId = (id: string) => id.startsWith("demo-");

/**
 * Real storefront data only: drops products and brands flagged is_demo and the seeded demo promotions.
 * Nothing is deleted from the database - the owner removes these rows in Admin when ready.
 */
export function withoutDemo<P extends { isDemo: boolean }, B extends { isDemo: boolean }, R extends { id: string }>(data: { products: P[]; brands: B[]; promotions: R[] }) {
  return {
    products: data.products.filter((p) => !p.isDemo),
    brands: data.brands.filter((b) => !b.isDemo),
    promotions: data.promotions.filter((p) => !isDemoPromotionId(p.id)),
  };
}

export class CatalogUnavailableError extends Error {
  constructor(reason: string) {
    super(`Catalogue unavailable: ${reason}`);
    this.name = "CatalogUnavailableError";
  }
}
