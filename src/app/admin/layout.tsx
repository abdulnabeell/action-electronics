import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = { title: "Admin | Action Electronics", robots: { index: false, follow: false } };

// Root layout for the staff dashboard (separate from the storefront's per-locale root layout).
export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="admin-ui bg-slate-50 font-sans antialiased">{children}</body>
    </html>
  );
}
