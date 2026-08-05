import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  DEFAULT_AUTOMATION_SYSTEM_ORDER,
  normalizeAutomationSystemOrder,
} from "@/lib/crons/systems";

/**
 * POST /api/admin/automation-system-order
 *
 * Replaces the caller's personalized Automation system order. Unknown and
 * duplicate keys are rejected so a malformed client cannot hide a system.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = await request.json().catch(() => null);
    const raw = body?.systemOrder;
    if (
      !Array.isArray(raw) ||
      raw.length !== DEFAULT_AUTOMATION_SYSTEM_ORDER.length ||
      !raw.every((key) => typeof key === "string") ||
      new Set(raw).size !== raw.length ||
      raw.some((key) => !DEFAULT_AUTOMATION_SYSTEM_ORDER.includes(key))
    ) {
      return NextResponse.json({ error: "systemOrder must contain every Automation system exactly once" }, { status: 400 });
    }

    const systemOrder = normalizeAutomationSystemOrder(raw);
    const db = getServiceClient();
    const { error } = await db
      .from("admin_users")
      .update({ automation_system_order: systemOrder, updated_at: new Date().toISOString() })
      .eq("id", admin.id);
    if (error) {
      console.error("Failed to save Automation system order:", error);
      return NextResponse.json({ error: "Failed to save system order" }, { status: 500 });
    }

    return NextResponse.json({ systemOrder });
  } catch (error) {
    console.error("Automation system order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
