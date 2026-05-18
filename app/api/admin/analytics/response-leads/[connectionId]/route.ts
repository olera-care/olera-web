import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/analytics/response-leads/[connectionId]
 *
 * Returns full details of a lead including the complete conversation thread.
 * Used for the conversation drawer in the admin analytics page.
 */

interface ThreadMessage {
  from_profile_id: string;
  text?: string;
  created_at: string;
  is_auto_reply?: boolean;
}

interface ConnectionDetail {
  connection_id: string;
  created_at: string;
  type: string;
  status: string;
  // Family info
  family: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
  };
  // Provider info
  provider: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    slug: string;
    city: string | null;
    state: string | null;
  };
  // Original inquiry message (parsed from JSON)
  inquiry: {
    message: string | null;
    care_recipient: string | null;
    care_type: string | null;
    urgency: string | null;
  };
  // Full conversation thread
  thread: Array<{
    id: string;
    from: "family" | "provider";
    from_name: string;
    text: string;
    created_at: string;
    is_auto_reply: boolean;
  }>;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  const { connectionId } = await params;

  // Admin auth check
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await getAdminUser(user.id);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getServiceClient();

  // Fetch the connection with full profile data
  const { data: connection, error: fetchError } = await db
    .from("connections")
    .select(
      `
      id,
      type,
      status,
      message,
      metadata,
      created_at,
      from_profile:business_profiles!connections_from_profile_id_fkey(
        id,
        display_name,
        email,
        phone,
        city,
        state
      ),
      to_profile:business_profiles!connections_to_profile_id_fkey(
        id,
        display_name,
        email,
        phone,
        slug,
        city,
        state
      )
    `
    )
    .eq("id", connectionId)
    .single();

  if (fetchError || !connection) {
    console.error("[response-leads/[connectionId]] Fetch error:", fetchError);
    return NextResponse.json(
      { error: "Connection not found" },
      { status: 404 }
    );
  }

  // Normalize joined relations
  const fromProfile = Array.isArray(connection.from_profile)
    ? connection.from_profile[0]
    : connection.from_profile;
  const toProfile = Array.isArray(connection.to_profile)
    ? connection.to_profile[0]
    : connection.to_profile;

  // Parse the original inquiry message
  let inquiry = {
    message: null as string | null,
    care_recipient: null as string | null,
    care_type: null as string | null,
    urgency: null as string | null,
  };

  if (connection.message) {
    try {
      const msgJson = JSON.parse(String(connection.message));
      inquiry = {
        message: msgJson.additional_notes || msgJson.message || msgJson.notes || null,
        care_recipient: msgJson.care_recipient || null,
        care_type: msgJson.care_type || null,
        urgency: msgJson.urgency || null,
      };
    } catch {
      // Legacy format - use as-is
      inquiry.message = String(connection.message);
    }
  }

  // Extract and format the thread
  const meta = (connection.metadata as Record<string, unknown>) ?? {};
  const rawThread = (meta.thread as ThreadMessage[]) || [];

  const familyId = fromProfile?.id || "";
  const providerId = toProfile?.id || "";
  const familyName = fromProfile?.display_name || "Care Seeker";
  const providerName = toProfile?.display_name || "Provider";

  const thread = rawThread.map((msg, index) => {
    const isFamily = msg.from_profile_id === familyId;
    return {
      id: `${connectionId}-${index}`,
      from: (isFamily ? "family" : "provider") as "family" | "provider",
      from_name: isFamily ? familyName : providerName,
      text: msg.text || "",
      created_at: msg.created_at,
      is_auto_reply: msg.is_auto_reply === true,
    };
  });

  const result: ConnectionDetail = {
    connection_id: connection.id,
    created_at: connection.created_at,
    type: connection.type,
    status: connection.status,
    family: {
      id: familyId,
      name: familyName,
      email: fromProfile?.email || null,
      phone: fromProfile?.phone || null,
      city: fromProfile?.city || null,
      state: fromProfile?.state || null,
    },
    provider: {
      id: providerId,
      name: providerName,
      email: toProfile?.email || null,
      phone: toProfile?.phone || null,
      slug: toProfile?.slug || "",
      city: toProfile?.city || null,
      state: toProfile?.state || null,
    },
    inquiry,
    thread,
  };

  return NextResponse.json(result);
}
