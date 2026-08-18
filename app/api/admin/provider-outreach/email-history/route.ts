import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

interface EmailHistoryEntry {
  email: string;
  source: "organization" | "decision_maker";
  changed_at: string;
  changed_by: string | null;
  change_type: "apollo_confirm" | "manual_edit" | "initial";
}

/**
 * GET /api/admin/provider-outreach/email-history
 *
 * Fetch email change history for a provider.
 * Combines data from:
 *   1. provider_outreach_touchpoints (email_changed events)
 *   2. audit_logs (historical fallback for changes before touchpoints)
 *
 * Query params:
 *   - provider_id: string (required)
 *
 * Returns array of email history entries, newest first.
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
    const provider_id = searchParams.get("provider_id");

    if (!provider_id) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // 1. Fetch from touchpoints (new system - preferred)
    const { data: touchpoints } = await db
      .from("provider_outreach_touchpoints")
      .select(`
        id,
        details,
        created_at,
        admin_user_id,
        admin_users (
          email
        )
      `)
      .eq("provider_id", provider_id)
      .eq("touchpoint_type", "email_changed")
      .order("created_at", { ascending: false })
      .limit(20);

    // 2. Fetch from audit_logs (historical fallback)
    const { data: auditLogs } = await db
      .from("audit_logs")
      .select(`
        id,
        details,
        created_at,
        admin_user_id,
        admin_users (
          email
        )
      `)
      .eq("target_id", provider_id)
      .eq("action", "update_provider_email")
      .order("created_at", { ascending: false })
      .limit(20);

    // Build unified history using old_email (what the email WAS before each change)
    // This ensures we capture the full history including the initial email
    const history: EmailHistoryEntry[] = [];
    const seenEmails = new Set<string>();

    // Process touchpoints first (they have more detail)
    if (touchpoints) {
      for (const tp of touchpoints) {
        const details = tp.details as {
          old_email?: string;
          new_email?: string;
          source?: string;
          old_source?: string;
          new_source?: string;
        };
        const adminEmail = (tp.admin_users as { email?: string } | null)?.email;

        // Use old_email - this is what the email WAS before this change
        // Ordered by created_at DESC, so we see most recent changes first
        if (details.old_email && !seenEmails.has(details.old_email.toLowerCase())) {
          seenEmails.add(details.old_email.toLowerCase());
          history.push({
            email: details.old_email,
            source: (details.old_source as "organization" | "decision_maker") || "organization",
            changed_at: tp.created_at,
            changed_by: adminEmail || null,
            change_type: (details.source as "apollo_confirm" | "manual_edit") || "manual_edit",
          });
        }
      }
    }

    // Process audit logs (for historical data before touchpoints existed)
    if (auditLogs) {
      for (const log of auditLogs) {
        const details = log.details as {
          old_email?: string;
          new_email?: string;
        };
        const adminEmail = (log.admin_users as { email?: string } | null)?.email;

        // Use old_email for consistency
        if (details.old_email && !seenEmails.has(details.old_email.toLowerCase())) {
          seenEmails.add(details.old_email.toLowerCase());
          history.push({
            email: details.old_email,
            source: "organization", // Audit logs don't have source info
            changed_at: log.created_at,
            changed_by: adminEmail || null,
            change_type: "manual_edit",
          });
        }
      }
    }

    // Sort by date descending
    history.sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());

    // Get current email to mark the first entry
    const { data: provider } = await db
      .from("olera-providers")
      .select("email")
      .eq("provider_id", provider_id)
      .single();

    const { data: tracking } = await db
      .from("provider_outreach_tracking")
      .select("email_source")
      .eq("provider_id", provider_id)
      .maybeSingle();

    return NextResponse.json({
      history,
      current_email: provider?.email || null,
      current_source: tracking?.email_source || "organization",
    });
  } catch (err) {
    console.error("[email-history] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
