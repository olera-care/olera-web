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
        disallow: ["/admin/", "/portal/", "/api/", "/care-shifts"],
      },
    ],
    sitemap: "https://olera.care/sitemap.xml",
  };
}
