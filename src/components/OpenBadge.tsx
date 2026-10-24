"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

function isOpenNow(info: { timeZone: string; openDays: number[]; openHour: number; closeHour: number }) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: info.timeZone, weekday: "short", hour: "numeric", hour12: false }).formatToParts(new Date());
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  return info.openDays.includes(day) && hour >= info.openHour && hour < info.closeHour;
}

// Rendered after mount so server HTML and the first client render match. Hidden when no hours are configured.
export default function OpenBadge() {
  const { info, dict } = useLocale();
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => setOpen(info.openDays.length ? isOpenNow(info) : null), [info]);
  if (open === null) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${open ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"}`}>
      <span className={`size-1.5 rounded-full ${open ? "bg-green-600" : "bg-slate-500"}`} />
      {open ? dict.open.open : dict.open.closed}
    </span>
  );
}
