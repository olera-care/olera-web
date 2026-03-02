import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable image optimization for external images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Cache headers for static data files
  async headers() {
    return [
      {
        source: "/data/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // ── 301 Redirects (v1.0 → v2.0 migration) ──
  async redirects() {
    return [
      // Tier 1: Provider portal renames
      { source: "/provider-portal", destination: "/portal", permanent: true },
      { source: "/provider-portal/dashboard", destination: "/portal", permanent: true },
      { source: "/provider-portal/profile", destination: "/portal/profile", permanent: true },
      { source: "/provider-portal/connections", destination: "/portal/connections", permanent: true },
      { source: "/provider-portal/settings", destination: "/portal/settings", permanent: true },
      { source: "/provider-portal/matches", destination: "/portal/matches", permanent: true },
      { source: "/provider-portal/benefits", destination: "/benefits", permanent: true },
      { source: "/provider-portal/availability", destination: "/portal/calendar", permanent: true },

      // Tier 1: Static page renames
      { source: "/terms-and-conditions", destination: "/terms-of-use", permanent: true },

      // Tier 1: Deprecated v1.0 pages → homepage
      { source: "/education-material", destination: "/", permanent: true },
      { source: "/research-and-press", destination: "/", permanent: true },
      { source: "/forum", destination: "/", permanent: true },
      { source: "/care-assessment", destination: "/", permanent: true },

      // Tier 2: Deprecated content pages with slugs → homepage
      { source: "/education-material/:slug*", destination: "/", permanent: true },
      { source: "/research-and-press/:slug*", destination: "/", permanent: true },
      { source: "/caregiver-support", destination: "/resources", permanent: true },
      { source: "/caregiver-support/:slug", destination: "/resources/:slug", permanent: true },
      { source: "/caregiver-support/:slug/:rest+", destination: "/resources", permanent: true },

      // Tier 2: Provider landing page rename
      { source: "/providers", destination: "/for-providers", permanent: true },
      { source: "/forum/:path*", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
