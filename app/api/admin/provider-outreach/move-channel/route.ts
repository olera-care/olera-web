import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/move-channel
 *
 * Moves a provider to a different re-engagement channel (fax, linkedin, direct_mail).
 *
 * Body: { provider_id: string, channel: string }
 *
 * Returns: { success: true }
 */
export const runtime = "nodejs";

const VALID_CHANNELS = ["fax", "linkedin", "direct_mail", "re_engage"];

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = (await request.json()) as {
      provider_id?: string;
      channel?: string;
    };

    const providerId = body.provider_id?.trim();
    const channel = body.channel?.trim();

    if (!providerId) {
      return NextResponse.json(
        { error: "provider_id is required" },
        { status: 400 }
      );
    }

    if (!channel || !VALID_CHANNELS.includes(channel)) {
      return NextResponse.json(
        { error: `channel must be one of: ${VALID_CHANNELS.join(", ")}` },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Update the re_engage_channel in provider_outreach_tracking
    const { error } = await db
      .from("provider_outreach_tracking")
      .update({
        re_engage_channel: channel,
        updated_at: new Date().toISOString(),
      })
      .eq("provider_id", providerId);

    if (error) {
      console.error("[move-channel] Update error:", error);
      return NextResponse.json(
        { error: "Failed to update channel" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, channel });
  } catch (e) {
    console.error("[move-channel] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to move channel" },
      { status: 500 }
    );
  }
}
