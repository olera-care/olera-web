import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { connectionRequestEmail } from "@/lib/email-templates";
import { generateProviderSlug } from "@/lib/slugify";

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

    const { providerId } = await params;
    const db = getServiceClient();

    // Get full provider record
    const { data: provider, error: providerError } = await db
      .from("olera-providers")
      .select("*")
      .eq("provider_id", providerId)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Get classified image metadata
    let images: Record<string, unknown>[] = [];
    try {
      const { data, error: imagesError } = await db
        .from("provider_image_metadata")
        .select("*")
        .eq("provider_id", providerId)
        .order("quality_score", { ascending: false });

      if (!imagesError && data) {
        images = data;
      }
    } catch {
      // Table may not exist yet
    }

    // Parse raw images from the provider record
    const rawImages: string[] = [];
    if (provider.provider_logo) {
      rawImages.push(provider.provider_logo);
    }
    if (provider.provider_images) {
      const parsed = (provider.provider_images as string)
        .split(" | ")
        .map((u: string) => u.trim())
        .filter(Boolean);
      for (const url of parsed) {
        if (url !== provider.provider_logo) rawImages.push(url);
      }
    }

    // Fetch linked business_profiles record for owner/staff metadata
    let staffData = null;
    let businessProfileId: string | null = null;
    const { data: bp } = await db
      .from("business_profiles")
      .select("id, metadata")
      .eq("source_provider_id", providerId)
      .limit(1)
      .maybeSingle();
    if (bp) {
      businessProfileId = bp.id;
      const meta = (bp.metadata || {}) as Record<string, unknown>;
      staffData = meta.staff || null;
    }

    return NextResponse.json({ provider, images, rawImages, staffData, businessProfileId });
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

    // Auto-set deleted_at when deleted changes
    if ("deleted" in updates) {
      if (updates.deleted === true && !current.deleted) {
        updates.deleted_at = new Date().toISOString();
      } else if (!updates.deleted && current.deleted) {
        updates.deleted_at = null;
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
        },
      });
    }

    // If email was added (empty → non-empty), send deferred lead notifications
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

        // Find pending connections flagged as needing provider email
        const { data: bp, error: bpErr } = await db
          .from("business_profiles")
          .select("id")
          .eq("source_provider_id", providerId)
          .limit(1)
          .single();
        console.log("[deferred-email] business_profile lookup:", bp?.id ?? "NOT FOUND", bpErr?.message ?? "");

        if (bp) {
          const { data: flaggedConnections, error: connErr } = await db
            .from("connections")
            .select("id, message, from_profile:business_profiles!connections_from_profile_id_fkey(display_name)")
            .eq("to_profile_id", bp.id)
            .eq("status", "pending")
            .contains("metadata", { needs_provider_email: true });
          console.log("[deferred-email] flagged connections:", flaggedConnections?.length ?? 0, connErr?.message ?? "");

          if (flaggedConnections && flaggedConnections.length > 0) {
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
            const careTypeMap: Record<string, string> = {
              home_care: "Home Care",
              home_health: "Home Health Care",
              assisted_living: "Assisted Living",
              memory_care: "Memory Care",
            };

            for (const conn of flaggedConnections) {
              try {
                // Parse intent data from message
                let careType: string | null = null;
                let additionalNotes: string | null = null;
                let familyName = "A family";
                try {
                  const msg = JSON.parse(conn.message || "{}");
                  careType = msg.care_type ? (careTypeMap[msg.care_type] || msg.care_type) : null;
                  additionalNotes = msg.additional_notes || null;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const fromProfile = (conn as any).from_profile as { display_name: string } | null;
                  familyName = fromProfile?.display_name || `${msg.seeker_first_name || ""} ${msg.seeker_last_name || ""}`.trim() || "A family";
                } catch { /* use defaults */ }

                await sendEmail({
                  to: newEmail,
                  subject: `A family is looking for care from ${current.provider_name || "your organization"}`,
                  html: connectionRequestEmail({
                    providerName: current.provider_name || "Provider",
                    familyName,
                    careType,
                    message: additionalNotes,
                    viewUrl: `${siteUrl}/provider/connections`,
                  }),
                  emailType: "connection_request",
                  recipientType: "provider",
                  providerId,
                });

                // Clear the flag on this connection
                const { data: connData } = await db
                  .from("connections")
                  .select("metadata")
                  .eq("id", conn.id)
                  .single();

                if (connData?.metadata) {
                  const meta = connData.metadata as Record<string, unknown>;
                  delete meta.needs_provider_email;
                  meta.email_sent_at = new Date().toISOString();
                  await db
                    .from("connections")
                    .update({ metadata: meta })
                    .eq("id", conn.id);
                }
              } catch (emailErr) {
                console.error(`Failed to send deferred lead email for connection ${conn.id}:`, emailErr);
              }
            }

            await logAuditAction({
              adminUserId: adminUser.id,
              action: "deferred_lead_emails_sent",
              targetType: "directory_provider",
              targetId: providerId,
              details: {
                provider_name: current.provider_name,
                email: newEmail,
                connections_notified: flaggedConnections.length,
              },
            });
          }
        }
      } catch (deferredErr) {
        // Non-blocking — the provider update succeeded, deferred emails are best-effort
        console.error("Failed to send deferred lead notifications:", deferredErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Directory update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
