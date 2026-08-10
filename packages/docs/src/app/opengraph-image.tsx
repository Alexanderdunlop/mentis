import { ImageResponse } from "next/og";

export const alt =
  "mentis — Accessible @mention autocomplete input for React";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export const dynamic = "force-static";

/**
 * Site-wide social card. Rendered at build time by satori, so every style is
 * inline and every multi-child element sets an explicit `display`.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0b0b0f",
          backgroundImage:
            "radial-gradient(circle at 12% 12%, #1e2a4a 0%, transparent 55%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.03em",
          }}
        >
          mentis
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 40,
            color: "#c3c8d4",
            lineHeight: 1.3,
          }}
        >
          Accessible @mention autocomplete input for React
        </div>

        {/* Faux input showing what the component actually renders. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 56,
            padding: "22px 28px",
            borderRadius: 16,
            border: "1px solid #2c3044",
            background: "#14151d",
            fontSize: 32,
            color: "#8b91a3",
          }}
        >
          <span
            style={{
              display: "flex",
              padding: "6px 16px",
              marginRight: 14,
              borderRadius: 999,
              background: "#3b82f6",
              color: "#ffffff",
            }}
          >
            @Alice Johnson
          </span>
          <span style={{ display: "flex" }}>can you take a look?</span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 28,
            color: "#6b7280",
          }}
        >
          contentEditable · zero dependencies · TypeScript-first
        </div>
      </div>
    ),
    size,
  );
}
