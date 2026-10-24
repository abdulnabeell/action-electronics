import type { CategoryRecord } from "../types/catalog.ts";

/** Category slugs from the top-level category down to `slug` (inclusive). Stops on a missing parent or a cycle. */
export function ancestry(categories: CategoryRecord[], slug: string | null | undefined): CategoryRecord[] {
  const chain: CategoryRecord[] = [];
  let cur = slug ? categories.find((c) => c.slug === slug) : undefined;
  while (cur && !chain.includes(cur)) {
    chain.unshift(cur);
    cur = cur.parent ? categories.find((c) => c.slug === cur!.parent) : undefined;
  }
  return chain;
}

/**
 * The browsable path of a product: top-level category -> ... -> deepest category, using only active categories.
 * The subcategory's own ancestry wins over the stored `category`, so a product keeps showing in the right place
 * even when its sub-category was re-parented by a category restructure.
 */
export function productPath(categories: CategoryRecord[], category: string, subcategory: string | null): CategoryRecord[] {
  const chain = subcategory ? ancestry(categories, subcategory) : [];
  const full = chain.length ? chain : ancestry(categories, category);
  const path: CategoryRecord[] = [];
  for (const c of full) {
    if (!c.active) break;
    path.push(c);
  }
  return path;
}

export type CategoryNode = { slug: string; name: CategoryRecord["name"]; sort: number; active: boolean; image: string | null; children: CategoryNode[] };

/** Nested tree (siblings ordered by `sort`). Inactive categories are dropped together with their descendants unless `includeInactive`. */
export function buildTree(categories: CategoryRecord[], includeInactive = false): CategoryNode[] {
  const walk = (parent: string | null, seen: Set<string>): CategoryNode[] =>
    categories
      .filter((c) => c.parent === parent && !seen.has(c.slug) && (includeInactive || c.active))
      .sort((a, b) => a.sort - b.sort)
      .map((c) => ({ slug: c.slug, name: c.name, sort: c.sort, active: c.active, image: c.image ?? null, children: walk(c.slug, new Set(seen).add(c.slug)) }));
  return walk(null, new Set());
}

/** Is `slug` the same as, or a descendant of, `ancestor`? */
export function isWithin(categories: CategoryRecord[], slug: string, ancestor: string) {
  return ancestry(categories, slug).some((c) => c.slug === ancestor);
}

/** 0 for a main category, 1 for a subcategory, 2 for a type (third level). */
export function categoryDepth(categories: CategoryRecord[], slug: string) {
  return Math.max(0, ancestry(categories, slug).length - 1);
}

/** How many levels sit below `slug` (0 = no subcategories). Cycle-safe. */
export function levelsBelow(categories: CategoryRecord[], slug: string, seen: string[] = []): number {
  const kids = categories.filter((c) => c.parent === slug && !seen.includes(c.slug));
  return kids.length ? 1 + Math.max(...kids.map((k) => levelsBelow(categories, k.slug, [...seen, slug]))) : 0;
}

/**
 * Categories that `slug` may be moved under (or, for a new category, pass slug = null): never itself or one of its own
 * descendants, and never so deep that the whole branch would exceed three levels.
 */
export function validParents(categories: CategoryRecord[], slug: string | null): CategoryRecord[] {
  const own = slug ? levelsBelow(categories, slug) : 0;
  return categories.filter((c) => c.slug !== slug && !(slug && isWithin(categories, c.slug, slug)) && categoryDepth(categories, c.slug) + 1 + own <= 2);
}

/** Slugs of every category that the storefront can show: active, with every ancestor active too. */
export function visibleSlugs(categories: CategoryRecord[]): Set<string> {
  const out = new Set<string>();
  const walk = (nodes: CategoryNode[]) => nodes.forEach((n) => (out.add(n.slug), walk(n.children)));
  walk(buildTree(categories));
  return out;
}
