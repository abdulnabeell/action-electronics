"use client";

// Last-resort page when even the layout cannot render (e.g. the catalogue database is unreachable or not configured).
// Deliberately static and bilingual: it must not depend on any data. No fake products are ever shown instead.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, display: "grid", minHeight: "100vh", placeItems: "center", padding: 24, textAlign: "center", color: "#0f172a" }}>
        <main role="alert">
          <h1 style={{ fontSize: 28, margin: 0 }}>Action Electronics</h1>
          <p style={{ marginTop: 12 }}>The shop is temporarily unavailable. Please try again in a few minutes.</p>
          <p dir="rtl" style={{ marginTop: 4 }}>المتجر غير متاح مؤقتًا. يرجى المحاولة مرة أخرى بعد قليل.</p>
          <button type="button" onClick={reset} style={{ marginTop: 20, minHeight: 44, padding: "0 24px", borderRadius: 12, border: 0, background: "#2563eb", color: "#fff", fontSize: 16, cursor: "pointer" }}>
            Retry / إعادة المحاولة
          </button>
        </main>
      </body>
    </html>
  );
}
