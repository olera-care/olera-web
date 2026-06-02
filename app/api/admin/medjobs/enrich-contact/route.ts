import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  findEmail,
  findContactFormUrl,
  type ProviderContext,
} from "@/lib/medjobs/outreach-enrichment";

/**
 * POST /api/admin/medjobs/enrich-contact
 *
 * Body: { outreachId: string, mode: "email" | "contact_form" }
 *
 * Per-row escape hatch for the batch enrichers — the "Find email" / "Find
 * contact form" buttons in the SnapshotCard General Contact section. Resolves
 * the provider's website (general_contact override → linked olera-providers
 * directory), runs the SAME finder the batch scripts use, and RETURNS the value.
 *
 * It does NOT write. The caller pre-fills the editable field and persists
 * through the existing `update_general_contact` action — so this adds no CRM
 * state-machine action, enum, touchpoint, or write path (G1–G4). It is a
 * read-only lookup.
 *
 * Runs on the Node runtime (the finder does outbound page scraping); allow up
 * to a minute since a cold provider site + Perplexity fallback can be slow.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = (await request.json()) as { outreachId?: string; mode?: string };
    const outreachId = body.outreachId?.trim();
    const mode = body.mode;
    if (!outreachId || (mode !== "email" && mode !== "contact_form" && mode !== "both")) {
      return NextResponse.json(
        { error: "outreachId and mode ('email' | 'contact_form' | 'both') are required" },
        { status: 400 },
      );
    }

    const db = getServiceClient();
    const { data: row, error } = await db
      .from("student_outreach")
      .select("id, organization_name, research_data")
      .eq("id", outreachId)
      .maybeSingle();
    if (error || !row) {
      return NextResponse.json({ error: "Outreach row not found" }, { status: 404 });
    }

    const research = (row.research_data ?? {}) as {
      general_contact?: { website?: string | null; city?: string | null; state?: string | null };
      website?: string | null;
      olera_provider_id?: string | null;
    };
    const gc = research.general_contact ?? {};

    let website = gc.website ?? research.website ?? null;
    let placeId: string | null = null;
    let city = gc.city ?? null;
    let state = gc.state ?? null;

    // Fall back to the linked directory provider — it usually has the canonical
    // website and a place_id (which unlocks the Google Places websiteUri lookup).
    if ((!website || !placeId) && research.olera_provider_id) {
      const { data: dir } = await db
        .from("olera-providers")
        .select("website, place_id, city, state")
        .eq("provider_id", research.olera_provider_id)
        .maybeSingle();
      if (dir) {
        website = website ?? ((dir.website as string) || null);
        placeId = (dir.place_id as string) || null;
        city = city ?? ((dir.city as string) || null);
        state = state ?? ((dir.state as string) || null);
      }
    }

    const ctx: ProviderContext = {
      name: (row.organization_name as string) || null,
      website,
      place_id: placeId,
      city,
      state,
    };

    if (mode === "both") {
      // Anticipate-needs: one click fills both gaps. Both finders share the
      // same resolved website, so run them together.
      const [e, f] = await Promise.all([findEmail(ctx), findContactFormUrl(ctx)]);
      return NextResponse.json({
        email: { value: e.email, source: e.source },
        contactForm: { value: f.url, source: f.source },
      });
    }
    if (mode === "email") {
      const r = await findEmail(ctx);
      return NextResponse.json({ value: r.email, source: r.source });
    } else {
      const r = await findContactFormUrl(ctx);
      return NextResponse.json({ value: r.url, source: r.source });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lookup failed" },
      { status: 500 },
    );
  }
}
