import type { CountryCode } from "@/i18n/config";

// Simple inline SVG flags (emoji flags don't render on Windows browsers).
export default function Flag({ code, className = "h-4 w-6" }: { code: CountryCode; className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-[2px] ring-1 ring-black/10`} role="img" aria-hidden="true">
      {code === "uae" ? (
        <>
          <rect width="24" height="16" fill="#fff" />
          <rect width="24" height="5.34" fill="#00732f" />
          <rect y="10.66" width="24" height="5.34" fill="#000" />
          <rect width="6.4" height="16" fill="#ff0000" />
        </>
      ) : (
        <>
          <rect width="24" height="16" fill="#fff" />
          <rect y="5.34" width="24" height="5.33" fill="#db161b" />
          <rect y="10.66" width="24" height="5.34" fill="#008000" />
          <rect width="7" height="16" fill="#db161b" />
        </>
      )}
    </svg>
  );
}
