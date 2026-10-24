// Brand-level settings shared by every country. Country-specific details (currency, WhatsApp number,
// contact info, delivery) live in src/config/countries.ts and, once the database is live, in Admin → Settings.
export const site = {
  name: "Action Electronics",
  nameAr: "أكشن إلكترونيكس",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  themeColor: "#2563eb",
};
