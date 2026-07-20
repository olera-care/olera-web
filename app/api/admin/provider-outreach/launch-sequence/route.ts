import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  type ProviderOutreachTemplateKey,
  generateTaskSchedule,
  renderEmail,
  buildContextFromProvider,
  validateProviderForOutreach,
  PROVIDER_OUTREACH_CADENCE,
} from "@/lib/provider-outreach";

/**
 * POST /api/admin/provider-outreach/launch-sequence
 *
 * Preview or launch an email sequence for provider(s).
 *
 * Body:
 *   - provider_ids: string[] (required) - List of provider IDs to include
 *   - dry_run: boolean (default: true) - If true, returns preview only; if false, would send emails
 *
 * Returns:
 *   - providers: Array of provider previews with rendered emails
 *   - schedule: The cadence schedule (days and template keys)
 *   - summary: Counts of valid/invalid providers
 *
 * NOTE: This is currently a preview-only endpoint. Email sending is NOT implemented.
 * When dry_run=false is implemented, it will:
 *   1. Move providers to "in_sequence" stage
 *   2. Create tasks in provider_outreach_tasks table
 *   3. Cron job will pick up due tasks and send emails
 */

interface ProviderPreview {
  provider_id: string;
  provider_name: string;
  email: string | null;
  city: string | null;
  state: string | null;
  category: string | null;
  valid: boolean;
  errors: string[];
  emails: Array<{
    day: number;
    templateKey: ProviderOutreachTemplateKey;
    subject: string;
    bodyPreview: string; // First 200 chars of plain text body
    html: string; // Full rendered HTML for preview
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { provider_ids, dry_run = true } = body;

    if (!provider_ids || !Array.isArray(provider_ids) || provider_ids.length === 0) {
      return NextResponse.json(
        { error: "provider_ids array is required" },
        { status: 400 }
      );
    }

    if (provider_ids.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 providers per batch" },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Fetch provider data
    // Note: provider_ids are the provider_id column values, not slugs
    const { data: providers, error: fetchError } = await db
      .from("olera-providers")
      .select("provider_id, slug, provider_name, email, city, state, provider_category")
      .in("provider_id", provider_ids);

    if (fetchError) {
      console.error("Failed to fetch providers:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch provider data" },
        { status: 500 }
      );
    }

    // Build previews for each provider
    const previews: ProviderPreview[] = [];
    let validCount = 0;
    let invalidCount = 0;

    for (const providerId of provider_ids) {
      const provider = providers?.find((p) => p.provider_id === providerId);

      if (!provider) {
        previews.push({
          provider_id: providerId,
          provider_name: providerId,
          email: null,
          city: null,
          state: null,
          category: null,
          valid: false,
          errors: ["Provider not found"],
          emails: [],
        });
        invalidCount++;
        continue;
      }

      // Validate provider has required data
      const validation = validateProviderForOutreach({
        name: provider.provider_name,
        email: provider.email,
        city: provider.city,
        state: provider.state,
        slug: provider.slug,
      });

      if (!validation.valid) {
        previews.push({
          provider_id: providerId,
          provider_name: provider.provider_name || providerId,
          email: provider.email,
          city: provider.city,
          state: provider.state,
          category: provider.provider_category,
          valid: false,
          errors: validation.errors,
          emails: [],
        });
        invalidCount++;
        continue;
      }

      // Build context and render emails
      const context = buildContextFromProvider({
        name: provider.provider_name,
        city: provider.city,
        state: provider.state,
        category: provider.provider_category,
        slug: provider.slug,
      });

      const emails: ProviderPreview["emails"] = [];

      for (const step of PROVIDER_OUTREACH_CADENCE) {
        const rendered = renderEmail(step.templateKey, context);
        emails.push({
          day: step.day,
          templateKey: step.templateKey,
          subject: rendered.subject,
          bodyPreview: rendered.text.substring(0, 200) + "...",
          html: rendered.html,
        });
      }

      previews.push({
        provider_id: providerId,
        provider_name: provider.provider_name,
        email: provider.email,
        city: provider.city,
        state: provider.state,
        category: provider.provider_category,
        valid: true,
        errors: [],
        emails,
      });
      validCount++;
    }

    // Generate schedule info
    const now = new Date();
    const schedule = generateTaskSchedule(now);

    // If not dry run, we would create tasks here
    // For now, always return preview-only
    if (!dry_run) {
      // TODO: Implement actual launch
      // 1. Move providers to "in_sequence" stage via update-stage
      // 2. Create tasks in provider_outreach_tasks
      // 3. Cron job picks up due tasks and sends via Resend
      //
      // For now, return a message that this is not yet implemented
      return NextResponse.json({
        error: "Email sending is not yet implemented. Use dry_run=true for preview.",
        preview_available: true,
      }, { status: 501 });
    }

    return NextResponse.json({
      dry_run: true,
      providers: previews,
      schedule: schedule.map((s) => ({
        day: s.day,
        templateKey: s.templateKey,
        dueAt: s.dueAt.toISOString(),
      })),
      summary: {
        total: provider_ids.length,
        valid: validCount,
        invalid: invalidCount,
      },
      cadence: PROVIDER_OUTREACH_CADENCE.map((step) => ({
        day: step.day,
        templateKey: step.templateKey,
        description: step.description,
      })),
    });
  } catch (error) {
    console.error("Error in launch-sequence:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/provider-outreach/launch-sequence
 *
 * Returns the cadence configuration for reference.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      cadence: PROVIDER_OUTREACH_CADENCE.map((step) => ({
        day: step.day,
        templateKey: step.templateKey,
        description: step.description,
      })),
      note: "POST with provider_ids array to preview emails for specific providers",
    });
  } catch (error) {
    console.error("Error in launch-sequence GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
