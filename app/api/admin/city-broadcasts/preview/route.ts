/**
 * GET /api/admin/city-broadcasts/preview
 *
 * Preview a broadcast email for a specific provider.
 * Returns rendered HTML, subject, and preheader without sending.
 *
 * Query params:
 *   - provider_id: Provider ID (required)
 *   - event_type: "question_asked" or "profile_published" (required)
 *   - question_text: Optional question text for question broadcasts
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  renderQuestionBroadcast,
  renderProfileBroadcast,
  type BroadcastTemplateContext,
} from "@/lib/city-broadcasts/templates";

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
  const eventType = searchParams.get("event_type") as "question_asked" | "profile_published" | null;
  const questionText = searchParams.get("question_text") || undefined;

  if (!providerId) {
    return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
  }
  if (!eventType || !["question_asked", "profile_published"].includes(eventType)) {
    return NextResponse.json({ error: "event_type must be 'question_asked' or 'profile_published'" }, { status: 400 });
  }

  const db = getServiceClient();

  try {
    // Fetch provider details
    const { data: provider, error: providerError } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, slug, city, state, provider_category, email")
      .eq("provider_id", providerId)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Get email from tracking (apollo_contact) or provider record
    const { data: tracking } = await db
      .from("provider_outreach_tracking")
      .select("apollo_contact")
      .eq("provider_id", providerId)
      .single();

    const apolloContact = tracking?.apollo_contact as { email?: string } | null;
    const email = apolloContact?.email || provider.email;

    if (!email) {
      return NextResponse.json({ error: "Provider has no email address" }, { status: 400 });
    }

    // Build template context
    const ctx: BroadcastTemplateContext = {
      providerId: provider.provider_id,
      providerName: provider.provider_name || "Provider",
      providerSlug: provider.slug || "",
      providerEmail: email,
      city: provider.city || "Unknown",
      category: provider.provider_category,
      questionText: eventType === "question_asked" ? questionText : undefined,
    };

    // Render the appropriate template
    const rendered = eventType === "question_asked"
      ? renderQuestionBroadcast(ctx)
      : renderProfileBroadcast(ctx);

    return NextResponse.json({
      provider: {
        id: provider.provider_id,
        name: provider.provider_name,
        email,
        city: provider.city,
        state: provider.state,
        category: provider.provider_category,
      },
      email: {
        subject: rendered.subject,
        preheader: rendered.preheader,
        html: rendered.html,
      },
    });
  } catch (err) {
    console.error("[city-broadcasts/preview] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
