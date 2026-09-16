import { site } from "@/lib/site";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

/**
 * Shared layout for generated Open Graph images. Inline styles only — Satori
 * (behind next/og) does not run Tailwind.
 */
export function OgCard({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: "#05060b",
        backgroundImage:
          "radial-gradient(900px circle at 15% 0%, rgba(76,125,255,0.30), transparent 55%), radial-gradient(760px circle at 92% 100%, rgba(139,92,246,0.28), transparent 55%)",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, #22d3ee, #4c7dff 52%, #8b5cf6)",
            fontSize: 30,
            fontWeight: 700,
          }}
        >
          &gt;
        </div>
        <div
          style={{ display: "flex", fontSize: 28, letterSpacing: "-0.02em" }}
        >
          <span style={{ fontWeight: 700 }}>Shellman</span>
          <span style={{ color: "rgba(255,255,255,0.55)", marginLeft: 8 }}>
            Tech
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {eyebrow ? (
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              marginBottom: 24,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            fontSize: title.length > 46 ? 62 : 76,
            fontWeight: 700,
            letterSpacing: "-0.035em",
            lineHeight: 1.06,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        {description ? (
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 28,
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.6)",
              maxWidth: 900,
            }}
          >
            {description}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 24,
          color: "rgba(255,255,255,0.45)",
        }}
      >
        <span>{site.domain}</span>
        <span>{site.email}</span>
      </div>
    </div>
  );
}
