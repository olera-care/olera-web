import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { isSuccessfulConnection } from "@/lib/connection-temperature";

/**
 * GET /api/admin/connections/funnel — engagement funnel metrics for the
 * connections tracker's monetization dashboard.
 *
 * Returns counts at each funnel stage:
 *   leads_sent      → inquiry connections created (email sent to provider)
 *   emails_opened   → provider opened the email (email_log.first_opened_at)
 *   emails_clicked  → provider clicked a link (provider_activity.email_click)
 *   leads_viewed    → provider opened lead drawer (provider_activity.lead_opened)
 *   contacts_revealed → provider copied contact info (provider_activity.contact_revealed)
 *   providers_responded → provider replied (successful connection)
 *
 * Plus conversion rates between each stage.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    const db = getServiceClient();

    // 1. Get all inquiry connections in date range
    let connectionsQuery = db
      .from("connections")
      .select(`
        id, status, metadata, created_at, to_profile_id,
        to_profile:business_profiles!connections_to_profile_id_fkey(slug, source_provider_id)
      `)
      .eq("type", "inquiry")
      .not("metadata", "cs", JSON.stringify({ archived: true }))
      .not("metadata", "cs", JSON.stringify({ admin_hidden: true }))
      .limit(5000);

    if (dateFrom) connectionsQuery = connectionsQuery.gte("created_at", dateFrom);
    if (dateTo) connectionsQuery = connectionsQuery.lte("created_at", dateTo);

    const { data: connections, error: connError } = await connectionsQuery;
    if (connError) {
      console.error("[connections/funnel] connections query error:", connError);
      return NextResponse.json({ error: "Failed to load connections" }, { status: 500 });
    }

    const allConnections = connections ?? [];
    const leadsSent = allConnections.length;

    // Build provider activity keys (slug or source_provider_id or profile id)
    const providerKeys = new Set<string>();
    const connectionsByProvider = new Map<string, typeof allConnections>();

    for (const c of allConnections) {
      const provider = Array.isArray(c.to_profile) ? c.to_profile[0] : c.to_profile;
      const key = provider?.slug || provider?.source_provider_id || c.to_profile_id;
      if (key) {
        providerKeys.add(key);
        if (!connectionsByProvider.has(key)) {
          connectionsByProvider.set(key, []);
        }
        connectionsByProvider.get(key)!.push(c);
      }
    }

    // 2. Get email_log entries for these providers (question_received emails)
    const providerKeyArray = Array.from(providerKeys);
    let emailsOpened = 0;

    if (providerKeyArray.length > 0) {
      // Query email_log for lead notification emails in the date range
      let emailQuery = db
        .from("email_log")
        .select("provider_id, first_opened_at")
        .in("provider_id", providerKeyArray)
        .in("email_type", ["question_received", "connection_request", "add_email_notification", "guest_connection"])
        .limit(10000);

      if (dateFrom) emailQuery = emailQuery.gte("created_at", dateFrom);
      if (dateTo) emailQuery = emailQuery.lte("created_at", dateTo);

      const { data: emailLogs } = await emailQuery;

      // Count unique providers who opened at least one email
      const openedProviders = new Set<string>();
      for (const log of emailLogs ?? []) {
        if (log.first_opened_at && log.provider_id) {
          openedProviders.add(log.provider_id);
        }
      }
      emailsOpened = openedProviders.size;
    }

    // 3. Get provider_activity for engagement events
    let emailsClicked = 0;
    let leadsViewed = 0;
    let contactsRevealed = 0;

    if (providerKeyArray.length > 0) {
      let activityQuery = db
        .from("provider_activity")
        .select("provider_id, event_type, metadata")
        .in("provider_id", providerKeyArray)
        .in("event_type", ["email_click", "lead_opened", "contact_revealed", "phone_clicked", "email_link_clicked"])
        .limit(10000);

      if (dateFrom) activityQuery = activityQuery.gte("created_at", dateFrom);
      if (dateTo) activityQuery = activityQuery.lte("created_at", dateTo);

      const { data: activities } = await activityQuery;

      // Count unique providers per event type
      const clickedProviders = new Set<string>();
      const viewedProviders = new Set<string>();
      const revealedProviders = new Set<string>();

      for (const a of activities ?? []) {
        if (a.event_type === "email_click") clickedProviders.add(a.provider_id);
        // Only count lead_opened if it has a specific connection_id
        // Events without connection_id are from landing on the page, not actually viewing a lead
        if (a.event_type === "lead_opened") {
          const meta = a.metadata as Record<string, unknown> | null;
          const connectionId = meta?.connection_id || meta?.lead_id;
          if (connectionId) {
            viewedProviders.add(a.provider_id);
          }
        }
        // contact_revealed, phone_clicked, email_link_clicked all count as "contact revealed"
        if (a.event_type === "contact_revealed" || a.event_type === "phone_clicked" || a.event_type === "email_link_clicked") {
          revealedProviders.add(a.provider_id);
        }
      }

      emailsClicked = clickedProviders.size;
      leadsViewed = viewedProviders.size;
      contactsRevealed = revealedProviders.size;
    }

    // 4. Count successful connections (provider responded)
    let providersResponded = 0;
    for (const c of allConnections) {
      if (isSuccessfulConnection(c)) {
        providersResponded++;
      }
    }

    // 5. Calculate conversion rates (percentage, rounded)
    // Note: Rates are calculated for the UI's 5-stage funnel:
    // Leads Sent → Emails Opened → Leads Viewed → Contact Revealed → Connected
    const safeRate = (num: number, denom: number) =>
      denom > 0 ? Math.round((num / denom) * 100) : 0;

    return NextResponse.json({
      // Raw counts
      leads_sent: leadsSent,
      emails_opened: emailsOpened,
      emails_clicked: emailsClicked,
      leads_viewed: leadsViewed,
      contacts_revealed: contactsRevealed,
      providers_responded: providersResponded,

      // Conversion rates (percentage) - each stage relative to previous visible stage
      open_rate: safeRate(emailsOpened, leadsSent),           // opened / sent
      click_rate: safeRate(emailsClicked, emailsOpened),      // clicked / opened (not shown in UI)
      view_rate: safeRate(leadsViewed, emailsOpened),         // viewed / opened (UI shows opened → viewed)
      reveal_rate: safeRate(contactsRevealed, leadsViewed),   // revealed / viewed
      response_rate: safeRate(providersResponded, contactsRevealed), // responded / revealed

      // Overall conversion
      overall_rate: safeRate(providersResponded, leadsSent),
    });
  } catch (err) {
    console.error("[connections/funnel] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
