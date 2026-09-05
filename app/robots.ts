import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/sitemap"],
        // /care-shifts: volatile pre-launch mockup — keep out of the index
        // until it's a real product (paired with noindex in
        // app/care-shifts/layout.tsx; remove both together when ready).
        // /provider/onboarding and /provider/*/onboard: provider claim flows
        // linked from every provider page; 32K of them were absorbing crawl
        // budget (paired with noindex layouts + rel="nofollow" on the links).
        disallow: [
          "/admin/",
          "/portal/",
          "/api/",
          "/care-shifts",
          "/provider/onboarding",
          "/provider/*/onboard",
        ],
      },
    ],
    sitemap: "https://olera.care/sitemap.xml",
  };
}
