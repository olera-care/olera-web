import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { getConnectionTemperature, recommendNextStep } from "@/lib/connection-temperature";

/**
 * GET /api/admin/connections/[id] — detail for one connection, so a tracker row
 * can expand to show the actual gap: the family's ask, the conversation thread,
 * the provider's contact + engagement, nudge history, and the recommended next
 * step. Lazy-loaded on expand (the list stays light).
 */

const CARE_TYPE_LABELS: Record<string, string> = {
  home_care: "Home Care",
  home_health: "Home Health Care",
  assisted_living: "Assisted Living",
  memory_care: "Memory Care",
};
const TIMELINE_LABELS: Record<string, string> = {
  immediate: "ASAP",
  within_1_month: "Within 1 month",
  within_3_months: "Within 3 months",
  exploring: "Exploring",
  asap: "ASAP",
  within_month: "Within 1 month",
  few_months: "Within 3 months",
  researching: "Exploring",
};

interface ThreadMsg {
  from_profile_id?: string;
  text?: string;
  created_at?: string;
  is_auto_reply?: boolean;
}

/** Best-effort family "ask" from the connection.message JSON or care metadata. */
function familyAsk(message: string | null, careTypes?: string[] | null): string | null {
  if (message) {
    try {
      const j = JSON.parse(String(message));
      const note = j.additional_notes || j.message || j.notes;
      if (note) return String(note);
      const parts: string[] = [];
      const ct = j.care_type ? CARE_TYPE_LABELS[j.care_type] || j.care_type : null;
      const tl = j.urgency ? TIMELINE_LABELS[j.urgency] || j.urgency : null;
      if (ct) parts.push(`Looking for ${ct}`);
      if (tl) parts.push(`Timeline: ${tl}`);
      if (parts.length) return parts.join(" · ");
    } catch {
      return String(message);
    }
  }
  if (careTypes && careTypes.length) {
    return `Looking for ${CARE_TYPE_LABELS[careTypes[0]] || careTypes[0]}`;
  }
  return null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { id } = await params;
    const db = getServiceClient();

    const { data: c, error } = await db
      .from("connections")
      .select(`
        id, type, status, message, metadata, created_at, from_profile_id, to_profile_id,
        from_profile:business_profiles!connections_from_profile_id_fkey(display_name, email, phone, care_types),
        to_profile:business_profiles!connections_to_profile_id_fkey(id, display_name, slug, source_provider_id, email, phone)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[connections/:id] query error:", error);
      return NextResponse.json({ error: "Failed to load connection" }, { status: 500 });
    }
    if (!c) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const family = Array.isArray(c.from_profile) ? c.from_profile[0] : c.from_profile;
    const provider = Array.isArray(c.to_profile) ? c.to_profile[0] : c.to_profile;
    const meta = (c.metadata ?? {}) as Record<string, unknown>;

    const temperature = getConnectionTemperature(
      {
        from_profile_id: c.from_profile_id ?? "",
        to_profile_id: c.to_profile_id ?? "",
        status: c.status,
        created_at: c.created_at,
        metadata: c.metadata,
      },
      Date.now()
    );

    const providerEmail = provider?.email ?? null;
    const nudgeCount = (meta.nudge_count as number) || 0;
    const nextStep = recommendNextStep(temperature, {
      providerHasEmail: !!providerEmail?.trim(),
      nudgeCount,
    });

    // Conversation thread, tagged by role for rendering.
    const rawThread = (meta.thread as ThreadMsg[]) || [];
    const thread = rawThread.map((m) => ({
      text: m.text ?? "",
      created_at: m.created_at ?? null,
      is_auto_reply: m.is_auto_reply === true,
      role:
        m.from_profile_id === c.to_profile_id
          ? "provider"
          : m.from_profile_id === c.from_profile_id
            ? "family"
            : "system",
    }));

    // Provider engagement (opened/clicked/contact revealed/continue in inbox).
    // Use all possible provider identifiers for engagement lookup (matches list API)
    const engagementKeys = [
      provider?.slug,
      provider?.source_provider_id,
      provider?.id,
      c.to_profile_id,
    ].filter(Boolean) as string[];
    let engagement = { email_clicked: false, lead_opened: false, contact_revealed: false, continue_in_inbox: false };
    if (engagementKeys.length > 0) {
      const { data: events } = await db
        .from("provider_activity")
        .select("event_type")
        .in("provider_id", engagementKeys)
        .in("event_type", ["email_click", "lead_opened", "contact_revealed", "continue_in_inbox"]);
      engagement = {
        email_clicked: (events ?? []).some((e) => e.event_type === "email_click"),
        lead_opened: (events ?? []).some((e) => e.event_type === "lead_opened"),
        contact_revealed: (events ?? []).some((e) => e.event_type === "contact_revealed"),
        continue_in_inbox: (events ?? []).some((e) => e.event_type === "continue_in_inbox"),
      };
    }

    // Email trail — every notification sent to this provider since the lead
    // arrived (provider_id keys both manual nudges and the consolidated cron
    // nudges). Lifecycle fields drive the delivered/opened/clicked status.
    type EmailLogRow = {
      id: string;
      email_type: string | null;
      recipient: string | null;
      status: string | null;
      created_at: string | null;
      delivered_at: string | null;
      first_opened_at: string | null;
      first_clicked_at: string | null;
      bounced_at: string | null;
      complained_at: string | null;
    };
    // Only lead/connection-relevant mail — not weekly digests or profile nudges.
    const LEAD_EMAIL_TYPES = [
      "provider_nudge",
      "add_email_notification",
      "connection_request",
      "guest_connection",
      "question_received",
      "new_message",
      "post_connection_followup",
    ];
    // Query emails by all possible provider identifiers
    // Emails may be logged with profile ID, slug, or source_provider_id depending on context
    const emailProviderKeys = [
      c.to_profile_id,
      provider?.slug,
      provider?.source_provider_id,
    ].filter(Boolean) as string[];

    let emails: EmailLogRow[] = [];
    if (emailProviderKeys.length > 0) {
      const { data: logs } = await db
        .from("email_log")
        .select(
          "id, email_type, recipient, status, created_at, delivered_at, first_opened_at, first_clicked_at, bounced_at, complained_at"
        )
        .in("provider_id", emailProviderKeys)
        .in("email_type", LEAD_EMAIL_TYPES)
        .gte("created_at", c.created_at)
        .order("created_at", { ascending: false })
        .limit(25);
      emails = (logs as EmailLogRow[]) ?? [];
    }

    // Family nudge info
    const familyNudgeCount = (meta.family_nudge_count as number) || 0;
    const familyLastNudgedAt = (meta.family_nudged_at as string) || null;

    // Parse care metadata from connection message
    let careType: string | null = null;
    let timeline: string | null = null;
    if (c.message) {
      try {
        const msgJson = JSON.parse(String(c.message));
        careType = msgJson.care_type ? (CARE_TYPE_LABELS[msgJson.care_type] || msgJson.care_type) : null;
        timeline = msgJson.urgency ? (TIMELINE_LABELS[msgJson.urgency] || msgJson.urgency) : null;
      } catch {
        // Not JSON, ignore
      }
    }
    // Fallback to family profile care_types
    if (!careType && family?.care_types?.length) {
      careType = CARE_TYPE_LABELS[family.care_types[0]] || family.care_types[0];
    }

    return NextResponse.json({
      id: c.id,
      status: c.status,
      created_at: c.created_at,
      emails,
      family: {
        id: c.from_profile_id ?? null,
        display_name: family?.display_name ?? null,
        email: family?.email ?? null,
        phone: family?.phone ?? null,
        nudgeCount: familyNudgeCount,
        lastNudgedAt: familyLastNudgedAt,
        careType,
        timeline,
      },
      provider: {
        display_name: provider?.display_name ?? null,
        email: providerEmail,
        phone: provider?.phone ?? null,
        hasEmail: !!providerEmail?.trim(),
        nudgeCount,
        lastNudgedAt: (meta.nudged_at as string) || null,
        // Directory accepts provider_id / slug / business-profile id as the key.
        slug: provider?.slug ?? provider?.source_provider_id ?? c.to_profile_id ?? null,
      },
      ask: familyAsk(c.message, family?.care_types),
      thread,
      engagement,
      temperature,
      nextStep,
    });
  } catch (err) {
    console.error("[connections/:id] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
