import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/re-engage-channel
 *
 * Updates the re_engage_channel for one or more providers.
 * Persists which sub-tab a provider is in (fax, linkedin, direct_mail, etc.)
 *
 * Body: { provider_ids: string[], channel: string }
 */
export const runtime = "nodejs";

const VALID_CHANNELS = [
  "re_engage",
  "fax",
  "linkedin",
  "direct_mail",
  "not_interested",
  "claimed",
  "archived",
];

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
      provider_ids?: string[];
      channel?: string;
    };

    const providerIds = body.provider_ids;
    const channel = body.channel;

    if (!providerIds || providerIds.length === 0 || !channel) {
      return NextResponse.json(
        { error: "provider_ids and channel are required" },
        { status: 400 },
      );
    }

    if (!VALID_CHANNELS.includes(channel)) {
      return NextResponse.json(
        { error: `Invalid channel. Must be one of: ${VALID_CHANNELS.join(", ")}` },
        { status: 400 },
      );
    }

    const db = getServiceClient();

    const { error } = await db
      .from("provider_outreach_tracking")
      .update({ re_engage_channel: channel })
      .in("provider_id", providerIds)
      .eq("stage", "re_engage");

    if (error) {
      console.error("[re-engage-channel] Update error:", error);
      return NextResponse.json({ error: "Failed to update channel" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[re-engage-channel] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Channel update failed" },
      { status: 500 },
    );
  }
}
