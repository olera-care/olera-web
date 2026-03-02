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
      { source: "/forum/:path*", destination: "/", permanent: true },

      // Tier 3: v1.0 pages with v2 equivalents
      { source: "/providers", destination: "/for-providers", permanent: true },
      { source: "/account", destination: "/portal", permanent: true },
      { source: "/inbox", destination: "/portal", permanent: true },
      { source: "/caregiver-forum", destination: "/community", permanent: true },
      { source: "/caregiver-forum/:path*", destination: "/community", permanent: true },
      { source: "/pages/privacy", destination: "/", permanent: true },

      // Tier 3: v1.0 pages with no v2 equivalent → homepage
      { source: "/caregiver-relief-network", destination: "/", permanent: true },
      { source: "/caregiver-relief-network/:path*", destination: "/", permanent: true },
      { source: "/company/:slug", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
