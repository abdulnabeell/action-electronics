import Image from "next/image";

// Product photo with a neutral placeholder when a product has no image yet.
export default function ProductImage({
  src,
  alt,
  priority = false,
  sizes = "(max-width: 640px) 50vw, 25vw",
}: {
  src?: string | null;
  alt: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (src) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-contain p-3" />;
  }
  return (
    <div role="img" aria-label={alt} className="absolute inset-0 grid place-items-center bg-slate-100 text-slate-300">
      <svg viewBox="0 0 24 24" className="size-1/3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="m21 16-5-5-9 8" />
      </svg>
    </div>
  );
}
