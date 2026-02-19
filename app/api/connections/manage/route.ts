import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAdminClient(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

type Action = "archive" | "unarchive" | "delete" | "report";

/**
 * POST /api/connections/manage
 *
 * Manages inbox connection lifecycle: archive, unarchive, delete (soft), report.
 * Uses the admin client to bypass RLS.
 *
 * NOTE: Archive state is stored in metadata.archived = true rather than
 * changing the status column, because the DB CHECK constraint only allows
 * 'pending', 'accepted', 'declined', 'expired'. The client treats connections
 * with metadata.archived = true as archived in the UI.
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
    const { connectionId, action, reportReason, reportDetails } = body as {
      connectionId: string;
      action: Action;
      reportReason?: string;
      reportDetails?: string;
    };

    if (!connectionId || !action) {
      return NextResponse.json(
        { error: "connectionId and action are required" },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get all user profiles for authorization
    const { data: account } = await admin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const { data: profiles } = await admin
      .from("business_profiles")
      .select("id")
      .eq("account_id", account.id);

    const profileIds = (profiles || []).map((p: { id: string }) => p.id);

    // Fetch the connection
    const { data: connection, error: fetchError } = await admin
      .from("connections")
      .select("id, from_profile_id, to_profile_id, status, metadata")
      .eq("id", connectionId)
      .single();

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Must be a participant
    if (
      !profileIds.includes(connection.from_profile_id) &&
      !profileIds.includes(connection.to_profile_id)
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const existingMeta =
      (connection.metadata as Record<string, unknown>) || {};

    // Determine the acting profile (whichever of the user's profiles is on this connection)
    const actingProfileId = profileIds.includes(connection.from_profile_id)
      ? connection.from_profile_id
      : connection.to_profile_id;

    switch (action) {
      case "archive": {
        // Store archive state in metadata — do NOT change status (DB CHECK constraint
        // only allows pending/accepted/declined/expired, not archived).
        const { error: updateError } = await admin
          .from("connections")
          .update({
            metadata: {
              ...existingMeta,
              archived: true,
              archived_from_status: connection.status,
            },
          })
          .eq("id", connectionId);

        if (updateError) {
          console.error("[manage] archive error:", updateError);
          return NextResponse.json({ error: "Failed to archive" }, { status: 500 });
        }
        return NextResponse.json({ status: "archived" });
      }

      case "unarchive": {
        const restoreStatus = (existingMeta.archived_from_status as string) || "accepted";
        // Remove archived flags from metadata, status never changed so nothing to restore
        const cleanMeta: Record<string, unknown> = { ...existingMeta };
        delete cleanMeta.archived;
        delete cleanMeta.archived_from_status;

        const { error: updateError } = await admin
          .from("connections")
          .update({ metadata: cleanMeta })
          .eq("id", connectionId);

        if (updateError) {
          console.error("[manage] unarchive error:", updateError);
          return NextResponse.json({ error: "Failed to unarchive" }, { status: 500 });
        }
        return NextResponse.json({ status: restoreStatus });
      }

      case "delete": {
        const { error: updateError } = await admin
          .from("connections")
          .update({
            metadata: { ...existingMeta, hidden: true },
          })
          .eq("id", connectionId);

        if (updateError) {
          console.error("[manage] delete error:", updateError);
          return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
        }
        return NextResponse.json({ status: "hidden" });
      }

      case "report": {
        // Store report + archive state in metadata only — do NOT change status
        const reportMeta = {
          ...existingMeta,
          archived: true,
          archived_from_status: connection.status,
          reported: true,
          reported_at: new Date().toISOString(),
          reported_by: actingProfileId,
          report_reason: reportReason || null,
          report_details: reportDetails || null,
        };

        const { error: updateError } = await admin
          .from("connections")
          .update({ metadata: reportMeta })
          .eq("id", connectionId);

        if (updateError) {
          console.error("[manage] report error:", updateError);
          return NextResponse.json({ error: "Failed to report" }, { status: 500 });
        }
        return NextResponse.json({ status: "reported" });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err) {
    console.error("[manage] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
