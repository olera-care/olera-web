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
      { source: "/provider-portal/connections", destination: "/provider/connections", permanent: true },
      { source: "/portal/connections", destination: "/provider/connections", permanent: true },
      { source: "/provider-portal/settings", destination: "/portal/settings", permanent: true },
      { source: "/provider-portal/matches", destination: "/portal/matches", permanent: true },
      { source: "/provider-portal/benefits", destination: "/benefits", permanent: true },
      { source: "/provider-portal/availability", destination: "/portal/calendar", permanent: true },

      // Tier 1: Legal page redirects → dedicated v2 pages
      { source: "/terms-and-conditions", destination: "/terms", permanent: true },
      { source: "/pages/terms", destination: "/terms", permanent: true },
      { source: "/pages/terms-and-conditions", destination: "/terms", permanent: true },
      { source: "/pages/privacy-policy", destination: "/privacy", permanent: true },

      // Tier 1: Deprecated v1.0 pages → homepage
      { source: "/education-material", destination: "/", permanent: true },
      // /research-and-press — now a live page (removed redirect)
      { source: "/research-and-press/c/:slug", destination: "/research-and-press", permanent: true },
      { source: "/forum", destination: "/", permanent: true },
      { source: "/care-assessment", destination: "/benefits/finder", permanent: true },

      // Tier 2: Deprecated content pages with slugs → homepage
      { source: "/education-material/:slug*", destination: "/", permanent: true },
      // /research-and-press/:slug — now a live page (removed redirect)
      { source: "/resources", destination: "/caregiver-support", permanent: true },
      { source: "/resources/:slug", destination: "/caregiver-support/:slug", permanent: true },
      { source: "/caregiver-support/:slug/:rest+", destination: "/caregiver-support", permanent: true },
      { source: "/forum/:path*", destination: "/", permanent: true },

      // Tier 3: v1.0 pages with v2 equivalents
      { source: "/providers", destination: "/for-providers", permanent: true },
      { source: "/account", destination: "/portal", permanent: true },
      { source: "/inbox", destination: "/portal", permanent: true },
      { source: "/community", destination: "/", permanent: false },
      { source: "/community/:path*", destination: "/", permanent: false },
      { source: "/caregiver-forum", destination: "/", permanent: true },
      { source: "/caregiver-forum/:path*", destination: "/", permanent: true },
      { source: "/pages/privacy", destination: "/privacy", permanent: true },

      // Tier 3: v1.0 auth pages (no v2 equivalent — auth handled via modal/Supabase)
      { source: "/confirm-email", destination: "/", permanent: true },
      { source: "/reset-password", destination: "/", permanent: true },

      // Tier 3: v1.0 review submission pages → provider page
      { source: "/provider/:slug/review/:uuid", destination: "/provider/:slug", permanent: true },
      { source: "/provider/:slug/request-review/:token", destination: "/provider/:slug", permanent: true },

      // Tier 3: v1.0 company pages → v2 equivalents
      { source: "/company/about", destination: "/about", permanent: true },
      { source: "/company/leadership", destination: "/team", permanent: true },
      { source: "/company/contact-us", destination: "/contact", permanent: true },
      { source: "/company/investors", destination: "/about", permanent: true },

      // Tier 3: v1.0 pages with no v2 equivalent → homepage
      { source: "/caregiver-relief-network", destination: "/", permanent: true },
      { source: "/caregiver-relief-network/:path*", destination: "/", permanent: true },
      { source: "/company/:slug", destination: "/", permanent: true },

      // Tier 4: v1.0 provider auth URLs (from provider-portal-redirects.ts)
      { source: "/provider/sign-up", destination: "/for-providers", permanent: true },
      { source: "/provider/sign-in", destination: "/for-providers", permanent: true },
      { source: "/provider/forgot-password", destination: "/for-providers", permanent: true },
      { source: "/provider/resend-activation-link", destination: "/for-providers", permanent: true },
      { source: "/provider/claim", destination: "/for-providers/claim", permanent: true },
      { source: "/provider/new/edit-basics", destination: "/for-providers/create", permanent: true },

      // Tier 4: v1.0 provider edit/status URLs
      { source: "/provider/:slug/preview", destination: "/provider/:slug", permanent: true },
      { source: "/provider/:slug/edit-basics", destination: "/provider/:slug", permanent: true },
      { source: "/provider/:slug/edit-images", destination: "/provider/:slug", permanent: true },
      { source: "/provider/:slug/edit-prices", destination: "/provider/:slug", permanent: true },
      { source: "/provider/:slug/status", destination: "/provider/:slug", permanent: true },

      // Tier 4: v1.0 CMS pages catch-all
      { source: "/pages/:slug", destination: "/", permanent: true },

      // Tier 4: v1.0 curated articles
      { source: "/caregiver-support/curated", destination: "/caregiver-support", permanent: true },
      { source: "/caregiver-support/curated/:slug", destination: "/caregiver-support", permanent: true },

      // Tier 4: v1.0 sign-out
      { source: "/sign-out", destination: "/", permanent: true },
    ];
  },

  // Rewrites for sitemap (the [category] dynamic route shadows /sitemap.xml)
  async rewrites() {
    return [
      { source: "/sitemap.xml", destination: "/api/sitemap" },
      { source: "/sitemap-index.xml", destination: "/api/sitemap" },
    ];
  },
};

export default nextConfig;
