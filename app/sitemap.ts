import type { MetadataRoute } from "next";
import { createServerClient } from "@supabase/ssr";
import {
  CATEGORY_CONFIGS,
  stateAbbrevToSlug,
  cityToSlug,
} from "@/lib/power-pages";
import { allStates } from "@/data/waiver-library";
import { buildStateUrl, buildProgramUrl } from "@/lib/texas-slug-map";

const SITE_URL = "https://olera.care";

/**
 * Dynamic sitemap for all public pages.
 * Covers: static pages, power pages, 39K+ providers, articles, waiver library.
 *
 * Uses generateSitemaps() to split into sub-sitemaps (Next.js auto-generates
 * a sitemap index at /sitemap.xml pointing to /sitemap/0.xml, /sitemap/1.xml, etc.)
 *
 * Shard 0: static + power pages + content + waiver library
 * Shard 1+: providers (batched by PROVIDER_BATCH_SIZE)
 */

const PROVIDER_BATCH_SIZE = 10_000;

async function getSupabaseClient() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.warn("[sitemap] Missing Supabase env vars");
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

export async function generateSitemaps() {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) return [{ id: 0 }];

    const { count } = await supabase
      .from("olera-providers")
      .select("provider_id", { count: "exact", head: true })
      .or("deleted.is.null,deleted.eq.false");

    const providerCount = count ?? 0;
    const providerShards = Math.ceil(providerCount / PROVIDER_BATCH_SIZE);

    return Array.from({ length: 1 + providerShards }, (_, i) => ({ id: i }));
  } catch (err) {
    console.error("[sitemap] generateSitemaps error:", err);
    return [{ id: 0 }];
  }
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = await getSupabaseClient();

    // ── Shard 0: Static + power pages + content + waiver library ──
    if (id === 0) {
      const entries: MetadataRoute.Sitemap = [];

      // Static pages
      const staticPages = [
        { path: "/", priority: 1.0, changeFrequency: "daily" as const },
        { path: "/browse", priority: 0.9, changeFrequency: "daily" as const },
        { path: "/browse/providers", priority: 0.8, changeFrequency: "daily" as const },
        { path: "/browse/caregivers", priority: 0.8, changeFrequency: "daily" as const },
        { path: "/browse/families", priority: 0.8, changeFrequency: "daily" as const },
        { path: "/for-providers", priority: 0.8, changeFrequency: "weekly" as const },
        { path: "/benefits", priority: 0.7, changeFrequency: "weekly" as const },
        { path: "/benefits/finder", priority: 0.7, changeFrequency: "weekly" as const },
        { path: "/community", priority: 0.6, changeFrequency: "weekly" as const },
        { path: "/caregiver-support", priority: 0.6, changeFrequency: "weekly" as const },
        { path: "/research-and-press", priority: 0.6, changeFrequency: "weekly" as const },
        { path: "/team", priority: 0.7, changeFrequency: "monthly" as const },
        { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
        { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
        { path: "/waiver-library", priority: 0.6, changeFrequency: "monthly" as const },
        { path: "/waiver-library/forms", priority: 0.5, changeFrequency: "monthly" as const },
      ];

      for (const page of staticPages) {
        entries.push({
          url: `${SITE_URL}${page.path}`,
          lastModified: new Date(),
          changeFrequency: page.changeFrequency,
          priority: page.priority,
        });
      }

      // Waiver library pages (static data)
      try {
        for (const state of allStates) {
          const stateUrl = buildStateUrl(state.id);
          entries.push({
            url: `${SITE_URL}${stateUrl}`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
          });
          if (state.id !== "texas") {
            entries.push({
              url: `${SITE_URL}/waiver-library/forms/${state.id}`,
              lastModified: new Date(),
              changeFrequency: "monthly",
              priority: 0.4,
            });
          }
          for (const program of state.programs ?? []) {
            const programUrl = buildProgramUrl(state.id, program.id);
            entries.push({
              url: `${SITE_URL}${programUrl}`,
              lastModified: new Date(),
              changeFrequency: "monthly",
              priority: 0.5,
            });
            if (program.forms?.length > 0) {
              entries.push({
                url: `${SITE_URL}${programUrl}/forms`,
                lastModified: new Date(),
                changeFrequency: "monthly",
                priority: 0.4,
              });
            }
          }
        }
      } catch (err) {
        console.error("[sitemap] waiver library error:", err);
      }

      // Content articles (caregiver-support + research-and-press)
      if (supabase) {
        try {
          const { data: articles } = await supabase
            .from("content_articles")
            .select("slug, section, published_at")
            .eq("status", "published")
            .not("published_at", "is", null);

          if (articles) {
            for (const article of articles) {
              const section = article.section || "caregiver-support";
              entries.push({
                url: `${SITE_URL}/${section}/${article.slug}`,
                lastModified: article.published_at
                  ? new Date(article.published_at)
                  : new Date(),
                changeFrequency: "monthly",
                priority: 0.6,
              });
            }
          }
        } catch (err) {
          console.error("[sitemap] articles error:", err);
        }
      }

      // Power pages (category / state / city)
      if (supabase) {
        try {
          for (const cat of CATEGORY_CONFIGS) {
            entries.push({
              url: `${SITE_URL}/${cat.slug}`,
              lastModified: new Date(),
              changeFrequency: "weekly",
              priority: 0.8,
            });

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

              for (const abbr of stateSet) {
                entries.push({
                  url: `${SITE_URL}/${cat.slug}/${stateAbbrevToSlug(abbr)}`,
                  lastModified: new Date(),
                  changeFrequency: "weekly",
                  priority: 0.75,
                });
              }

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
        } catch (err) {
          console.error("[sitemap] power pages error:", err);
        }
      }

      console.log(`[sitemap] shard 0: ${entries.length} entries`);
      return entries;
    }

    // ── Shard 1+: Provider pages (batched) ──
    const providerShard = id - 1;
    const entries: MetadataRoute.Sitemap = [];

    if (supabase) {
      const offset = providerShard * PROVIDER_BATCH_SIZE;
      const { data: providers } = await supabase
        .from("olera-providers")
        .select("provider_id, slug")
        .or("deleted.is.null,deleted.eq.false")
        .range(offset, offset + PROVIDER_BATCH_SIZE - 1);

      if (providers) {
        for (const provider of providers) {
          entries.push({
            url: `${SITE_URL}/provider/${provider.slug || provider.provider_id}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }

      // Include claimed business_profiles in first provider shard only
      if (providerShard === 0) {
        try {
          const { data: claimedProfiles } = await supabase
            .from("business_profiles")
            .select("slug")
            .in("type", ["organization", "caregiver"])
            .eq("is_active", true);

          if (claimedProfiles) {
            const existingSlugs = new Set(
              entries.map((e) => e.url.split("/provider/")[1])
            );
            for (const profile of claimedProfiles) {
              if (!existingSlugs.has(profile.slug)) {
                entries.push({
                  url: `${SITE_URL}/provider/${profile.slug}`,
                  lastModified: new Date(),
                  changeFrequency: "weekly",
                  priority: 0.7,
                });
              }
            }
          }
        } catch (err) {
          console.error("[sitemap] business_profiles error:", err);
        }
      }
    }

    console.log(`[sitemap] shard ${id}: ${entries.length} entries`);
    return entries;
  } catch (err) {
    console.error("[sitemap] fatal error in shard", id, ":", err);
    return [];
  }
}
