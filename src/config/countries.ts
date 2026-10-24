import type { CountryCode } from "@/i18n/config";
import type { CountryRecord } from "@/types/catalog";

// Default per-country settings. They are used when Supabase isn't configured and as the seed for the
// `countries` table. Once the database is live, staff edit these in Admin → Settings (the DB wins).
//
// Nothing here is invented: UAE details come from the existing site. Oman contact details have not been
// supplied yet, so they are blank — set them in Admin → Settings (or here) before enabling Oman checkout.

export const defaultCountries: Record<CountryCode, CountryRecord> = {
  uae: {
    code: "uae",
    name: { en: "United Arab Emirates", ar: "الإمارات العربية المتحدة" },
    currency: "AED",
    currencyDecimals: 2,
    whatsappNumber: "971552542000",
    phone: "+97142388680",
    phoneDisplay: "+971 4 238 8680",
    email: "ActionElectronicsDXB@gmail.com",
    address: {
      en: "Community 116, Street 16, Ayal Nasir, Naif Road, Deira, Dubai, UAE",
      ar: "منطقة 116، شارع 16، عيال ناصر، شارع نايف، ديرة، دبي، الإمارات",
    },
    mapsLink: "https://maps.app.goo.gl/EYzqEZHzsqdnfyCN9?g_st=iw",
    mapsEmbed:
      "https://maps.google.com/maps?q=Ayal+Nasir+Naif+Road+Deira+Dubai+UAE&t=&z=15&ie=UTF8&iwloc=&output=embed",
    deliveryInfo: {
      en: "Delivery fees and times are confirmed with you on WhatsApp after you place your order. Store pickup is available in Deira, Dubai.",
      ar: "يتم تأكيد رسوم ومدة التوصيل معك عبر واتساب بعد إرسال الطلب. الاستلام من المتجر متاح في ديرة، دبي.",
    },
    deliveryFee: 0,
    freeDeliveryOver: null,
    regions: [
      { en: "Abu Dhabi", ar: "أبوظبي" },
      { en: "Dubai", ar: "دبي" },
      { en: "Sharjah", ar: "الشارقة" },
      { en: "Ajman", ar: "عجمان" },
      { en: "Umm Al Quwain", ar: "أم القيوين" },
      { en: "Ras Al Khaimah", ar: "رأس الخيمة" },
      { en: "Fujairah", ar: "الفجيرة" },
    ],
    hours: [
      { days: { en: "Monday – Saturday", ar: "الاثنين – السبت" }, time: { en: "10:00 AM – 10:00 PM", ar: "10:00 ص – 10:00 م" } },
      { days: { en: "Sunday", ar: "الأحد" }, time: { en: "Closed", ar: "مغلق" } },
    ],
    openDays: [1, 2, 3, 4, 5, 6],
    openHour: 10,
    closeHour: 22,
    timeZone: "Asia/Dubai",
    enabled: true,
  },
  oman: {
    code: "oman",
    name: { en: "Oman", ar: "سلطنة عُمان" },
    currency: "OMR",
    currencyDecimals: 3,
    whatsappNumber: "", // TODO: set the Oman WhatsApp number (Admin → Settings)
    phone: "",
    phoneDisplay: "",
    email: "",
    address: { en: "", ar: "" },
    mapsLink: "",
    mapsEmbed: "",
    deliveryInfo: {
      en: "Delivery to Oman is arranged and confirmed with you on WhatsApp after you place your order.",
      ar: "يتم ترتيب التوصيل إلى سلطنة عُمان وتأكيده معك عبر واتساب بعد إرسال الطلب.",
    },
    deliveryFee: 0,
    freeDeliveryOver: null,
    regions: [
      { en: "Muscat", ar: "مسقط" },
      { en: "Dhofar", ar: "ظفار" },
      { en: "Musandam", ar: "مسندم" },
      { en: "Al Buraimi", ar: "البريمي" },
      { en: "Ad Dakhiliyah", ar: "الداخلية" },
      { en: "North Al Batinah", ar: "شمال الباطنة" },
      { en: "South Al Batinah", ar: "جنوب الباطنة" },
      { en: "North Ash Sharqiyah", ar: "شمال الشرقية" },
      { en: "South Ash Sharqiyah", ar: "جنوب الشرقية" },
      { en: "Ad Dhahirah", ar: "الظاهرة" },
      { en: "Al Wusta", ar: "الوسطى" },
    ],
    hours: [],
    openDays: [],
    openHour: 0,
    closeHour: 0,
    timeZone: "Asia/Muscat",
    enabled: true,
  },
};
