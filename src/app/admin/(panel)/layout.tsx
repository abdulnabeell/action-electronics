import { requirePage } from "@/lib/admin/auth";
import AdminShell, { type NavGroup } from "../AdminShell";

// Navigation, grouped. Staff accounts only see Orders (matches the server-side role checks on every page and action).
const groups: (NavGroup & { admin: boolean })[] = [
  { label: "Overview", admin: true, items: [{ href: "/admin", label: "Dashboard", icon: "dashboard", exact: true }] },
  {
    label: "Catalogue",
    admin: true,
    items: [
      { href: "/admin/products", label: "Products", icon: "products" },
      { href: "/admin/categories", label: "Categories", icon: "categories" },
      { href: "/admin/brands", label: "Brands", icon: "brands" },
      { href: "/admin/inventory", label: "Inventory", icon: "inventory" },
    ],
  },
  { label: "Sales", admin: false, items: [{ href: "/admin/orders", label: "Orders", icon: "orders" }] },
  { label: "Marketing", admin: true, items: [{ href: "/admin/promotions", label: "Promotions", icon: "promotions" }] },
  { label: "Settings", admin: true, items: [{ href: "/admin/settings", label: "Countries & contact", icon: "settings" }] },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requirePage("staff"); // every panel page also re-checks its own role
  const visible = groups.filter((g) => !g.admin || admin.role === "admin").map(({ label, items }) => ({ label, items }));
  return (
    <AdminShell groups={visible} email={admin.email} role={admin.role}>
      {children}
    </AdminShell>
  );
}
