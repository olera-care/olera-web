import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

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
  const { action } = body as { action: "approve" | "reject" | "remove" };

  if (!["approve", "reject", "remove"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const statusMap: Record<string, string> = {
    approve: "published",
    reject: "rejected",
    remove: "removed",
  };

  const db = getServiceClient();

  const { data: review, error } = await db
    .from("reviews")
    .update({ status: statusMap[action], updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }

  await logAuditAction({
    adminUserId: adminUser.id,
    action: `${action}_review`,
    targetType: "review",
    targetId: id,
    details: { new_status: statusMap[action], provider_id: review.provider_id },
  });

  return NextResponse.json({ success: true, review });
}
