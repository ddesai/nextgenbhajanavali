"use client";

import type { CSSProperties } from "react";
import { useEffect } from "react";

/**
 * Root error boundary (must define html/body). Catches failures in root layout.
 * Uses inline styles only — global CSS may not load when this renders.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const wrap: CSSProperties = {
    minHeight: "100dvh",
    margin: 0,
    padding: "3rem 1rem",
    fontFamily: "system-ui, sans-serif",
    background: "#faf7f2",
    color: "#2a2218",
  };

  return (
    <html lang="en">
      <body style={wrap}>
        <main style={{ maxWidth: "28rem", margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Bhajanavali</h1>
          <p style={{ marginTop: "1rem", fontSize: "0.875rem", lineHeight: 1.6, opacity: 0.85 }}>
            A critical error prevented the app from loading. Please refresh or try again.
          </p>
          <button
            type="button"
            style={{
              marginTop: "1.5rem",
              borderRadius: "9999px",
              border: "1px solid rgba(0,0,0,0.15)",
              padding: "0.5rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              background: "#fff",
              cursor: "pointer",
            }}
            onClick={() => reset()}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
