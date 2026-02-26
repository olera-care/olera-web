import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";

/**
 * POST /api/connections/respond-interest
 *
 * Handles care seeker actions on provider-initiated interest (type="request" + metadata.provider_initiated):
 * - "view"        → marks the card as viewed (removes blue dot)
 * - "accept"      → accepts the provider, creates a mutual connection
 * - "decline"     → declines the provider (can be reconsidered)
 * - "reconsider"  → moves a declined provider back to pending
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { connectionId, action } = body as {
      connectionId: string;
      action: "view" | "accept" | "decline" | "reconsider";
    };

    if (!connectionId || !action) {
      return NextResponse.json(
        { error: "Missing connectionId or action" },
        { status: 400 }
      );
    }

    // Service role client bypasses RLS — needed because the care seeker is
    // `to_profile_id` (recipient), but the RLS UPDATE policy on connections
    // only allows updates when the user owns `from_profile_id` (sender).
    const admin = getServiceClient();

    // Get user's active profile
    const { data: account } = await admin
      .from("accounts")
      .select("active_profile_id")
      .eq("user_id", user.id)
      .single();

    if (!account?.active_profile_id) {
      return NextResponse.json(
        { error: "No active profile" },
        { status: 400 }
      );
    }

    // Fetch the connection and verify ownership
    const { data: connection, error: connError } = await admin
      .from("connections")
      .select("id, type, status, from_profile_id, to_profile_id, metadata")
      .eq("id", connectionId)
      .single();

    if (connError || !connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Verify this is a provider-initiated request directed at the current user
    const connMeta = (connection.metadata || {}) as Record<string, unknown>;
    if (connection.type !== "request" || !connMeta.provider_initiated) {
      return NextResponse.json(
        { error: "Not a provider-initiated request" },
        { status: 400 }
      );
    }

    if (connection.to_profile_id !== account.active_profile_id) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const currentMeta = (connection.metadata || {}) as Record<string, unknown>;

    // ── Handle each action ──

    if (action === "view") {
      const { error: updateError } = await admin
        .from("connections")
        .update({
          metadata: { ...currentMeta, viewed: true },
        })
        .eq("id", connectionId);

      if (updateError) {
        console.error("[respond-interest] view update failed:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "accept") {
      // Build auto-intro from care seeker's profile
      let autoIntro: string | null = null;
      try {
        const [{ data: seekerProfile }, { data: providerProfile }] =
          await Promise.all([
            admin
              .from("business_profiles")
              .select("care_types, metadata, display_name")
              .eq("id", connection.to_profile_id)
              .single(),
            admin
              .from("business_profiles")
              .select("care_types, display_name")
              .eq("id", connection.from_profile_id)
              .single(),
          ]);

        const seekerMeta = (seekerProfile?.metadata || {}) as Record<
          string,
          string | undefined
        >;
        const seekerCareTypes: string[] = seekerProfile?.care_types || [];
        const providerCareTypes: string[] = providerProfile?.care_types || [];
        const providerName = providerProfile?.display_name || "the provider";

        // Pick most relevant care type
        const matchedType = seekerCareTypes.find((ct) =>
          providerCareTypes.some(
            (pct) => pct.toLowerCase() === ct.toLowerCase()
          )
        );
        const careType = matchedType || seekerCareTypes[0] || null;

        // Build message: "[Provider Name] is interested in connecting with you about your care needs."
        autoIntro = `${providerName} is interested in connecting with you about your ${careType ? careType.toLowerCase() + " " : ""}care needs.`;
      } catch {
        // Non-blocking
      }

      // Update status to accepted
      const { error: acceptError } = await admin
        .from("connections")
        .update({
          status: "accepted",
          metadata: {
            ...currentMeta,
            viewed: true,
            accepted_at: new Date().toISOString(),
            ...(autoIntro ? { auto_intro: autoIntro } : {}),
            // Mark as provider-initiated for display in Connected tab
            provider_initiated: true,
          },
        })
        .eq("id", connectionId);

      if (acceptError) {
        console.error("[respond-interest] accept update failed:", acceptError);
        return NextResponse.json({ error: acceptError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, connectionId });
    }

    if (action === "decline") {
      const { error: declineError } = await admin
        .from("connections")
        .update({
          status: "declined",
          metadata: {
            ...currentMeta,
            viewed: true,
            declined_at: new Date().toISOString(),
          },
        })
        .eq("id", connectionId);

      if (declineError) {
        console.error("[respond-interest] decline update failed:", declineError);
        return NextResponse.json({ error: declineError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "reconsider") {
      // Move back to pending, clear declined_at
      const { declined_at, ...restMeta } = currentMeta as Record<string, unknown> & { declined_at?: unknown };
      const { error: reconsiderError } = await admin
        .from("connections")
        .update({
          status: "pending",
          metadata: { ...restMeta, viewed: true },
        })
        .eq("id", connectionId);

      if (reconsiderError) {
        console.error("[respond-interest] reconsider update failed:", reconsiderError);
        return NextResponse.json({ error: reconsiderError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Respond interest error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
