// Small stroke icons for the admin panel (inline SVG, no extra dependency). `name` is a plain string so it can be
// passed from server components to the client shell.
const paths: Record<string, string> = {
  dashboard: "M4 4h6v7H4zM14 4h6v4h-6zM14 12h6v8h-6zM4 15h6v5H4z",
  products: "M12 3 4 7v10l8 4 8-4V7l-8-4zM4 7l8 4 8-4M12 11v10",
  categories: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z",
  brands: "M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01",
  inventory: "M3 7h18v4H3zM5 11v9h14v-9M10 15h4",
  orders: "M6 3h12l2 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7l2-4zM4 7h16M9 11a3 3 0 0 0 6 0",
  promotions: "M19 5 5 19M7.5 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM16.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  settings: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z",
  plus: "M12 5v14M5 12h14",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6 6 18",
  chevronLeft: "m15 6-6 6 6 6",
  chevronRight: "m9 6 6 6-6 6",
  chevronDown: "m6 9 6 6 6-6",
  external: "M14 4h6v6M20 4 10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  logout: "M10 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M15 8l4 4-4 4M19 12H9",
  alert: "M12 4 3 20h18L12 4zM12 10v4M12 17h.01",
  check: "m5 12 5 5 9-10",
  inbox: "M4 13l2-8h12l2 8M4 13v6h16v-6M4 13h5l1 2h4l1-2h5",
};

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-5" }: { name: IconName | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      <path d={paths[name] ?? paths.dashboard} />
    </svg>
  );
}
