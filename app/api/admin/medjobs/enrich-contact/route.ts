import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  findEmail,
  findContactFormUrl,
  findPhone,
  findFax,
  findAddress,
  discoverWebsiteByName,
  type ProviderContext,
} from "@/lib/medjobs/outreach-enrichment";

/**
 * POST /api/admin/medjobs/enrich-contact
 *
 * Body: {
 *   outreachId: string,
 *   mode: "email" | "contact_form" | "phone" | "fax" | "address"
 *       | "both" | "all"
 * }
 *
 * Per-row escape hatch for the batch enrichers — the "Find X" buttons and
 * the "✦ Fill from Website" header pill in the SnapshotCard. Resolves the
 * provider's website (general_contact override → linked olera-providers
 * directory), runs the matching finder(s), and RETURNS the value(s).
 *
 * It does NOT write. The caller pre-fills the editable field(s) and
 * persists through the existing `update_general_contact` action — so this
 * adds no CRM state-machine action, enum, touchpoint, or write path
 * (G1–G4). It is a read-only lookup.
 *
 * Modes:
 *   - "email" / "contact_form" / "phone" / "fax" / "address" — single field
 *   - "both" — email + contact_form (legacy, preserved for TJ's existing
 *     header pill behavior)
 *   - "all" — every finder in parallel; one shared website resolution so
 *     scrapes happen once
 *
 * Runs on the Node runtime (the finder does outbound page scraping); allow
 * up to a minute since a cold provider site + Perplexity fallback can be
 * slow. The "all" mode can take longer when multiple finders touch
 * Perplexity, but Promise.all keeps total latency at the slowest finder.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const VALID_MODES = new Set([
  "email",
  "contact_form",
  "phone",
  "fax",
  "address",
  "both",
  "all",
]);

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = (await request.json()) as { outreachId?: string; mode?: string };
    const outreachId = body.outreachId?.trim();
    const mode = body.mode;
    if (!outreachId || !mode || !VALID_MODES.has(mode)) {
      return NextResponse.json(
        {
          error:
            "outreachId and mode ('email' | 'contact_form' | 'phone' | 'fax' | 'address' | 'both' | 'all') are required",
        },
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

    // No website/source on file → discover the real business's site by name +
    // location (Google Places). This becomes the source of record so a provider
    // with no source link still pre-fills on first open. Skipped when a website
    // already exists (resolved above).
    if (!website) {
      const found = await discoverWebsiteByName(
        (row.organization_name as string) || null,
        city,
        state,
      );
      if (found.website) {
        website = found.website;
        placeId = placeId ?? found.placeId;
      }
    }

    const ctx: ProviderContext = {
      name: (row.organization_name as string) || null,
      website,
      place_id: placeId,
      city,
      state,
    };

    if (mode === "all") {
      // Every finder in parallel. Shared ctx means each finder still has to
      // resolve the website internally, but the page-fetch cache + scrape
      // pattern keeps work reasonable. Returns a shape the UI can unpack
      // per-field.
      const [e, f, p, fx, a] = await Promise.all([
        findEmail(ctx),
        findContactFormUrl(ctx),
        findPhone(ctx),
        findFax(ctx),
        findAddress(ctx),
      ]);
      return NextResponse.json({
        // The resolved/discovered website — the client persists it as the
        // source of record (research_data.general_contact.website).
        website: { value: website },
        email: { value: e.email, source: e.source },
        contactForm: { value: f.url, source: f.source },
        phone: { value: p.phone, source: p.source },
        fax: { value: fx.fax, source: fx.source },
        address: {
          street: a.street,
          city: a.city,
          state: a.state,
          zip: a.zip,
          source: a.source,
        },
      });
    }
    if (mode === "both") {
      // Legacy: email + contact_form together (TJ's original header pill).
      const [e, f] = await Promise.all([findEmail(ctx), findContactFormUrl(ctx)]);
      return NextResponse.json({
        email: { value: e.email, source: e.source },
        contactForm: { value: f.url, source: f.source },
      });
    }
    if (mode === "email") {
      const r = await findEmail(ctx);
      return NextResponse.json({ value: r.email, source: r.source });
    }
    if (mode === "contact_form") {
      const r = await findContactFormUrl(ctx);
      return NextResponse.json({ value: r.url, source: r.source });
    }
    if (mode === "phone") {
      const r = await findPhone(ctx);
      return NextResponse.json({ value: r.phone, source: r.source });
    }
    if (mode === "fax") {
      const r = await findFax(ctx);
      return NextResponse.json({ value: r.fax, source: r.source });
    }
    if (mode === "address") {
      const r = await findAddress(ctx);
      return NextResponse.json({
        street: r.street,
        city: r.city,
        state: r.state,
        zip: r.zip,
        source: r.source,
      });
    }
    // VALID_MODES gates above; unreachable.
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lookup failed" },
      { status: 500 },
    );
  }
}
