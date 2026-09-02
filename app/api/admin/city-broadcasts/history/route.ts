/**
 * GET /api/admin/city-broadcasts/history
 *
 * Returns broadcast history for a specific provider.
 * Shows each broadcast they received with event type and timestamp.
 *
 * Query params:
 *   - provider_id: Provider ID (required)
 *   - limit: Max records to return (default: 20, max: 100)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

interface BroadcastRecord {
  id: string;
  created_at: string;
  event_type: "question_asked" | "profile_published";
  event_city: string;
  event_category: string | null;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get("provider_id");
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

  if (!providerId) {
    return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
  }

  const db = getServiceClient();

  try {
    // Get broadcast recipients for this provider
    const { data: recipients, error: recipientError } = await db
      .from("city_broadcast_recipients")
      .select("id, created_at, event_id, status")
      .eq("provider_id", providerId)
      .eq("status", "sent")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (recipientError) {
      console.error("[city-broadcasts/history] Failed to fetch recipients:", recipientError);
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ history: [] });
    }

    // Get event details for these broadcasts
    const eventIds = [...new Set(recipients.map((r) => r.event_id))];
    const { data: events, error: eventError } = await db
      .from("city_broadcast_events")
      .select("id, event_type, city, category")
      .in("id", eventIds);

    if (eventError) {
      console.error("[city-broadcasts/history] Failed to fetch events:", eventError);
      return NextResponse.json({ error: "Failed to fetch event details" }, { status: 500 });
    }

    const eventMap = new Map(
      (events || []).map((e) => [e.id, e])
    );

    // Build history records
    const history: BroadcastRecord[] = recipients.map((r) => {
      const event = eventMap.get(r.event_id);
      return {
        id: r.id,
        created_at: r.created_at,
        event_type: event?.event_type || "question_asked",
        event_city: event?.city || "Unknown",
        event_category: event?.category || null,
      };
    });

    return NextResponse.json({ history });
  } catch (err) {
    console.error("[city-broadcasts/history] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
