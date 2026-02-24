import type { MetadataRoute } from "next";
import { createServerClient } from "@supabase/ssr";

const SITE_URL = "https://olera.care";

/**
 * Dynamic sitemap for all public pages.
 * Covers: static pages, 39K+ provider profiles, and (future) power pages.
 *
 * Next.js automatically splits sitemaps exceeding 50,000 URLs into
 * multiple sub-sitemaps when using generateSitemaps().
 */

async function getSupabaseClient() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // ── Static pages ──
  const staticPages = [
    { path: "/", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/browse", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/for-providers", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/benefits", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/community", priority: 0.6, changeFrequency: "weekly" as const },
    { path: "/resources", priority: 0.6, changeFrequency: "weekly" as const },
  ];

  for (const page of staticPages) {
    entries.push({
      url: `${SITE_URL}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
  }

  // ── Provider pages (from olera-providers table) ──
  const supabase = await getSupabaseClient();
  if (supabase) {
    // Fetch all provider slugs in batches (Supabase limit is 1000 per request)
    const BATCH_SIZE = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: providers } = await supabase
        .from("olera-providers")
        .select("provider_id")
        .or("deleted.is.null,deleted.eq.false")
        .range(offset, offset + BATCH_SIZE - 1);

      if (!providers || providers.length === 0) {
        hasMore = false;
        break;
      }

      for (const provider of providers) {
        entries.push({
          url: `${SITE_URL}/provider/${provider.provider_id}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }

      offset += BATCH_SIZE;
      if (providers.length < BATCH_SIZE) {
        hasMore = false;
      }
    }

    // Also include claimed business_profiles not in olera-providers
    const { data: claimedProfiles } = await supabase
      .from("business_profiles")
      .select("slug")
      .in("type", ["organization", "caregiver"])
      .eq("is_active", true);

    if (claimedProfiles) {
      const iosIds = new Set(
        entries
          .filter((e) => e.url.includes("/provider/"))
          .map((e) => e.url.split("/provider/")[1])
      );
      for (const profile of claimedProfiles) {
        if (!iosIds.has(profile.slug)) {
          entries.push({
            url: `${SITE_URL}/provider/${profile.slug}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    }
  }

  return entries;
}
