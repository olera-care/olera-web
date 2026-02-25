import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/questions
 *
 * List all questions for admin moderation.
 * Query params: status, provider_id, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const providerId = searchParams.get("provider_id");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const db = getServiceClient();
    let query = db
      .from("provider_questions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (providerId) query = query.eq("provider_id", providerId);

    const { data: questions, count, error } = await query;

    if (error) {
      console.error("Admin questions fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }

    return NextResponse.json({ questions: questions ?? [], count: count ?? 0 });
  } catch (err) {
    console.error("Admin questions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/questions
 *
 * Update question status (approve, reject, flag) or add answer.
 * Body: { id, status?, answer?, is_public? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = await request.json();
    const { id, status, answer, is_public } = body;

    if (!id) {
      return NextResponse.json({ error: "Question id required" }, { status: 400 });
    }

    const db = getServiceClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (status) updates.status = status;
    if (is_public !== undefined) updates.is_public = is_public;
    if (answer !== undefined) {
      updates.answer = answer;
      updates.answered_at = new Date().toISOString();
      updates.status = "answered";
      updates.is_public = true;
    }

    const { data, error } = await db
      .from("provider_questions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Admin question update error:", error);
      return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
    }

    return NextResponse.json({ question: data });
  } catch (err) {
    console.error("Admin questions PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
