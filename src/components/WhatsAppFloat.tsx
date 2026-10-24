"use client";

import { WhatsAppIcon } from "@/components/Icons";
import { useLocale } from "@/components/LocaleProvider";
import { whatsappLink } from "@/lib/order-core";

export default function WhatsAppFloat() {
  const { info, dict } = useLocale();
  if (!info.whatsappNumber) return null; // number not configured for this country yet
  return (
    <a
      href={whatsappLink(info.whatsappNumber, dict.contact.greeting)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={dict.contact.chat}
      className="fixed bottom-4 end-4 z-40 grid size-14 place-items-center rounded-full bg-wa text-white shadow-lg transition hover:bg-wa-dark active:scale-95"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
