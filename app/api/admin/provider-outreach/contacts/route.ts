import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * Contact types that can be saved
 */
export const CONTACT_TYPES = ["email", "fax", "phone"] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export interface SavedContact {
  id: string;
  provider_id: string;
  type: ContactType;
  value: string;
  label: string | null;
  notes: string | null;
  admin_id: string;
  admin_name: string | null;
  created_at: string;
}

/**
 * GET /api/admin/provider-outreach/contacts?provider_id=xxx
 *
 * Fetch all saved contacts for a provider.
 * Returns contacts ordered by created_at DESC (most recent first).
 */
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
    const providerId = searchParams.get("provider_id");

    if (!providerId) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Query touchpoints with type = 'contact_saved', join admin_users for names
    const { data: touchpoints, error } = await db
      .from("provider_outreach_touchpoints")
      .select(`
        id,
        provider_id,
        details,
        admin_user_id,
        created_at,
        admin_users (
          display_name
        )
      `)
      .eq("provider_id", providerId)
      .eq("touchpoint_type", "contact_saved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[contacts] Query error:", error);
      return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
    }

    // Transform to SavedContact format
    const contacts: SavedContact[] = (touchpoints || []).map((tp) => {
      const details = tp.details as {
        type?: string;
        value?: string;
        label?: string;
        notes?: string;
      } | null;
      const adminData = tp.admin_users as { display_name?: string } | null;
      return {
        id: tp.id,
        provider_id: tp.provider_id,
        type: (details?.type as ContactType) || "email",
        value: details?.value || "",
        label: details?.label || null,
        notes: details?.notes || null,
        admin_id: tp.admin_user_id,
        admin_name: adminData?.display_name || null,
        created_at: tp.created_at,
      };
    });

    return NextResponse.json({ contacts });
  } catch (err) {
    console.error("[contacts] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/provider-outreach/contacts
 *
 * Save a new contact for a provider.
 * Body: { provider_id, type, value, label?, notes? }
 */
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
    const { provider_id, type, value, label, notes } = body;

    if (!provider_id) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    if (!type || !CONTACT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${CONTACT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!value?.trim()) {
      return NextResponse.json({ error: "value is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Insert into provider_outreach_touchpoints
    const { data: inserted, error } = await db
      .from("provider_outreach_touchpoints")
      .insert({
        provider_id,
        touchpoint_type: "contact_saved",
        admin_user_id: adminUser.id,
        details: {
          type,
          value: value.trim(),
          label: label?.trim() || null,
          notes: notes?.trim() || null,
        },
      })
      .select()
      .single();

    if (error) {
      console.error("[contacts] Insert error:", error);
      return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
    }

    const contact: SavedContact = {
      id: inserted.id,
      provider_id: inserted.provider_id,
      type,
      value: value.trim(),
      label: label?.trim() || null,
      notes: notes?.trim() || null,
      admin_id: adminUser.id,
      admin_name: adminUser.display_name || null,
      created_at: inserted.created_at,
    };

    return NextResponse.json({ success: true, contact });
  } catch (err) {
    console.error("[contacts] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/provider-outreach/contacts
 *
 * Update an existing saved contact.
 * Body: { contact_id, type?, value?, label?, notes? }
 */
export async function PATCH(request: NextRequest) {
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
    const { contact_id, type, value, label, notes } = body;

    if (!contact_id) {
      return NextResponse.json({ error: "contact_id is required" }, { status: 400 });
    }

    if (type !== undefined && !CONTACT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${CONTACT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (value !== undefined && !value?.trim()) {
      return NextResponse.json({ error: "value cannot be empty" }, { status: 400 });
    }

    const db = getServiceClient();

    // Fetch the existing touchpoint
    const { data: existing, error: fetchError } = await db
      .from("provider_outreach_touchpoints")
      .select("id, provider_id, details, admin_user_id, created_at")
      .eq("id", contact_id)
      .eq("touchpoint_type", "contact_saved")
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Build updated details
    const currentDetails = existing.details as {
      type?: string;
      value?: string;
      label?: string;
      notes?: string;
    } || {};

    const updatedDetails = {
      ...currentDetails,
      ...(type !== undefined && { type }),
      ...(value !== undefined && { value: value.trim() }),
      ...(label !== undefined && { label: label?.trim() || null }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
    };

    // Update the touchpoint
    const { error: updateError } = await db
      .from("provider_outreach_touchpoints")
      .update({ details: updatedDetails })
      .eq("id", contact_id);

    if (updateError) {
      console.error("[contacts] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
    }

    // Fetch admin name for the original creator
    const { data: adminData } = await db
      .from("admin_users")
      .select("display_name")
      .eq("id", existing.admin_user_id)
      .single();

    const contact: SavedContact = {
      id: existing.id,
      provider_id: existing.provider_id,
      type: updatedDetails.type as ContactType || "email",
      value: updatedDetails.value || "",
      label: updatedDetails.label || null,
      notes: updatedDetails.notes || null,
      admin_id: existing.admin_user_id,
      admin_name: adminData?.display_name || null,
      created_at: existing.created_at,
    };

    return NextResponse.json({ success: true, contact });
  } catch (err) {
    console.error("[contacts] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/provider-outreach/contacts
 *
 * Delete a saved contact.
 * Body: { contact_id }
 */
export async function DELETE(request: NextRequest) {
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
    const { contact_id } = body;

    if (!contact_id) {
      return NextResponse.json({ error: "contact_id is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Delete the touchpoint
    const { error } = await db
      .from("provider_outreach_touchpoints")
      .delete()
      .eq("id", contact_id)
      .eq("touchpoint_type", "contact_saved");

    if (error) {
      console.error("[contacts] Delete error:", error);
      return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[contacts] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
