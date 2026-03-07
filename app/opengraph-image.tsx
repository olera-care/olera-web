import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Olera — Find Senior Care Near You";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f766e 0%, #115e59 50%, #1e3a5f 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "white",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          Olera
        </div>
        <div
          style={{
            fontSize: 32,
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Find Senior Care Near You
        </div>
        <div
          style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.6)",
            marginTop: 24,
          }}
        >
          olera.care
        </div>
      </div>
    ),
    { ...size }
  );
}
