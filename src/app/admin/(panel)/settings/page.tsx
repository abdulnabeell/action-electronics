import { saveCountry } from "@/lib/admin/actions";
import { requirePage } from "@/lib/admin/auth";
import { listCountries } from "@/lib/admin/queries";
import SubmitButton from "../../SubmitButton";
import { Field, Notice, PageTitle, card } from "../../ui";

export const dynamic = "force-dynamic";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  await requirePage("admin");
  const sp = await searchParams;
  const countries = await listCountries();
  return (
    <div className="space-y-6">
      <PageTitle title="Countries & contact settings" description="Contact details, delivery and the WhatsApp number for each storefront." />
      <Notice error={sp.error} saved={sp.saved} />
      <p className="text-sm text-slate-600">Each storefront has its own currency, WhatsApp number, contact details and delivery information. Orders are sent to the WhatsApp number of the country the customer is shopping in. Currency is fixed per country (AED / OMR) — prices are entered per product and are never converted.</p>

      {countries.map((c) => (
        <form key={c.code} action={saveCountry} className={`${card} grid gap-3 sm:grid-cols-2`}>
          <input type="hidden" name="code" value={c.code} />
          <h2 className="text-base font-bold sm:col-span-2">{c.name.en} — {c.currency}</h2>
          <Field label="Name (English)"><input name="name_en" required defaultValue={c.name.en} className="input" /></Field>
          <Field label="Name (Arabic)"><input name="name_ar" dir="rtl" defaultValue={c.name.ar} className="input" /></Field>
          <Field label="WhatsApp number" hint="International format, digits only, e.g. 971501234567. Leave empty to disable checkout for this country."><input name="whatsapp_number" inputMode="numeric" defaultValue={c.whatsappNumber} className="input" /></Field>
          <Field label="Phone (for tel: links)"><input name="phone" defaultValue={c.phone} className="input" placeholder="+97142388680" /></Field>
          <Field label="Phone (display)"><input name="phone_display" defaultValue={c.phoneDisplay} className="input" /></Field>
          <Field label="Email"><input name="email" type="email" defaultValue={c.email} className="input" /></Field>
          <Field label="Address (English)"><textarea name="address_en" rows={2} defaultValue={c.address.en} className="input !py-2.5" /></Field>
          <Field label="Address (Arabic)"><textarea name="address_ar" dir="rtl" rows={2} defaultValue={c.address.ar} className="input !py-2.5" /></Field>
          <Field label="Google Maps link"><input name="maps_link" defaultValue={c.mapsLink} className="input" /></Field>
          <Field label="Google Maps embed URL"><input name="maps_embed" defaultValue={c.mapsEmbed} className="input" /></Field>
          <Field label="Delivery information (English)"><textarea name="delivery_info_en" rows={2} defaultValue={c.deliveryInfo.en} className="input !py-2.5" /></Field>
          <Field label="Delivery information (Arabic)"><textarea name="delivery_info_ar" dir="rtl" rows={2} defaultValue={c.deliveryInfo.ar} className="input !py-2.5" /></Field>
          <Field label={`Delivery fee (${c.currency})`} hint="0 = “confirmed on WhatsApp”."><input name="delivery_fee" type="number" min="0" step="any" defaultValue={c.deliveryFee} className="input" /></Field>
          <Field label={`Free delivery over (${c.currency})`} hint="Leave empty for none."><input name="free_delivery_over" type="number" min="0" step="any" defaultValue={c.freeDeliveryOver ?? ""} className="input" /></Field>
          <Field label="Regions for delivery" hint="One per line: English | Arabic" className="sm:col-span-2"><textarea name="regions" rows={4} defaultValue={c.regions.map((r) => `${r.en} | ${r.ar}`).join("\n")} className="input !py-2.5" /></Field>
          <Field label="Opening hours text" hint="One per line: days EN | days AR | time EN | time AR" className="sm:col-span-2"><textarea name="hours" rows={3} defaultValue={c.hours.map((h) => `${h.days.en} | ${h.days.ar} | ${h.time.en} | ${h.time.ar}`).join("\n")} className="input !py-2.5" /></Field>
          <fieldset className="sm:col-span-2">
            <legend className="mb-1 text-sm font-semibold">“Open now” badge (store local time)</legend>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {days.map((d, i) => <label key={d} className="flex items-center gap-1"><input type="checkbox" name={`day_${i}`} defaultChecked={c.openDays.includes(i)} className="size-4" /> {d}</label>)}
              <label className="flex items-center gap-1">from <input name="open_hour" type="number" min="0" max="23" defaultValue={c.openHour} className="input !w-20" aria-label="Opening hour" /></label>
              <label className="flex items-center gap-1">to <input name="close_hour" type="number" min="0" max="24" defaultValue={c.closeHour} className="input !w-20" aria-label="Closing hour" /></label>
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="enabled" defaultChecked={c.enabled} className="size-4" /> Storefront enabled</label>
          <div className="sm:col-span-2"><SubmitButton>Save {c.name.en}</SubmitButton></div>
        </form>
      ))}
    </div>
  );
}
