import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser } from "@/lib/admin";
import {
  type ProviderOutreachTemplateKey,
  renderEmail,
  type TemplateContext,
} from "@/lib/provider-outreach";
import { buildProviderEmailSequence } from "@/lib/provider-outreach/smartlead-bridge";
import { isSmartleadConfigured } from "@/lib/smartlead";

/**
 * GET /api/admin/provider-outreach/template-preview
 *
 * Returns a rendered HTML preview of a provider outreach email template.
 *
 * Query params:
 *   - template: string (required) - Template key: intro, followup, demand_loss, final, nudge
 *   - engine: "smartlead" | "resend" (optional) - Which rendering engine to use
 *     Defaults to "smartlead" when SmartLead is configured, otherwise "resend"
 *
 * Returns:
 *   - html: string - Fully rendered HTML email
 *   - subject: string - Email subject line
 *   - template_key: string - The template key
 *   - engine: string - Which engine was used for rendering
 *   - smartlead_configured: boolean - Whether SmartLead is configured
 */

const VALID_TEMPLATES: ProviderOutreachTemplateKey[] = [
  "intro",
  "followup",
  "demand_loss",
  "final",
  "nudge",
];

// Map template keys to cadence indices for SmartLead preview
// Note: "nudge" is not in the SmartLead cadence (standalone template)
const TEMPLATE_TO_CADENCE_INDEX: Record<string, number> = {
  intro: 0,
  followup: 1,
  demand_loss: 2,
  final: 3,
};

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
    const engineParam = searchParams.get("engine") as "smartlead" | "resend" | null;

    if (!template || !VALID_TEMPLATES.includes(template)) {
      return NextResponse.json(
        { error: `Invalid template. Must be one of: ${VALID_TEMPLATES.join(", ")}` },
        { status: 400 }
      );
    }

    const smartleadConfigured = isSmartleadConfigured();
    // Default to SmartLead when configured, otherwise Resend
    const engine = engineParam || (smartleadConfigured ? "smartlead" : "resend");

    // Check if this template is in the SmartLead cadence
    const cadenceIndex = TEMPLATE_TO_CADENCE_INDEX[template];
    const canUseSmartlead = cadenceIndex !== undefined;

    // Use SmartLead rendering if requested and available
    if (engine === "smartlead" && canUseSmartlead) {
      const sequence = buildProviderEmailSequence();
      const step = sequence[cadenceIndex];

      if (step) {
        // Substitute sample values into merge tags for preview
        const sampleSubstitutions: Record<string, string> = {
          "{{company_name}}": SAMPLE_CONTEXT.provider_name,
          "{{city}}": SAMPLE_CONTEXT.city || "Austin",
          "{{state}}": SAMPLE_CONTEXT.state || "TX",
          "{{category}}": SAMPLE_CONTEXT.category || "care providers",
          "{{gap_list}}": SAMPLE_CONTEXT.gap_list || "no pricing, no photos, and no description",
          "{{city_views}}": String(SAMPLE_CONTEXT.city_views || 0),
          "{{claim_url}}": SAMPLE_CONTEXT.claim_url,
          "{{profile_url}}": SAMPLE_CONTEXT.profile_url,
          "{{manage_url}}": SAMPLE_CONTEXT.manage_url,
          "{{remove_url}}": SAMPLE_CONTEXT.remove_url,
          "{{unsubscribe_url}}": SAMPLE_CONTEXT.unsubscribe_url,
        };

        let previewHtml = step.email_body;
        let previewSubject = step.subject;
        for (const [tag, value] of Object.entries(sampleSubstitutions)) {
          previewHtml = previewHtml.replace(new RegExp(tag.replace(/[{}]/g, "\\$&"), "g"), value);
          previewSubject = previewSubject.replace(new RegExp(tag.replace(/[{}]/g, "\\$&"), "g"), value);
        }

        return NextResponse.json({
          html: previewHtml,
          subject: previewSubject,
          template_key: template,
          engine: "smartlead",
          smartlead_configured: smartleadConfigured,
        });
      }
    }

    // Fall back to Resend rendering
    const rendered = renderEmail(template, SAMPLE_CONTEXT);

    return NextResponse.json({
      html: rendered.html,
      subject: rendered.subject,
      template_key: template,
      engine: "resend",
      smartlead_configured: smartleadConfigured,
    });
  } catch (error) {
    console.error("Error in template-preview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
