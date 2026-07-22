import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/send-first-email
 *
 * Records that the first outreach email was sent for a provider.
 * Moves the provider stage to "outreach_live".
 *
 * Body: { provider_id, provider_name, email, provider_category?, city?, state? }
 *
 * For now this records the send event. When Smartlead or another
 * email tool is integrated, this endpoint will also trigger the
 * actual email delivery and sequence enrollment.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { provider_id, email } = body;

  if (!provider_id || !email) {
    return NextResponse.json({ error: "Missing provider_id or email" }, { status: 400 });
  }

  const db = getServiceClient();

  // Try updating provider_outreach if it exists
  const { error: testErr } = await db.from("provider_outreach").select("id").limit(1);

  if (!testErr) {
    const { error: updateErr } = await db
      .from("provider_outreach")
      .update({
        status: "in_sequence",
        sequence_status: "active",
        sequence_step: 1,
        first_email_sent_at: new Date().toISOString(),
        lead_score: "silent",
        updated_at: new Date().toISOString(),
      })
      .eq("provider_id", provider_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
  }

  // TODO: integrate with Smartlead or email sending service
  // For now, the send is recorded but the actual email delivery
  // is manual or handled by a separate tool.

  return NextResponse.json({
    ok: true,
    provider_id,
    email,
    stage: "outreach_live",
    pipeline: !testErr ? "updated" : "pending_migration",
    note: "Email send recorded. Actual delivery pending email tool integration.",
  });
}
