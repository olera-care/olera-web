import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  CATEGORY_CONFIGS,
  stateAbbrevToSlug,
  cityToSlug,
} from "@/lib/power-pages";
import { allStates } from "@/data/waiver-library";

export const dynamic = "force-dynamic";

const SITE_URL = "https://olera.care";

function getSupabaseClient() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

function xmlEntry(url: string, priority: number, changefreq: string) {
  return `  <url>\n    <loc>${url}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shardParam = searchParams.get("shard");
  const supabase = getSupabaseClient();

  // No shard param → return sitemap index pointing to all shards
  if (shardParam === null) {
    let providerShards = 4; // default
    if (supabase) {
      try {
        const { count } = await supabase
          .from("olera-providers")
          .select("provider_id", { count: "exact", head: true })
          .or("deleted.is.null,deleted.eq.false");
        if (count) {
          providerShards = Math.ceil(count / 10_000);
        }
      } catch (err) {
        console.error("[api/sitemap] count error:", err);
      }
    }

    const shardEntries: string[] = [];
    for (let i = 0; i <= providerShards; i++) {
      shardEntries.push(
        `  <sitemap>\n    <loc>${SITE_URL}/api/sitemap?shard=${i}</loc>\n    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n  </sitemap>`
      );
    }

    const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${shardEntries.join("\n")}\n</sitemapindex>`;

    return new NextResponse(indexXml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }

  const shard = parseInt(shardParam, 10);
  const entries: string[] = [];

  try {
    if (shard === 0) {
      // Static pages
      const staticPages = [
        { path: "/", priority: 1.0, freq: "daily" },
        { path: "/browse", priority: 0.9, freq: "daily" },
        { path: "/browse/providers", priority: 0.8, freq: "daily" },
        { path: "/browse/caregivers", priority: 0.8, freq: "daily" },
        { path: "/browse/families", priority: 0.8, freq: "daily" },
        { path: "/for-providers", priority: 0.8, freq: "weekly" },
        { path: "/benefits", priority: 0.7, freq: "weekly" },
        { path: "/benefits/finder", priority: 0.7, freq: "weekly" },
        { path: "/community", priority: 0.6, freq: "weekly" },
        { path: "/caregiver-support", priority: 0.6, freq: "weekly" },
        { path: "/research-and-press", priority: 0.6, freq: "weekly" },
        { path: "/team", priority: 0.7, freq: "monthly" },
        { path: "/privacy", priority: 0.3, freq: "yearly" },
        { path: "/terms", priority: 0.3, freq: "yearly" },
        { path: "/waiver-library", priority: 0.6, freq: "monthly" },
        { path: "/waiver-library/forms", priority: 0.5, freq: "monthly" },
      ];
      for (const p of staticPages) {
        entries.push(xmlEntry(`${SITE_URL}${p.path}`, p.priority, p.freq));
      }

      // Waiver library
      for (const state of allStates) {
        entries.push(xmlEntry(`${SITE_URL}/waiver-library/${state.id}`, 0.5, "monthly"));
        entries.push(xmlEntry(`${SITE_URL}/waiver-library/forms/${state.id}`, 0.4, "monthly"));
        for (const program of state.programs ?? []) {
          entries.push(xmlEntry(`${SITE_URL}/waiver-library/${state.id}/${program.id}`, 0.5, "monthly"));
          if (program.forms?.length > 0) {
            entries.push(xmlEntry(`${SITE_URL}/waiver-library/${state.id}/${program.id}/forms`, 0.4, "monthly"));
          }
        }
      }

      // Articles
      if (supabase) {
        const { data: articles } = await supabase
          .from("content_articles")
          .select("slug, section, published_at")
          .eq("status", "published")
          .not("published_at", "is", null);
        if (articles) {
          for (const a of articles) {
            entries.push(xmlEntry(`${SITE_URL}/${a.section || "caregiver-support"}/${a.slug}`, 0.6, "monthly"));
          }
        }
      }

      // Power pages
      if (supabase) {
        for (const cat of CATEGORY_CONFIGS) {
          entries.push(xmlEntry(`${SITE_URL}/${cat.slug}`, 0.8, "weekly"));
          const stateSet = new Set<string>();
          const citySet = new Set<string>();
          const PAGE_SIZE = 10_000;
          let offset = 0;
          let hasMore = true;
          while (hasMore) {
            const { data: geoCombos } = await supabase
              .from("olera-providers")
              .select("state, city")
              .eq("provider_category", cat.dbValue)
              .or("deleted.is.null,deleted.eq.false")
              .not("state", "is", null)
              .not("city", "is", null)
              .range(offset, offset + PAGE_SIZE - 1);
            if (!geoCombos || geoCombos.length === 0) break;
            for (const row of geoCombos) {
              stateSet.add(row.state as string);
              citySet.add(`${row.state}::${row.city}`);
            }
            hasMore = geoCombos.length === PAGE_SIZE;
            offset += PAGE_SIZE;
          }
          for (const abbr of stateSet) {
            entries.push(xmlEntry(`${SITE_URL}/${cat.slug}/${stateAbbrevToSlug(abbr)}`, 0.75, "weekly"));
          }
          for (const key of citySet) {
            const [abbr, city] = key.split("::");
            entries.push(xmlEntry(`${SITE_URL}/${cat.slug}/${stateAbbrevToSlug(abbr)}/${cityToSlug(city)}`, 0.7, "weekly"));
          }
        }
      }
    } else {
      // Provider shards
      if (supabase) {
        const batchSize = 10_000;
        const offset = (shard - 1) * batchSize;
        const { data: providers } = await supabase
          .from("olera-providers")
          .select("provider_id, slug")
          .or("deleted.is.null,deleted.eq.false")
          .range(offset, offset + batchSize - 1);
        if (providers) {
          for (const p of providers) {
            entries.push(xmlEntry(`${SITE_URL}/provider/${p.slug || p.provider_id}`, 0.7, "weekly"));
          }
        }
      }
    }
  } catch (err) {
    console.error("[api/sitemap] error:", err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
