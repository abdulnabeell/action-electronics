import Image from "next/image";

// Clean fallback icon (a rounded "tile" shape) used whenever a category has no image and no product photo.
export function CategoryIcon({ className = "size-1/3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

/** Fixed-size square (reserves its space, so nothing shifts while images load). */
export function CategoryThumb({ src, sizeClass = "size-8", sizes = "32px" }: { src: string | null; sizeClass?: string; sizes?: string }) {
  return (
    <span className={`relative inline-block shrink-0 overflow-hidden rounded-lg bg-brand-light/60 text-brand ${sizeClass}`} aria-hidden="true">
      {src ? <Image src={src} alt="" fill sizes={sizes} className="object-contain p-0.5" /> : <span className="absolute inset-0 grid place-items-center"><CategoryIcon className="size-3/5" /></span>}
    </span>
  );
}
