import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser } from "@/lib/admin";
import {
  type ProviderOutreachTemplateKey,
  renderEmail,
  type TemplateContext,
} from "@/lib/provider-outreach";

/**
 * GET /api/admin/provider-outreach/template-preview
 *
 * Returns a rendered HTML preview of a provider outreach email template.
 *
 * Query params:
 *   - template: string (required) - Template key: intro, followup, demand_loss, final, nudge
 *
 * Returns:
 *   - html: string - Fully rendered HTML email
 *   - subject: string - Email subject line
 *   - template_key: string - The template key
 */

const VALID_TEMPLATES: ProviderOutreachTemplateKey[] = [
  "intro",
  "followup",
  "demand_loss",
  "final",
  "nudge",
];

// Sample context for preview rendering
// NOTE: city_views set to 5 (below threshold of 10) to match SmartLead behavior.
// SmartLead uses generic "Families are searching..." headline since it can't
// conditionally change email body per-lead. Preview should reflect this.
const SAMPLE_CONTEXT: TemplateContext = {
  provider_name: "Sunrise Senior Care",
  city: "Austin",
  state: "TX",
  category: "home care",
  profile_url: "https://olera.care/provider/sunrise-senior-care-austin",
  claim_url: "https://olera.care/claim/sample-token",
  manage_url: "https://olera.care/manage/sample-token",
  remove_url: "https://olera.care/remove/sample-token",
  unsubscribe_url: "https://olera.care/unsubscribe/sample-token",
  mailing_address: "340 S Lemon Ave #1439, Walnut, CA 91789",
  gap_list: "no pricing, no photos, and no description",
  city_views: 5, // Below threshold to show generic headline (matches SmartLead)
};

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
    const template = searchParams.get("template") as ProviderOutreachTemplateKey | null;

    if (!template || !VALID_TEMPLATES.includes(template)) {
      return NextResponse.json(
        { error: `Invalid template. Must be one of: ${VALID_TEMPLATES.join(", ")}` },
        { status: 400 }
      );
    }

    // Render the email with sample context
    const rendered = renderEmail(template, SAMPLE_CONTEXT);

    return NextResponse.json({
      html: rendered.html,
      subject: rendered.subject,
      template_key: template,
    });
  } catch (error) {
    console.error("Error in template-preview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
