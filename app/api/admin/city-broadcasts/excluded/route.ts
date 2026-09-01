/**
 * GET /api/admin/city-broadcasts/excluded
 *
 * Returns providers who are in broadcast_ready stage but are excluded
 * from broadcasts due to email issues (bounced, complained).
 *
 * These are providers that need admin attention to fix before they
 * can receive broadcasts again.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

interface ExcludedProvider {
  provider_id: string;
  provider_name: string;
  category: string | null;
  city: string;
  state: string | null;
  email: string;
  exclusion_reason: "bounced" | "complained";
  last_bounce_at: string | null;
  last_complaint_at: string | null;
}

interface ProviderRow {
  provider_id: string;
  provider_name: string | null;
  provider_category: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
}

interface TrackingRow {
  provider_id: string;
  city: string | null;
  state: string | null;
  apollo_contact: unknown;
}

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getServiceClient();

  try {
    // Step 1: Get all broadcast_ready providers with their emails
    const { data: trackingRows, error: trackingError } = await db
      .from("provider_outreach_tracking")
      .select("provider_id, city, state, apollo_contact")
      .eq("stage", "broadcast_ready") as unknown as { data: TrackingRow[] | null; error: Error | null };

    if (trackingError) {
      console.error("[city-broadcasts/excluded] Failed to fetch tracking:", trackingError);
      return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
    }

    if (!trackingRows || trackingRows.length === 0) {
      return NextResponse.json({ excluded: [], stats: { bounced: 0, complained: 0, total: 0 } });
    }

    const providerIds = trackingRows.map((r) => r.provider_id);

    // Step 2: Get provider details
    const { data: providers } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, provider_category, city, state, email")
      .in("provider_id", providerIds)
      .or("deleted.is.null,deleted.eq.false") as unknown as { data: ProviderRow[] | null };

    const providerMap = new Map(
      (providers || []).map((p) => [p.provider_id, p])
    );

    // Build list of emails to check
    const emailToProvider = new Map<string, { providerId: string; tracking: TrackingRow; provider: ProviderRow }>();

    for (const tracking of trackingRows) {
      const provider = providerMap.get(tracking.provider_id);
      if (!provider) continue;

      const apolloContact = tracking.apollo_contact as { email?: string } | null;
      const email = apolloContact?.email || provider.email;
      if (!email) continue;

      emailToProvider.set(email.toLowerCase(), {
        providerId: tracking.provider_id,
        tracking,
        provider,
      });
    }

    if (emailToProvider.size === 0) {
      return NextResponse.json({ excluded: [], stats: { bounced: 0, complained: 0, total: 0 } });
    }

    // Step 3: Find emails with bounces or complaints
    const emails = [...emailToProvider.keys()];
    const { data: badEmails, error: emailError } = await db
      .from("email_log")
      .select("recipient, bounced_at, complained_at")
      .in("recipient", emails)
      .or("bounced_at.not.is.null,complained_at.not.is.null")
      .order("created_at", { ascending: false });

    if (emailError) {
      console.error("[city-broadcasts/excluded] Failed to fetch email status:", emailError);
      return NextResponse.json({ error: "Failed to fetch email status" }, { status: 500 });
    }

    // Dedupe by email, keeping the most recent bounce/complaint info
    const emailStatusMap = new Map<string, { bounced_at: string | null; complained_at: string | null }>();
    for (const row of badEmails || []) {
      const email = row.recipient.toLowerCase();
      const existing = emailStatusMap.get(email);
      if (!existing) {
        emailStatusMap.set(email, {
          bounced_at: row.bounced_at,
          complained_at: row.complained_at,
        });
      } else {
        // Keep the most recent bounce/complaint
        if (row.bounced_at && (!existing.bounced_at || row.bounced_at > existing.bounced_at)) {
          existing.bounced_at = row.bounced_at;
        }
        if (row.complained_at && (!existing.complained_at || row.complained_at > existing.complained_at)) {
          existing.complained_at = row.complained_at;
        }
      }
    }

    // Step 4: Build excluded providers list
    const excluded: ExcludedProvider[] = [];
    let bouncedCount = 0;
    let complainedCount = 0;

    for (const [email, status] of emailStatusMap) {
      const providerInfo = emailToProvider.get(email);
      if (!providerInfo) continue;

      const { tracking, provider } = providerInfo;

      // Determine primary exclusion reason (complained takes precedence as it's more serious)
      const reason = status.complained_at ? "complained" : "bounced";
      if (reason === "complained") {
        complainedCount++;
      } else {
        bouncedCount++;
      }

      excluded.push({
        provider_id: tracking.provider_id,
        provider_name: provider.provider_name || "Unknown",
        category: provider.provider_category,
        city: tracking.city || provider.city || "Unknown",
        state: tracking.state || provider.state,
        email,
        exclusion_reason: reason,
        last_bounce_at: status.bounced_at,
        last_complaint_at: status.complained_at,
      });
    }

    // Sort by most recent issue first
    excluded.sort((a, b) => {
      const aDate = a.last_complaint_at || a.last_bounce_at || "";
      const bDate = b.last_complaint_at || b.last_bounce_at || "";
      return bDate.localeCompare(aDate);
    });

    return NextResponse.json({
      excluded,
      stats: {
        bounced: bouncedCount,
        complained: complainedCount,
        total: excluded.length,
      },
    });
  } catch (err) {
    console.error("[city-broadcasts/excluded] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
