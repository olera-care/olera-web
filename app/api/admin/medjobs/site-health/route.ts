import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { loadFunnel30d } from "@/lib/medjobs/funnel-30d";
import type { Health } from "@/lib/medjobs/funnel-health";

/**
 * GET /api/admin/medjobs/site-health
 *
 * One health score per active site, worst first. Powers the navigator beside
 * the System Architecture, whose whole job is answering "which site needs
 * attention right now".
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface SiteHealthRow {
  slug: string;
  name: string;
  score: number;
  status: Health;
  reads: string;
}

const ORDER: Record<Health, number> = { red: 0, yellow: 1, green: 2, unscored: 3 };

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const db = getServiceClient();
    const { sites } = await loadFunnel30d(db);
    // Sequential on purpose: one site's pass is a handful of small queries, and
    // firing every site at once would spike the connection pool for a list the
    // operator reads a few times a day.
    const rows: SiteHealthRow[] = [];
    for (const s of sites) {
      try {
        const r = await loadFunnel30d(db, s.slug);
        rows.push({
          slug: s.slug,
          name: s.name,
          score: r.health.score,
          status: r.health.status,
          reads: r.health.reads,
        });
      } catch {
        rows.push({
          slug: s.slug,
          name: s.name,
          score: 0,
          status: "unscored",
          reads: "Could not be scored.",
        });
      }
    }
    rows.sort(
      (a, b) => ORDER[a.status] - ORDER[b.status] || a.score - b.score || a.name.localeCompare(b.name),
    );
    return NextResponse.json({ sites: rows }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (err) {
    console.error("[medjobs/site-health]", err);
    return NextResponse.json({ error: "Failed to load site health" }, { status: 500 });
  }
}
