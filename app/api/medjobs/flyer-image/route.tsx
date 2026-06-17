import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { getProgramPdfConfig } from "@/lib/program-pdf/configs";

/**
 * GET /api/medjobs/flyer-image?university=<slug>&format=square|story
 *
 * Renders a shareable social image of the student flyer — the chat/IG/peer
 * channel the print PDF (/api/medjobs/program-pdf) doesn't serve. Driven by the
 * SAME ProgramPdfConfig as the print flyer so the two can never drift: one
 * config, every format.
 *
 *   format=square → 1080×1080 (IG post / group chat)
 *   format=story  → 1080×1920 (IG / Snap story)
 *
 * Falls back to the generic ("any campus") config when the slug isn't
 * configured, so the public #help card always renders. No auth — same content
 * a partner would share publicly.
 *
 * Node runtime: the `qrcode` package generates the QR data URI server-side.
 */

export const runtime = "nodejs";

const EMERALD = "#059669";
const EMERALD_DARK = "#047857";
const GRAY_900 = "#111827";
const GRAY_500 = "#6b7280";

function cleanUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\?.*$/, "");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("university") ?? "generic";
  const format = url.searchParams.get("format") === "story" ? "story" : "square";

  // Always resolve a config — fall back to the generic flyer when the campus
  // isn't configured so the share card never 404s.
  const config = getProgramPdfConfig(slug, "student") ?? getProgramPdfConfig("generic", "student");
  if (!config) {
    return new Response("No student flyer config available", { status: 500 });
  }

  const isStory = format === "story";
  const width = 1080;
  const height = isStory ? 1920 : 1080;

  const badge = config.universityShort || config.universityName;
  const chips = config.benefits.slice(0, 3).map((b) => b.title);
  const applyUrl = cleanUrl(config.ctaUrl);

  const qrDataUri = await QRCode.toDataURL(config.ctaUrl, {
    margin: 1,
    width: 600,
    color: { dark: GRAY_900, light: "#FFFFFF" },
  });

  const pad = isStory ? 96 : 80;
  const headlineSize = isStory ? 76 : 62;
  const qrSize = isStory ? 240 : 220;

  return new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
          padding: pad,
          fontFamily: "sans-serif",
        }}
      >
        {/* Top accent rule */}
        <div style={{ display: "flex", width: 120, height: 10, backgroundColor: EMERALD, borderRadius: 6 }} />

        {/* Brand + campus badge */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 28,
          }}
        >
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: EMERALD_DARK, letterSpacing: 1 }}>
            Olera
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 600,
              color: GRAY_500,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {badge}
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            fontSize: headlineSize,
            fontWeight: 700,
            color: GRAY_900,
            lineHeight: 1.12,
            marginTop: isStory ? 96 : 56,
          }}
        >
          {config.heroHeadline}
        </div>

        {/* Proof chips */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: isStory ? 64 : 44 }}>
          {chips.map((c) => (
            <div key={c} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 18 }}>
              <div style={{ display: "flex", width: 16, height: 16, borderRadius: 8, backgroundColor: EMERALD }} />
              <div style={{ display: "flex", fontSize: 34, fontWeight: 600, color: GRAY_900 }}>{c}</div>
            </div>
          ))}
        </div>

        {/* Story-only: legitimacy + eligibility */}
        {isStory ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 72 }}>
            <div style={{ display: "flex", fontSize: 28, color: GRAY_500, lineHeight: 1.4 }}>
              Run by Dr. Logan DuBose, MD, Texas A&amp;M College of Medicine.
            </div>
            <div style={{ display: "flex", fontSize: 28, color: GRAY_500, lineHeight: 1.4 }}>
              Open to any pre-health major. No experience required.
            </div>
          </div>
        ) : null}

        {/* Spacer */}
        <div style={{ display: "flex", flexGrow: 1 }} />

        {/* QR + apply CTA */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 36 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUri} width={qrSize} height={qrSize} alt="Eligibility QR code" style={{ borderRadius: 16 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: GRAY_900 }}>Check eligibility</div>
            <div style={{ display: "flex", fontSize: 32, color: EMERALD_DARK, fontWeight: 600 }}>{applyUrl}</div>
            <div style={{ display: "flex", fontSize: 26, color: GRAY_500 }}>Scan or visit to start</div>
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    },
  );
}
