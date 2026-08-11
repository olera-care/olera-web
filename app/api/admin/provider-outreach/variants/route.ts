import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser } from "@/lib/admin";
import {
  getAllVariants,
  createVariant,
  updateVariant,
  deleteVariant,
  type CreateVariantInput,
  type UpdateVariantInput,
} from "@/lib/provider-outreach/variant-testing";

/**
 * GET /api/admin/provider-outreach/variants
 *
 * List all email variants (active and inactive).
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

    const variants = await getAllVariants();

    return NextResponse.json({
      variants,
    });
  } catch (error) {
    console.error("Error fetching variants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/provider-outreach/variants
 *
 * Create a new email variant.
 *
 * Body:
 *   - variant_key: string (required) - Unique key e.g., "intro_v2_shorter"
 *   - name: string (required) - Human-readable name
 *   - subject: string (required) - Email subject template
 *   - body: string (required) - Email body template (markdown with {placeholders})
 *   - is_control: boolean (optional) - Mark as control/baseline
 *   - is_active: boolean (optional) - Currently enrolling new providers
 *   - allocation_percent: number (optional) - % of launches to assign (0-100)
 *   - notes: string (optional) - Admin notes
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

    // Validate required fields
    if (!body.variant_key || typeof body.variant_key !== "string") {
      return NextResponse.json(
        { error: "variant_key is required" },
        { status: 400 }
      );
    }

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    if (!body.subject || typeof body.subject !== "string") {
      return NextResponse.json(
        { error: "subject is required" },
        { status: 400 }
      );
    }

    if (!body.body || typeof body.body !== "string") {
      return NextResponse.json(
        { error: "body is required" },
        { status: 400 }
      );
    }

    // Validate allocation_percent if provided
    if (body.allocation_percent !== undefined) {
      const pct = Number(body.allocation_percent);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return NextResponse.json(
          { error: "allocation_percent must be between 0 and 100" },
          { status: 400 }
        );
      }
    }

    const input: CreateVariantInput = {
      variant_key: body.variant_key.trim(),
      name: body.name.trim(),
      subject: body.subject,
      body: body.body,
      is_control: body.is_control ?? false,
      is_active: body.is_active ?? false,
      allocation_percent: body.allocation_percent ?? 25,
      notes: body.notes,
      created_by: adminUser.id,
    };

    const result = await createVariant(input);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Failed to create variant" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      variant: result.variant,
    });
  } catch (error) {
    console.error("Error creating variant:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/provider-outreach/variants
 *
 * Update an existing email variant.
 *
 * Body:
 *   - id: string (required) - Variant ID to update
 *   - name: string (optional)
 *   - subject: string (optional)
 *   - body: string (optional)
 *   - is_control: boolean (optional)
 *   - is_active: boolean (optional)
 *   - allocation_percent: number (optional)
 *   - notes: string (optional)
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

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    // Validate allocation_percent if provided
    if (body.allocation_percent !== undefined) {
      const pct = Number(body.allocation_percent);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return NextResponse.json(
          { error: "allocation_percent must be between 0 and 100" },
          { status: 400 }
        );
      }
    }

    const input: UpdateVariantInput = {};
    if (body.name !== undefined) input.name = body.name.trim();
    if (body.subject !== undefined) input.subject = body.subject;
    if (body.body !== undefined) input.body = body.body;
    if (body.is_control !== undefined) input.is_control = body.is_control;
    if (body.is_active !== undefined) input.is_active = body.is_active;
    if (body.allocation_percent !== undefined) input.allocation_percent = body.allocation_percent;
    if (body.notes !== undefined) input.notes = body.notes;

    const result = await updateVariant(body.id, input);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Failed to update variant" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      variant: result.variant,
    });
  } catch (error) {
    console.error("Error updating variant:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/provider-outreach/variants
 *
 * Delete an email variant.
 *
 * Body:
 *   - id: string (required) - Variant ID to delete
 *
 * Note: Will fail if any providers are assigned to this variant.
 * Consider deactivating (is_active: false) instead for historical data.
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

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const result = await deleteVariant(body.id);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Failed to delete variant" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting variant:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
