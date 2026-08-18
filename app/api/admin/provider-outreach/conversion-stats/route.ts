import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/conversion-stats
 *
 * Returns conversion statistics for all cities with sequence history.
 * Shows cumulative data: how many providers entered sequence and how many claimed.
 *
 * Query params:
 *   - state (required): State to filter by (e.g., "TX", "CA")
 *
 * Returns:
 *   - cities: Array of { city, in_sequence, claimed, rate }
 *     - in_sequence: Providers with sequence_started_at IS NOT NULL
 *     - claimed: Providers that claimed AND were in sequence
 *     - rate: Conversion rate as percentage (0-100)
 *   - totals: { in_sequence, claimed, rate } - state-level totals
 *   - by_email_source: { organization: {...}, decision_maker: {...} }
 *     - Breakdown by sequenced_with_source for comparing org vs decision-maker EMAIL performance
 *     - Only includes providers contacted via email (excludes rare alt-channel-only providers)
 *   - by_channel: { email: {...}, fax: {...}, contact_form: {...}, direct_mail: {...} }
 *     - Breakdown by outreach channel for comparing channel effectiveness
 *     - Each channel shows { attempted, claimed, rate }
 *     - "attempted" = providers contacted via that channel
 *     - "claimed" = providers who claimed while on that channel (attribution)
 *     - Note: A provider on alt channel was also emailed, so they appear in both email.attempted and alt.attempted
 *     - Conversion is attributed to the channel active when they claimed
 */
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
    const state = searchParams.get("state");

    if (!state) {
      return NextResponse.json({ error: "State parameter is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Get all providers that have ever been in sequence in this state
    // Use sequenced_with_source (captured at sequence start) for accurate org vs decision-maker breakdown
    // Falls back to "organization" for legacy records without sequenced_with_source
    // Also fetch re_engage_channel to track alternative channel effectiveness
    const { data: sequencedProviders, error: seqError } = await db
      .from("provider_outreach_tracking")
      .select("provider_id, city, state, sequenced_with_source, re_engage_channel")
      .eq("state", state)
      .not("sequence_started_at", "is", null);

    if (seqError) {
      console.error("[conversion-stats] Sequence query error:", seqError);
      return NextResponse.json({ error: "Failed to fetch sequence data" }, { status: 500 });
    }

    if (!sequencedProviders || sequencedProviders.length === 0) {
      return NextResponse.json({
        cities: [],
        totals: { in_sequence: 0, claimed: 0, rate: 0 },
        by_email_source: {
          organization: { in_sequence: 0, claimed: 0, rate: 0 },
          decision_maker: { in_sequence: 0, claimed: 0, rate: 0 },
        },
        by_channel: {
          email: { attempted: 0, claimed: 0, rate: 0 },
          fax: { attempted: 0, claimed: 0, rate: 0 },
          contact_form: { attempted: 0, claimed: 0, rate: 0 },
          direct_mail: { attempted: 0, claimed: 0, rate: 0 },
        },
      });
    }

    const providerIds = sequencedProviders.map((p) => p.provider_id);

    // Get providers that have claimed (business_profile with account_id)
    const { data: claimedBps, error: claimError } = await db
      .from("business_profiles")
      .select("source_provider_id")
      .in("source_provider_id", providerIds)
      .not("account_id", "is", null);

    if (claimError) {
      console.error("[conversion-stats] Claimed query error:", claimError);
      return NextResponse.json({ error: "Failed to fetch claim data" }, { status: 500 });
    }

    const claimedProviderIds = new Set((claimedBps || []).map((bp) => bp.source_provider_id));

    // Group by city
    const cityMap = new Map<string, { in_sequence: number; claimed: number }>();

    for (const p of sequencedProviders) {
      const city = p.city || "(No City)";
      const stats = cityMap.get(city) || { in_sequence: 0, claimed: 0 };
      stats.in_sequence++;
      if (claimedProviderIds.has(p.provider_id)) {
        stats.claimed++;
      }
      cityMap.set(city, stats);
    }

    // Convert to array with rate, sort by in_sequence descending
    const cities = Array.from(cityMap.entries())
      .map(([city, stats]) => ({
        city,
        in_sequence: stats.in_sequence,
        claimed: stats.claimed,
        rate: stats.in_sequence > 0 ? Math.round((stats.claimed / stats.in_sequence) * 100) : 0,
      }))
      .sort((a, b) => b.in_sequence - a.in_sequence);

    // Calculate totals
    const totalInSequence = sequencedProviders.length;
    const totalClaimed = claimedProviderIds.size;
    const totalRate = totalInSequence > 0 ? Math.round((totalClaimed / totalInSequence) * 100) : 0;

    // Calculate email source breakdown (org vs decision-maker)
    // Use sequenced_with_source which captures the source AT THE TIME of sequencing
    // Legacy records without this field default to "organization"
    const emailSourceStats = {
      organization: { in_sequence: 0, claimed: 0, rate: 0 },
      decision_maker: { in_sequence: 0, claimed: 0, rate: 0 },
    };

    // Calculate channel breakdown (email vs alternative channels)
    // All sequenced providers received email initially. Alternative channels (fax, contact_form, direct_mail)
    // are follow-ups tracked via re_engage_channel.
    //
    // For channel stats:
    // - "attempted" = providers who were contacted via this channel
    // - "claimed" = providers who claimed AND were on this channel when they claimed
    //
    // Note: A provider on an alternative channel was also emailed first, so totals may overlap.
    // The stats answer: "Of providers we tried via X channel, how many converted?"
    const channelStats = {
      email: { attempted: 0, claimed: 0, rate: 0 },
      fax: { attempted: 0, claimed: 0, rate: 0 },
      contact_form: { attempted: 0, claimed: 0, rate: 0 },
      direct_mail: { attempted: 0, claimed: 0, rate: 0 },
    };

    const alternativeChannels = ["fax", "contact_form", "direct_mail"];

    for (const p of sequencedProviders) {
      const rawSource = p.sequenced_with_source || "organization";
      const reEngageChannel = p.re_engage_channel;
      const claimed = claimedProviderIds.has(p.provider_id);

      // Email source breakdown (org vs decision-maker) - for comparing email types
      // Only count providers who were contacted via email (not rare edge cases who started via alt channel)
      if (!alternativeChannels.includes(rawSource)) {
        const emailSource = (rawSource === "decision_maker") ? "decision_maker" : "organization";
        emailSourceStats[emailSource].in_sequence++;
        if (claimed) {
          emailSourceStats[emailSource].claimed++;
        }
      }

      // Channel breakdown - all sequenced providers were emailed
      channelStats.email.attempted++;

      // If provider was moved to an alternative channel, also count them there
      if (reEngageChannel && alternativeChannels.includes(reEngageChannel)) {
        const altChannel = reEngageChannel as "fax" | "contact_form" | "direct_mail";
        channelStats[altChannel].attempted++;

        // Attribution: if they claimed while on an alternative channel, that channel gets credit
        if (claimed) {
          channelStats[altChannel].claimed++;
        }
      } else if (claimed) {
        // Claimed without going to alternative channel = email gets credit
        channelStats.email.claimed++;
      }
    }

    // Calculate rates for each email source
    emailSourceStats.organization.rate = emailSourceStats.organization.in_sequence > 0
      ? Math.round((emailSourceStats.organization.claimed / emailSourceStats.organization.in_sequence) * 100)
      : 0;
    emailSourceStats.decision_maker.rate = emailSourceStats.decision_maker.in_sequence > 0
      ? Math.round((emailSourceStats.decision_maker.claimed / emailSourceStats.decision_maker.in_sequence) * 100)
      : 0;

    // Calculate rates for each channel
    for (const channel of ["email", "fax", "contact_form", "direct_mail"] as const) {
      channelStats[channel].rate = channelStats[channel].attempted > 0
        ? Math.round((channelStats[channel].claimed / channelStats[channel].attempted) * 100)
        : 0;
    }

    return NextResponse.json({
      cities,
      totals: {
        in_sequence: totalInSequence,
        claimed: totalClaimed,
        rate: totalRate,
      },
      by_email_source: emailSourceStats,
      by_channel: channelStats,
    });
  } catch (err) {
    console.error("[conversion-stats] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
