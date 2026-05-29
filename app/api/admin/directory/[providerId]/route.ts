import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendDeferredNotificationsForProvider } from "@/lib/admin/send-deferred-notifications";
import { generateProviderSlug } from "@/lib/slugify";
import { classifyDeletionReason } from "@/lib/classify-deletion-reason";

const EDITABLE_FIELDS = new Set([
  "provider_name",
  "provider_category",
  "main_category",
  "provider_description",
  "phone",
  "email",
  "website",
  "address",
  "city",
  "state",
  "zipcode",
  "lat",
  "lon",
  "place_id",
  "lower_price",
  "upper_price",
  "contact_for_price",
  "google_rating",
  "provider_logo",
  "provider_images",
  "hero_image_url",
  "deleted",
]);

/**
 * GET /api/admin/directory/[providerId]
 *
 * Full provider detail with image metadata.
 *
 * The URL `[providerId]` accepts ANY of four identifier shapes admin pages emit:
 *
 *   1. `olera-providers.provider_id` — directory list of scraped providers
 *      (e.g. "north-lauderdale-fl-0040", "QX76ebM")
 *   2. `olera-providers.slug` — analytics page_view-keyed tables
 *      (e.g. "sarahcare-of-coral-springs-adult-day-care-north-lauderdale-fl")
 *   3. `business_profiles.id` (UUID) — directory list of user-created (BP-only) rows
 *   4. `business_profiles.slug` — analytics leads table for BP-anchored providers
 *
 * Resolved into one of two response shapes:
 *
 *   - `source: "scraped"` — an olera-providers row exists (either directly or
 *     via a BP's source_provider_id link). `provider` carries the full
 *     olera-providers shape (matches `DirectoryProvider`).
 *   - `source: "user-created"` — only a BP row exists, no OP link. `provider`
 *     carries the BP shape (display_name, slug, contact info, etc.) — NOT the
 *     olera-providers shape. The admin page renders a stripped-down "lite" view.
 *     PATCH handler does not support user-created providers; they stay read-only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { providerId: urlParam } = await params;
    const db = getServiceClient();

    // ── Step 1: try the four input shapes, in order, until one resolves ──

    type OpRow = Record<string, unknown> & { provider_id: string };
    type BpRow = Record<string, unknown> & { id: string; source_provider_id: string | null };

    let opRow: OpRow | null = null;
    let bpRow: BpRow | null = null;

    // 1a. olera-providers by provider_id
    {
      const { data } = await db
        .from("olera-providers")
        .select("*")
        .eq("provider_id", urlParam)
        .maybeSingle();
      if (data) opRow = data as OpRow;
    }

    // 1b. olera-providers by slug
    if (!opRow) {
      const { data } = await db
        .from("olera-providers")
        .select("*")
        .eq("slug", urlParam)
        .maybeSingle();
      if (data) opRow = data as OpRow;
    }

    // 1c. business_profiles by id (UUID) — Supabase returns {error} (not throws)
    //     for invalid UUID syntax, so this is safe to call with non-UUID input.
    if (!opRow) {
      const { data } = await db
        .from("business_profiles")
        .select("*")
        .eq("id", urlParam)
        .maybeSingle();
      if (data) bpRow = data as BpRow;
    }

    // 1d. business_profiles by slug
    if (!opRow && !bpRow) {
      const { data } = await db
        .from("business_profiles")
        .select("*")
        .eq("slug", urlParam)
        .maybeSingle();
      if (data) bpRow = data as BpRow;
    }

    // If a BP row resolved AND it's claim-linked to an OP, re-fetch the OP and
    // treat as scraped — admins editing a claimed listing want the full surface.
    if (!opRow && bpRow && bpRow.source_provider_id) {
      const { data } = await db
        .from("olera-providers")
        .select("*")
        .eq("provider_id", bpRow.source_provider_id)
        .maybeSingle();
      if (data) opRow = data as OpRow;
    }

    // ── Step 2: respond based on what resolved ──

    if (opRow) {
      const canonicalId = opRow.provider_id;

      // Get classified image metadata (keyed on canonical provider_id)
      let images: Record<string, unknown>[] = [];
      try {
        const { data, error: imagesError } = await db
          .from("provider_image_metadata")
          .select("*")
          .eq("provider_id", canonicalId)
          .order("quality_score", { ascending: false });

        if (!imagesError && data) {
          images = data;
        }
      } catch {
        // Table may not exist yet
      }

      // Parse raw images from the provider record
      const rawImages: string[] = [];
      if (opRow.provider_logo) {
        rawImages.push(opRow.provider_logo as string);
      }
      if (opRow.provider_images) {
        const parsed = (opRow.provider_images as string)
          .split(" | ")
          .map((u: string) => u.trim())
          .filter(Boolean);
        for (const url of parsed) {
          if (url !== opRow.provider_logo) rawImages.push(url);
        }
      }

      // Fetch linked business_profiles record for owner/staff metadata
      let staffData = null;
      let businessProfileId: string | null = bpRow?.id ?? null;
      if (!businessProfileId) {
        const { data } = await db
          .from("business_profiles")
          .select("id, metadata")
          .eq("source_provider_id", canonicalId)
          .limit(1)
          .maybeSingle();
        if (data) {
          businessProfileId = data.id;
          const meta = (data.metadata || {}) as Record<string, unknown>;
          staffData = meta.staff || null;
        }
      } else if (bpRow) {
        const meta = (bpRow.metadata || {}) as Record<string, unknown>;
        staffData = meta.staff || null;
      }

      return NextResponse.json({
        provider: opRow,
        images,
        rawImages,
        staffData,
        businessProfileId,
        source: "scraped",
      });
    }

    if (bpRow) {
      const meta = (bpRow.metadata || {}) as Record<string, unknown>;
      return NextResponse.json({
        provider: bpRow,
        images: [],
        rawImages: [],
        staffData: meta.staff || null,
        businessProfileId: bpRow.id,
        source: "user-created",
      });
    }

    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  } catch (err) {
    console.error("Directory detail error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/directory/[providerId]
 *
 * Update provider fields with allowlist + audit logging.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { providerId } = await params;
    const body = await request.json();
    const db = getServiceClient();

    // Handle staff/owner update separately (stored in business_profiles.metadata)
    if (body._staff !== undefined) {
      let bp = await db
        .from("business_profiles")
        .select("id, metadata")
        .eq("source_provider_id", providerId)
        .limit(1)
        .maybeSingle()
        .then(r => r.data);

      // Auto-create business_profiles record if none exists
      if (!bp) {
        const { data: iosProvider } = await db
          .from("olera-providers")
          .select("provider_name, provider_category, city, state, address, zipcode, phone, email, website, provider_description, provider_logo")
          .eq("provider_id", providerId)
          .single();

        if (!iosProvider) {
          return NextResponse.json({ error: "Provider not found" }, { status: 404 });
        }

        const slug = generateProviderSlug(iosProvider.provider_name, iosProvider.state) + `-${providerId.slice(0, 4).toLowerCase()}`;

        const { data: newBp, error: createErr } = await db
          .from("business_profiles")
          .insert({
            source_provider_id: providerId,
            slug,
            type: "organization",
            category: iosProvider.provider_category || "Assisted Living",
            display_name: iosProvider.provider_name,
            description: iosProvider.provider_description || null,
            image_url: iosProvider.provider_logo || null,
            phone: iosProvider.phone || null,
            email: iosProvider.email || null,
            website: iosProvider.website || null,
            address: iosProvider.address || null,
            city: iosProvider.city || null,
            state: iosProvider.state || null,
            zip: iosProvider.zipcode ? String(iosProvider.zipcode) : null,
            metadata: { staff: body._staff },
            claim_state: "unclaimed",
            is_active: true,
          })
          .select("id, metadata")
          .single();

        if (createErr || !newBp) {
          console.error("Failed to create business_profiles record:", createErr);
          return NextResponse.json({ error: "Failed to create profile for staff data" }, { status: 500 });
        }

        bp = newBp;

        await logAuditAction({
          adminUserId: adminUser.id,
          action: "auto_create_business_profile",
          targetType: "directory_provider",
          targetId: providerId,
          details: { business_profile_id: bp.id, slug },
        });

        // Staff was already set during insert, so we can return early
        await logAuditAction({
          adminUserId: adminUser.id,
          action: "update_provider_staff",
          targetType: "directory_provider",
          targetId: providerId,
          details: { staff: body._staff },
        });

        return NextResponse.json({ success: true });
      }

      const existingMeta = (bp.metadata || {}) as Record<string, unknown>;
      const { error: staffErr } = await db
        .from("business_profiles")
        .update({ metadata: { ...existingMeta, staff: body._staff } })
        .eq("id", bp.id);

      if (staffErr) {
        return NextResponse.json({ error: "Failed to update staff data" }, { status: 500 });
      }

      await logAuditAction({
        adminUserId: adminUser.id,
        action: "update_provider_staff",
        targetType: "directory_provider",
        targetId: providerId,
        details: { staff: body._staff },
      });

      return NextResponse.json({ success: true });
    }

    // Extract delete reason (not a DB field, used for audit only)
    const deleteReason = typeof body._delete_reason === "string" ? body._delete_reason.trim() : null;

    // Filter to only allowed fields
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (EDITABLE_FIELDS.has(key)) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Fetch current state for audit diff
    const { data: current, error: fetchError } = await db
      .from("olera-providers")
      .select("*")
      .eq("provider_id", providerId)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Auto-set deleted_at + deletion_reason when deleted changes
    if ("deleted" in updates) {
      if (updates.deleted === true && !current.deleted) {
        updates.deleted_at = new Date().toISOString();
        updates.deletion_reason = classifyDeletionReason(deleteReason);
      } else if (!updates.deleted && current.deleted) {
        updates.deleted_at = null;
        updates.deletion_reason = null;
      }
    }

    // Apply update
    const { error: updateError } = await db
      .from("olera-providers")
      .update(updates)
      .eq("provider_id", providerId);

    if (updateError) {
      console.error("Directory update error:", updateError);
      return NextResponse.json({ error: "Failed to update provider" }, { status: 500 });
    }

    // Cascade the deleted flip to any linked business_profiles. Without this,
    // a claimed BP keeps `is_active=true` and the city-page BP query + the
    // provider-detail BP fallback continue surfacing the listing publicly —
    // the admin UI hides it, but the public site doesn't. With the BP
    // deactivated, the provider-detail soft-deleted redirect path fires
    // (preserves SEO equity via 301 to the power page).
    // Gated on an actual flip (mirroring the deleted_at block above) so
    // future idempotent payloads can't overwrite an intentional is_active.
    let cascadeTarget: boolean | null = null;
    if (updates.deleted === true && !current.deleted) cascadeTarget = false;
    else if (!updates.deleted && current.deleted) cascadeTarget = true;
    if (cascadeTarget !== null) {
      const { error: cascadeError } = await db
        .from("business_profiles")
        .update({ is_active: cascadeTarget })
        .eq("source_provider_id", providerId);
      if (cascadeError) {
        console.error("Directory delete cascade to business_profiles failed:", cascadeError);
      }
    }

    // Build audit diff
    const changedFields: Record<string, { from: unknown; to: unknown }> = {};
    for (const [key, value] of Object.entries(updates)) {
      const currentVal = current[key as keyof typeof current];
      if (currentVal !== value) {
        changedFields[key] = { from: currentVal, to: value };
      }
    }

    if (Object.keys(changedFields).length > 0) {
      await logAuditAction({
        adminUserId: adminUser.id,
        action: "update_directory_provider",
        targetType: "directory_provider",
        targetId: providerId,
        details: {
          provider_name: current.provider_name,
          changed_fields: changedFields,
          ...(deleteReason ? { delete_reason: deleteReason } : {}),
        },
      });
    }

    // If email was added (empty → non-empty), send deferred notifications for leads AND questions
    const emailAdded = "email" in updates
      && updates.email
      && !current.email;

    if (emailAdded) {
      try {
        const newEmail = updates.email as string;
        console.log("[deferred-email] Email added for provider:", providerId, "→", newEmail);

        // Sync email to business_profiles so future connections aren't flagged
        const { error: syncErr } = await db
          .from("business_profiles")
          .update({ email: newEmail })
          .eq("source_provider_id", providerId);
        console.log("[deferred-email] business_profiles sync:", syncErr ? `ERROR: ${syncErr.message}` : "OK");

        // Find linked business_profile
        const { data: bp } = await db
          .from("business_profiles")
          .select("id, slug, metadata")
          .eq("source_provider_id", providerId)
          .limit(1)
          .maybeSingle();

        // Use the shared function to send deferred notifications
        const profileMeta = (bp?.metadata as Record<string, unknown>) || {};
        const providerSlug = bp?.slug || current.slug || providerId;

        // Build additional slug variants for question lookup
        // Questions may be stored with different provider_id values
        const additionalSlugVariants: string[] = [];
        // Always include the olera-providers provider_id
        if (providerId !== providerSlug) {
          additionalSlugVariants.push(providerId);
        }
        // Include olera-providers slug if different
        if (current.slug && current.slug !== providerSlug && current.slug !== providerId) {
          additionalSlugVariants.push(current.slug);
        }

        const result = await sendDeferredNotificationsForProvider({
          profileId: bp?.id || "",
          email: newEmail,
          providerName: current.provider_name || "Provider",
          providerSlug,
          additionalSlugVariants,
          leadsUnsubscribed: !!profileMeta.leads_unsubscribed,
        });

        console.log("[deferred-email] Notifications sent:", result);
      } catch (deferredErr) {
        // Non-blocking — the provider update succeeded, deferred emails are best-effort
        console.error("Failed to send deferred notifications:", deferredErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Directory update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
