import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/sequence-conversions
 *
 * Returns providers who claimed after going through the email sequence.
 *
 * Query params:
 *   - date (optional): Filter by specific claim date (YYYY-MM-DD). If omitted, returns all conversions.
 *
 * Returns:
 *   - providers: Array of SequenceConversion
 *   - total: number of providers
 */

export interface SequenceConversion {
  provider_id: string;
  provider_name: string;
  city: string | null;
  claim_email: string;
  claimed_at: string;
  assigned_to: string | null;
  assigned_to_display_name: string | null;
  conversion_source: string; // "smartlead", "email_resend", "fax", "contact_form", "direct_mail", "unknown"
}

// Conversion source labels based on last touchpoint before claim
const SOURCE_LABELS: Record<string, string> = {
  smartlead: "SmartLead",
  email_resend: "Resend/Nudge",
  contact_form: "Contact Form",
  fax: "Fax",
  direct_mail: "Direct Mail",
  unknown: "Unknown",
};

// Map touchpoint types to conversion sources
function getSourceFromTouchpoint(touchpointType: string | null): string {
  if (!touchpointType) return "unknown";

  switch (touchpointType) {
    case "smartlead_enrolled":
    case "sequence_launched":
      return "smartlead";
    case "email_sent":
      return "email_resend"; // Manual resend or nudge email
    case "contact_form_sent":
      return "contact_form";
    default:
      return "unknown";
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // Single date filter (YYYY-MM-DD)

    const db = getServiceClient();

    // Step 1: Get all providers who went through the sequence (sequence_started_at IS NOT NULL)
    // Include fax_sent_at and mailer_sent_at for attribution
    const { data: sequencedProviders, error: seqError } = await db
      .from("provider_outreach_tracking")
      .select("provider_id, assigned_to, fax_sent_at, mailer_sent_at, sequence_started_at")
      .not("sequence_started_at", "is", null);

    if (seqError) {
      console.error("[sequence-conversions] Sequence query error:", seqError);
      return NextResponse.json({ error: "Failed to fetch sequence data" }, { status: 500 });
    }

    if (!sequencedProviders || sequencedProviders.length === 0) {
      return NextResponse.json({ providers: [], total: 0, by_source: {}, source_labels: SOURCE_LABELS });
    }

    const sequencedProviderIds = sequencedProviders.map((p) => p.provider_id);
    const assignedToMap = new Map(
      sequencedProviders.map((p) => [p.provider_id, p.assigned_to])
    );
    const trackingDataMap = new Map(
      sequencedProviders.map((p) => [p.provider_id, {
        fax_sent_at: p.fax_sent_at as string | null,
        mailer_sent_at: p.mailer_sent_at as string | null,
        sequence_started_at: p.sequence_started_at as string | null,
      }])
    );

    // Step 2: Get business_profiles that have claimed (account_id IS NOT NULL)
    // and are in our sequenced set
    let bpQuery = db
      .from("business_profiles")
      .select("source_provider_id, account_id, created_at")
      .in("source_provider_id", sequencedProviderIds)
      .not("account_id", "is", null)
      .order("created_at", { ascending: false });

    // Apply date filter on claim date (created_at)
    // Use CT timezone to match Daily Activity behavior
    // Query a wider range and filter in-memory to handle DST correctly
    const filterDate = date || null;
    if (filterDate) {
      // Use CT timezone offsets (CST = -06:00, CDT = -05:00)
      const dayStart = `${filterDate}T00:00:00-06:00`;
      const dayEndPlusBuffer = `${filterDate}T23:59:59-05:00`;
      bpQuery = bpQuery.gte("created_at", dayStart).lte("created_at", dayEndPlusBuffer);
    }

    const { data: claimedBps, error: bpError } = await bpQuery;

    if (bpError) {
      console.error("[sequence-conversions] Business profiles query error:", bpError);
      return NextResponse.json({ error: "Failed to fetch claim data" }, { status: 500 });
    }

    if (!claimedBps || claimedBps.length === 0) {
      return NextResponse.json({ providers: [], total: 0, by_source: {}, source_labels: SOURCE_LABELS });
    }

    const providerIds = claimedBps.map((bp) => bp.source_provider_id);
    const accountIds = claimedBps.map((bp) => bp.account_id);

    // Step 3: Get provider details from olera-providers
    const { data: providerData, error: pdError } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, city")
      .in("provider_id", providerIds);

    if (pdError) {
      console.error("[sequence-conversions] Provider data query error:", pdError);
      return NextResponse.json({ error: "Failed to fetch provider data" }, { status: 500 });
    }

    const providerMap = new Map<string, { name: string; city: string | null }>(
      (providerData || []).map((p: { provider_id: string; provider_name: string; city: string | null }) => [p.provider_id, { name: p.provider_name, city: p.city }])
    );

    // Step 4: Get account emails (accounts → auth.users)
    const { data: accounts, error: accError } = await db
      .from("accounts")
      .select("id, user_id")
      .in("id", accountIds);

    if (accError) {
      console.error("[sequence-conversions] Accounts query error:", accError);
      return NextResponse.json({ error: "Failed to fetch account data" }, { status: 500 });
    }

    // Fetch emails from auth.users
    const accountEmailMap = new Map<string, string>();
    for (const account of accounts || []) {
      if (account.user_id) {
        try {
          const { data: authUser } = await db.auth.admin.getUserById(account.user_id);
          if (authUser?.user?.email) {
            accountEmailMap.set(account.id, authUser.user.email);
          }
        } catch {
          // Skip if we can't get the email
        }
      }
    }

    // Step 5: Get admin display names for assigned_to
    const assignedToIds = Array.from(new Set(sequencedProviders.map((p) => p.assigned_to).filter((id): id is string => Boolean(id))));
    let adminNameMap = new Map<string, string>();

    if (assignedToIds.length > 0) {
      const { data: admins } = await db
        .from("admin_users")
        .select("id, display_name")
        .in("id", assignedToIds);

      adminNameMap = new Map(
        (admins || []).map((a: { id: string; display_name: string | null }) => [a.id, a.display_name || a.id])
      );
    }

    // Step 6: Get touchpoints for attribution
    // Look for: smartlead_enrolled, email_sent, contact_form_sent
    const { data: touchpoints } = await db
      .from("provider_outreach_touchpoints")
      .select("provider_id, touchpoint_type, created_at")
      .in("provider_id", providerIds)
      .in("touchpoint_type", ["smartlead_enrolled", "sequence_launched", "email_sent", "contact_form_sent"])
      .order("created_at", { ascending: false });

    // Build map of provider_id -> array of touchpoints (sorted desc by date)
    const touchpointsByProvider = new Map<string, Array<{ type: string; date: string }>>();
    for (const tp of touchpoints || []) {
      if (!touchpointsByProvider.has(tp.provider_id)) {
        touchpointsByProvider.set(tp.provider_id, []);
      }
      touchpointsByProvider.get(tp.provider_id)!.push({ type: tp.touchpoint_type, date: tp.created_at });
    }

    // Step 7: Build response, filtering by exact CT date if specified
    const providers: SequenceConversion[] = [];
    const bySource: Record<string, number> = {
      smartlead: 0,
      email_resend: 0,
      fax: 0,
      contact_form: 0,
      direct_mail: 0,
      unknown: 0,
    };

    for (const bp of claimedBps) {
      // If date filter is set, verify this claim is actually on that date in CT
      if (filterDate) {
        const claimDateCT = new Date(bp.created_at).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
        if (claimDateCT !== filterDate) continue;
      }

      const providerInfo = providerMap.get(bp.source_provider_id);
      const assignedTo = assignedToMap.get(bp.source_provider_id);
      const trackingData = trackingDataMap.get(bp.source_provider_id);
      const providerTouchpoints = touchpointsByProvider.get(bp.source_provider_id) || [];
      const claimDate = new Date(bp.created_at);

      // Determine conversion source by finding the most recent action BEFORE claim
      // Check: fax_sent_at, mailer_sent_at, and touchpoints
      let conversionSource = "smartlead"; // Default: assume SmartLead sequence
      let mostRecentDate: Date | null = null;

      // Check fax
      if (trackingData?.fax_sent_at) {
        const faxDate = new Date(trackingData.fax_sent_at);
        if (faxDate < claimDate && (!mostRecentDate || faxDate > mostRecentDate)) {
          mostRecentDate = faxDate;
          conversionSource = "fax";
        }
      }

      // Check direct mail
      if (trackingData?.mailer_sent_at) {
        const mailerDate = new Date(trackingData.mailer_sent_at);
        if (mailerDate < claimDate && (!mostRecentDate || mailerDate > mostRecentDate)) {
          mostRecentDate = mailerDate;
          conversionSource = "direct_mail";
        }
      }

      // Check touchpoints - find most recent one BEFORE claim date
      // Touchpoints are already sorted desc, so first one before claim is the most recent
      for (const tp of providerTouchpoints) {
        const tpDate = new Date(tp.date);
        if (tpDate < claimDate) {
          if (!mostRecentDate || tpDate > mostRecentDate) {
            mostRecentDate = tpDate;
            conversionSource = getSourceFromTouchpoint(tp.type);
          }
          break; // Found the most recent touchpoint before claim, no need to continue
        }
      }

      // If no actions found but they went through sequence, attribute to SmartLead
      if (!mostRecentDate && trackingData?.sequence_started_at) {
        conversionSource = "smartlead";
      }

      bySource[conversionSource] = (bySource[conversionSource] || 0) + 1;

      providers.push({
        provider_id: bp.source_provider_id,
        provider_name: providerInfo?.name || "Unknown Provider",
        city: providerInfo?.city || null,
        claim_email: accountEmailMap.get(bp.account_id) || "Unknown",
        claimed_at: bp.created_at,
        assigned_to: assignedTo || null,
        assigned_to_display_name: assignedTo ? (adminNameMap.get(assignedTo) || assignedTo) : null,
        conversion_source: conversionSource,
      });
    }

    return NextResponse.json({
      providers,
      total: providers.length,
      by_source: bySource,
      source_labels: SOURCE_LABELS,
    });
  } catch (err) {
    console.error("[sequence-conversions] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
