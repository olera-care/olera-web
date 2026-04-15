import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body as { action: "flag" | "unflag" };

  if (!["flag", "unflag"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const db = getServiceClient();

  try {
    const updateData =
      action === "flag"
        ? {
            flagged: true,
            flagged_at: new Date().toISOString(),
            flagged_reason: "Flagged by admin",
          }
        : {
            flagged: false,
            flagged_at: null,
            flagged_reason: null,
          };

    const { data: review, error } = await db
      .from("olera_reviews")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update olera review:", error);
      return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
    }

    return NextResponse.json({ review });
  } catch (err) {
    console.error("Olera review action error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const db = getServiceClient();

  try {
    const { error } = await db
      .from("olera_reviews")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete olera review:", error);
      return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Olera review delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
