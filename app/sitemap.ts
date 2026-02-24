import type { MetadataRoute } from "next";
import { createServerClient } from "@supabase/ssr";
import {
  CATEGORY_CONFIGS,
  stateAbbrevToSlug,
  cityToSlug,
} from "@/lib/power-pages";

const SITE_URL = "https://olera.care";

/**
 * Dynamic sitemap for all public pages.
 * Covers: static pages, power pages (category/state/city), and 39K+ provider profiles.
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

  // ── Power pages (category / state / city) ──
  const supabase = await getSupabaseClient();
  if (supabase) {
    for (const cat of CATEGORY_CONFIGS) {
      // Category landing page
      entries.push({
        url: `${SITE_URL}/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });

      // Fetch all state+city combos for this category
      const { data: geoCombos } = await supabase
        .from("olera-providers")
        .select("state, city")
        .eq("provider_category", cat.dbValue)
        .or("deleted.is.null,deleted.eq.false")
        .not("state", "is", null)
        .not("city", "is", null);

      if (geoCombos) {
        const stateSet = new Set<string>();
        const citySet = new Set<string>();

        for (const row of geoCombos) {
          const st = row.state as string;
          const ct = row.city as string;
          stateSet.add(st);
          citySet.add(`${st}::${ct}`);
        }

        // State pages
        for (const abbr of stateSet) {
          entries.push({
            url: `${SITE_URL}/${cat.slug}/${stateAbbrevToSlug(abbr)}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.75,
          });
        }

        // City pages
        for (const key of citySet) {
          const [abbr, city] = key.split("::");
          entries.push({
            url: `${SITE_URL}/${cat.slug}/${stateAbbrevToSlug(abbr)}/${cityToSlug(city)}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    }
  }

  // ── Provider pages (from olera-providers table) ──
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
