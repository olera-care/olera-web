import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const VALID_EVENT_TYPES = [
  "email_click",
  "page_view",
  "lead_opened",
  "question_responded",
  "review_viewed",
] as const;

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * POST /api/activity/track
 *
 * Log a provider engagement event. Called from client-side when
 * a provider lands on the site from an email link.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      provider_id,
      profile_id,
      event_type,
      email_log_id,
      email_type,
      metadata,
    } = body;

    if (!provider_id || !event_type) {
      return NextResponse.json(
        { error: "provider_id and event_type are required" },
        { status: 400 }
      );
    }

    if (!VALID_EVENT_TYPES.includes(event_type)) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const db = getServiceDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const { error } = await db.from("provider_activity").insert({
      provider_id,
      profile_id: profile_id || null,
      event_type,
      email_log_id: email_log_id || null,
      email_type: email_type || null,
      metadata: metadata || {},
    });

    if (error) {
      console.error("[activity/track] Insert failed:", error);
      return NextResponse.json(
        { error: "Failed to log activity" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[activity/track] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
