import type { MetadataRoute } from "next";
import { createServerClient } from "@supabase/ssr";
import {
  CATEGORY_CONFIGS,
  stateAbbrevToSlug,
  cityToSlug,
} from "@/lib/power-pages";
import { allStates } from "@/data/waiver-library";
import { pipelineDrafts } from "@/data/pipeline-drafts";

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

// Cache sitemap for 1 hour — crawlers don't need real-time data
export const revalidate = 3600;

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
        { path: "/senior-benefits", priority: 0.6, changeFrequency: "monthly" as const },
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
          entries.push({
            url: `${SITE_URL}/benefits/${state.id}`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
          });
          // Program URLs come from pipeline-drafts, which is the source of truth
          // for /benefits/[slug]/[program] rendering. Iterating waiver-library
          // would emit 404s for any state whose legacy IDs don't match pipeline IDs.
          const drafts = pipelineDrafts[state.abbreviation]?.programs || [];
          for (const draft of drafts) {
            const programUrl = `/benefits/${state.id}/${draft.id}`;
            entries.push({
              url: `${SITE_URL}${programUrl}`,
              lastModified: new Date(),
              changeFrequency: "monthly",
              priority: 0.5,
            });
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
      // Honest <lastmod>: emit when the provider's description was last
      // (re)written (migration 082's description_updated_at), falling back to
      // cleansed_at / created_at. The migration may not be applied yet on every
      // environment (the DB has no migration tracker; cf. hero_image_url in 003)
      // — probe once and degrade to the minimal select + a coarse lastmod if the
      // freshness columns aren't there.
      let providerSelect = "provider_id, slug, description_updated_at, cleansed_at, created_at";
      {
        const probe = await supabase.from("olera-providers").select(providerSelect).limit(1);
        if (probe.error) providerSelect = "provider_id, slug";
      }
      const lastmodOf = (p: Record<string, any>): Date => {
        const ts = (p.description_updated_at || p.cleansed_at || p.created_at) as string | undefined;
        return ts ? new Date(ts) : new Date();
      };

      // Paginate in batches of 1000 (Supabase default row limit)
      const PAGE_SIZE = 1_000;
      const shardStart = providerShard * PROVIDER_BATCH_SIZE;
      let fetched = 0;
      while (fetched < PROVIDER_BATCH_SIZE) {
        const from = shardStart + fetched;
        const to = from + PAGE_SIZE - 1;
        const { data } = await supabase
          .from("olera-providers")
          .select(providerSelect)
          .or("deleted.is.null,deleted.eq.false")
          .range(from, to);
        const providers = data as Array<Record<string, any>> | null;
        if (!providers || providers.length === 0) break;
        for (const provider of providers) {
          entries.push({
            url: `${SITE_URL}/provider/${provider.slug || provider.provider_id}`,
            lastModified: lastmodOf(provider),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
        if (providers.length < PAGE_SIZE) break;
        fetched += providers.length;
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
