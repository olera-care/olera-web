import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  findEmail,
  findPhone,
  discoverWebsiteByName,
  type ProviderContext,
} from "@/lib/medjobs/outreach-enrichment";

/**
 * POST /api/admin/provider-outreach/enrich-contact
 *
 * Scrapes email/phone for a provider in olera-providers directory.
 * Reuses the same enrichment library as MedJobs.
 *
 * Body: { providerId: string, mode: "email" | "phone" | "all" }
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const VALID_MODES = new Set(["email", "phone", "all"]);

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = (await request.json()) as { providerId?: string; mode?: string };
    const providerId = body.providerId?.trim();
    const mode = body.mode;
    if (!providerId || !mode || !VALID_MODES.has(mode)) {
      return NextResponse.json(
        { error: "providerId and mode ('email' | 'phone' | 'all') are required" },
        { status: 400 },
      );
    }

    const db = getServiceClient();
    const { data: provider, error } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, city, state, website, place_id, phone, email")
      .eq("provider_id", providerId)
      .maybeSingle();

    if (error || !provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    let website = (provider.website as string) || null;

    // Discover website if none on file
    if (!website) {
      const found = await discoverWebsiteByName(
        (provider.provider_name as string) || null,
        (provider.city as string) || null,
        (provider.state as string) || null,
      );
      if (found.website) website = found.website;
    }

    const ctx: ProviderContext = {
      name: (provider.provider_name as string) || null,
      website,
      place_id: (provider.place_id as string) || null,
      city: (provider.city as string) || null,
      state: (provider.state as string) || null,
    };

    if (mode === "all") {
      const [e, p] = await Promise.all([findEmail(ctx), findPhone(ctx)]);
      return NextResponse.json({
        email: { value: e.email, source: e.source },
        phone: { value: p.phone, source: p.source },
        website: { value: website },
      });
    }
    if (mode === "email") {
      const r = await findEmail(ctx);
      return NextResponse.json({ value: r.email, source: r.source });
    }
    if (mode === "phone") {
      const r = await findPhone(ctx);
      return NextResponse.json({ value: r.phone, source: r.source });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lookup failed" },
      { status: 500 },
    );
  }
}
