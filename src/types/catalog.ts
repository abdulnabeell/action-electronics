import type { CountryCode, Lang } from "../i18n/config.ts";

export type Condition = "new" | "pre_owned";
export type L10n = { en: string; ar: string };

/** Regional price, stock and availability for one product in one country. */
export type PriceRow = {
  price: number;
  compareAt: number | null;
  stock: number;
  available: boolean;
};

export type ProductRecord = {
  id: string;
  slug: string;
  sku: string;
  name: L10n;
  brand: string; // brand slug
  category: string; // top-level category slug
  subcategory: string | null; // deepest category slug (a descendant of `category`, any depth)
  condition: Condition;
  grade: string | null; // pre-owned grade, e.g. "A"
  description: L10n;
  specs: { en: string[]; ar: string[] };
  images: string[];
  warranty: L10n;
  featured: boolean;
  active: boolean;
  isDemo: boolean;
  createdAt: string;
  prices: Partial<Record<CountryCode, PriceRow>>;
};

/** `parent` nests categories to any depth (the storefront uses three levels). `active: false` hides a retired category from the storefront without deleting it. */
export type CategoryRecord = { slug: string; name: L10n; parent: string | null; sort: number; active: boolean; image?: string | null };
export type BrandRecord = { slug: string; name: string; isDemo: boolean };

export type PromotionRecord = {
  id: string;
  title: L10n;
  subtitle: L10n;
  imageUrl: string | null;
  linkPath: string | null; // path inside the locale, e.g. "/shop?condition=pre_owned"
  discountPercent: number; // 0 = banner only
  scope: "all" | "category" | "brand" | "product";
  scopeValue: string | null;
  country: CountryCode | null; // null = every country
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  sort: number;
};

export type CountryRecord = {
  code: CountryCode;
  name: L10n;
  currency: string; // ISO code, e.g. AED, OMR
  currencyDecimals: number;
  whatsappNumber: string; // international format, digits only; empty = not configured
  phone: string;
  phoneDisplay: string;
  email: string;
  address: L10n;
  mapsLink: string;
  mapsEmbed: string;
  deliveryInfo: L10n;
  deliveryFee: number;
  freeDeliveryOver: number | null;
  regions: L10n[];
  hours: { days: L10n; time: L10n }[];
  openDays: number[]; // 0 = Sunday
  openHour: number;
  closeHour: number;
  timeZone: string;
  enabled: boolean;
};

export type Availability = "in_stock" | "low_stock" | "out_of_stock" | "unavailable";

/** A product resolved for one country + language — this is what the UI renders. */
export type ProductView = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: { slug: string; name: string };
  category: { slug: string; name: string };
  subcategory: { slug: string; name: string } | null; // deepest active category below `category`
  /** Active category chain, top-level first (category, ..., subcategory), for breadcrumbs and filtering. */
  categoryPath: { slug: string; name: string }[];
  condition: Condition;
  grade: string | null;
  description: string;
  specs: string[];
  images: string[];
  warranty: string;
  featured: boolean;
  isDemo: boolean;
  price: number;
  compareAt: number | null;
  discountPct: number | null;
  stock: number;
  availability: Availability;
  createdAt: string;
};

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "completed" | "cancelled";
export const orderStatuses: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "completed", "cancelled"];

export type { CountryCode, Lang };
