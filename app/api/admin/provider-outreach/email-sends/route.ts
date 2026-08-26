import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * Email send types and their display labels
 */
const TEMPLATE_LABELS: Record<string, string> = {
  intro: "Day 0 · Introduction",
  followup: "Day 3 · Follow-up",
  demand_loss: "Day 5 · Why it's free",
  final: "Day 7 · Get verified",
  nudge: "Manual Resend",
};

export interface EmailSendEntry {
  id: string;
  sent_at: string;
  template_key: string;
  template_label: string;
  trigger: string;
  to_email: string | null;
  open_count: number;
  click_count: number;
  admin_name: string | null;
}

/**
 * GET /api/admin/provider-outreach/email-sends?provider_id=xxx
 *
 * Fetch email send history for a provider.
 * Returns all email_sent touchpoints ordered by created_at DESC.
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

    // Fetch email_sent touchpoints
    const { data: touchpoints, error } = await db
      .from("provider_outreach_touchpoints")
      .select(`
        id,
        created_at,
        details,
        admin_user_id,
        admin_users (
          display_name
        )
      `)
      .eq("provider_id", provider_id)
      .eq("touchpoint_type", "email_sent")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[email-sends] Query error:", error);
      return NextResponse.json({ error: "Failed to fetch email history" }, { status: 500 });
    }

    // Transform to EmailSendEntry format
    const emails: EmailSendEntry[] = (touchpoints || []).map((tp) => {
      const details = tp.details as {
        template_key?: string;
        trigger?: string;
        to_email?: string;
        open_count?: number;
        click_count?: number;
      } | null;
      const adminData = tp.admin_users as { display_name?: string } | null;
      const templateKey = details?.template_key || "unknown";

      return {
        id: tp.id,
        sent_at: tp.created_at,
        template_key: templateKey,
        template_label: TEMPLATE_LABELS[templateKey] || templateKey,
        trigger: details?.trigger || "unknown",
        to_email: details?.to_email || null,
        open_count: details?.open_count ?? 0,
        click_count: details?.click_count ?? 0,
        admin_name: adminData?.display_name || null,
      };
    });

    return NextResponse.json({ emails });
  } catch (err) {
    console.error("[email-sends] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
