import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  type ProviderOutreachTemplateKey,
  generateTaskSchedule,
  renderEmail,
  buildContextFromProvider,
  validateProviderForOutreach,
  getProviderGaps,
  formatGapList,
  getCityViewsBatch,
  PROVIDER_OUTREACH_CADENCE,
} from "@/lib/provider-outreach";

/**
 * POST /api/admin/provider-outreach/launch-sequence
 *
 * Preview or launch an email sequence for provider(s).
 *
 * Body:
 *   - provider_ids: string[] (required) - List of provider IDs to include
 *   - dry_run: boolean (default: true) - If true, returns preview only; if false, launches sequence
 *
 * Returns (dry_run=true):
 *   - providers: Array of provider previews with rendered emails
 *   - schedule: The cadence schedule (days and template keys)
 *   - summary: Counts of valid/invalid providers
 *
 * Returns (dry_run=false):
 *   - success: boolean
 *   - launched: count of providers whose sequence was started
 *   - failed: count of providers that failed to launch
 *   - launched_providers: array of provider IDs
 *   - failed_providers: array of { provider_id, error }
 *   - schedule: the cadence schedule with due dates
 *
 * When dry_run=false:
 *   1. Moves valid providers to "in_sequence" stage
 *   2. Creates tasks in provider_outreach_tasks table (4 tasks per provider)
 *   3. Logs a sequence_launched touchpoint
 *   4. Cron job picks up due tasks and sends emails
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
    const { provider_ids, dry_run = true, assigned_to } = body;

    // Resolve assigned_to: default to current admin if not specified
    const assignedToId = assigned_to || adminUser.id;

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

    // Ensure all provider_ids are strings
    const validProviderIds = provider_ids.filter((id): id is string => typeof id === "string" && id.length > 0);
    if (validProviderIds.length === 0) {
      return NextResponse.json(
        { error: "No valid provider IDs provided" },
        { status: 400 }
      );
    }

    console.log("[launch-sequence] Fetching providers:", validProviderIds);

    const db = getServiceClient();

    // Fetch provider data including fields needed for gap detection
    // Note: provider_ids are the provider_id column values, not slugs
    const { data: providers, error: fetchError } = await db
      .from("olera-providers")
      .select("provider_id, slug, provider_name, email, city, state, provider_category, lower_price, upper_price, contact_for_price, provider_images, phone, provider_description")
      .in("provider_id", validProviderIds);

    if (fetchError) {
      console.error("Failed to fetch providers:", fetchError);
      return NextResponse.json(
        { error: `Failed to fetch provider data: ${fetchError.message}` },
        { status: 500 }
      );
    }

    // Batch-fetch city views for Day 7 demand-loss email
    // This is more efficient than fetching per-provider
    const cityViewsPairs = (providers || [])
      .filter((p) => p.city)
      .map((p) => ({ city: p.city, category: p.provider_category }));
    const cityViewsMap = await getCityViewsBatch(cityViewsPairs, db);

    // Build previews for each provider
    const previews: ProviderPreview[] = [];
    let validCount = 0;
    let invalidCount = 0;

    for (const providerId of validProviderIds) {
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
        provider_id: providerId,
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

      // Compute profile gaps for Day 3 email
      // Note: hero_image_url column doesn't exist in olera-providers yet
      const gaps = getProviderGaps({
        lower_price: provider.lower_price,
        upper_price: provider.upper_price,
        contact_for_price: provider.contact_for_price,
        provider_images: provider.provider_images,
        phone: provider.phone,
        provider_description: provider.provider_description,
      });
      const gapList = formatGapList(gaps);

      // Get city views for this provider's city+category
      const cityViewsKey = `${provider.city}|${provider.provider_category || ""}`;
      const cityViews = cityViewsMap.get(cityViewsKey) || 0;

      // Build context and render emails
      const context = buildContextFromProvider({
        provider_id: providerId,
        name: provider.provider_name,
        email: provider.email,
        city: provider.city,
        state: provider.state,
        category: provider.provider_category,
        slug: provider.slug,
      }, {
        gap_list: gapList,
        city_views: cityViews,
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

    // If not dry run, launch the sequence for valid providers
    if (!dry_run) {
      const validPreviews = previews.filter((p) => p.valid);

      if (validPreviews.length === 0) {
        return NextResponse.json({
          error: "No valid providers to launch sequence for",
          invalid_count: invalidCount,
        }, { status: 400 });
      }

      // Fetch city owners for inheritance lookup
      // Group providers by state to batch fetch city owners
      const statesInBatch = [...new Set(validPreviews.map((p) => p.state).filter(Boolean))] as string[];
      const cityOwnersMap = new Map<string, { owner_id: string; owner_name: string | null }>();

      if (statesInBatch.length > 0) {
        const { data: cityOwners } = await db
          .from("provider_outreach_city_owners")
          .select("state, city, owner_id, owner_name")
          .in("state", statesInBatch)
          .not("owner_id", "is", null);

        if (cityOwners) {
          for (const co of cityOwners) {
            cityOwnersMap.set(`${co.state}|${co.city}`, {
              owner_id: co.owner_id,
              owner_name: co.owner_name,
            });
          }
        }
      }

      // 1. Get or create tracking records and move to in_sequence
      const launchedProviders: string[] = [];
      const failedProviders: Array<{ provider_id: string; error: string }> = [];

      for (const preview of validPreviews) {
        try {
          // Determine assigned_to with city owner inheritance:
          // 1. If assigned_to was explicitly provided in request, use that
          // 2. If provider's city has an owner, inherit the city owner
          // 3. Otherwise, use the current admin as default
          let effectiveAssignedTo = assignedToId;
          if (!assigned_to && preview.state && preview.city) {
            const cityOwnerKey = `${preview.state}|${preview.city}`;
            const cityOwner = cityOwnersMap.get(cityOwnerKey);
            if (cityOwner) {
              effectiveAssignedTo = cityOwner.owner_id;
            }
          }

          // Check if tracking record exists
          const { data: existingTracking } = await db
            .from("provider_outreach_tracking")
            .select("id, stage, assigned_to")
            .eq("provider_id", preview.provider_id)
            .maybeSingle();

          let trackingId: string;

          if (existingTracking) {
            // Already in sequence? Skip
            if (existingTracking.stage === "in_sequence") {
              failedProviders.push({
                provider_id: preview.provider_id,
                error: "Already in sequence",
              });
              continue;
            }

            // Clean up any stale pending tasks from previous cycle
            // This prevents old Day 14 tasks from firing alongside new Day 0 tasks
            await db
              .from("provider_outreach_tasks")
              .delete()
              .eq("tracking_id", existingTracking.id)
              .eq("status", "pending");

            // For existing records: only update assigned_to if it's currently null
            // This preserves manual assignments while still inheriting city owner for unassigned
            const newAssignedTo = existingTracking.assigned_to || effectiveAssignedTo;

            // Update to in_sequence with fresh sequence_started_at
            // (Can't rely on trigger — it only fires if sequence_started_at IS NULL)
            const { error: updateError } = await db
              .from("provider_outreach_tracking")
              .update({
                stage: "in_sequence",
                sequence_started_at: new Date().toISOString(),
                assigned_to: newAssignedTo,
              })
              .eq("id", existingTracking.id);

            if (updateError) throw updateError;
            trackingId = existingTracking.id;
          } else {
            // Create new tracking record in in_sequence stage
            const { data: newTracking, error: insertError } = await db
              .from("provider_outreach_tracking")
              .insert({
                provider_id: preview.provider_id,
                stage: "in_sequence",
                city: preview.city,
                state: preview.state,
                sequence_started_at: new Date().toISOString(),
                assigned_to: effectiveAssignedTo,
              })
              .select("id")
              .single();

            if (insertError) throw insertError;
            trackingId = newTracking.id;
          }

          // 2. Create tasks for each cadence step
          const taskRows = schedule.map((step) => ({
            tracking_id: trackingId,
            provider_id: preview.provider_id,
            task_type: "outreach_email_send",
            cadence_day: step.day,
            template_key: step.templateKey,
            due_at: step.dueAt.toISOString(),
            status: "pending",
            payload: {
              recipient_email: preview.email,
              provider_name: preview.provider_name,
              city: preview.city,
              state: preview.state,
              category: preview.category,
            },
          }));

          const { error: tasksError } = await db
            .from("provider_outreach_tasks")
            .insert(taskRows);

          if (tasksError) throw tasksError;

          // 3. Log touchpoint (non-fatal - don't fail the sequence if touchpoint fails)
          const { error: touchpointError } = await db.from("provider_outreach_touchpoints").insert({
            provider_id: preview.provider_id,
            touchpoint_type: "sequence_launched",
            admin_user_id: adminUser.id,
            details: {
              email_count: taskRows.length,
              first_due_at: schedule[0].dueAt.toISOString(),
              last_due_at: schedule[schedule.length - 1].dueAt.toISOString(),
            },
          });

          if (touchpointError) {
            // Log but don't fail - tracking and tasks are already created
            console.warn(`[launch-sequence] Failed to log touchpoint for ${preview.provider_id}:`, touchpointError);
          }

          launchedProviders.push(preview.provider_id);
        } catch (err) {
          console.error(`Failed to launch sequence for ${preview.provider_id}:`, err);
          failedProviders.push({
            provider_id: preview.provider_id,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      return NextResponse.json({
        success: true,
        launched: launchedProviders.length,
        failed: failedProviders.length,
        launched_providers: launchedProviders,
        failed_providers: failedProviders,
        schedule: schedule.map((s) => ({
          day: s.day,
          templateKey: s.templateKey,
          dueAt: s.dueAt.toISOString(),
        })),
      });
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
        total: validProviderIds.length,
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
