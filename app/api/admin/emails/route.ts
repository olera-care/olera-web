import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/emails
 *
 * Filterable, paginated email audit log.
 * Query params: search, email_type, recipient_type, status, from_date, to_date,
 *               provider_id, limit, offset
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
    const search = searchParams.get("search")?.trim() || "";
    const emailType = searchParams.get("email_type");
    const recipientType = searchParams.get("recipient_type");
    const status = searchParams.get("status");
    const fromDate = searchParams.get("from_date");
    const toDate = searchParams.get("to_date");
    const providerId = searchParams.get("provider_id");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const db = getServiceClient();

    // Build query — select everything except html_body for the list view
    let query = db
      .from("email_log")
      .select(
        "id, resend_id, recipient, sender, subject, email_type, recipient_type, provider_id, status, error_message, metadata, created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike("recipient", `%${search}%`);
    }
    if (emailType) {
      query = query.eq("email_type", emailType);
    }
    if (recipientType) {
      query = query.eq("recipient_type", recipientType);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (fromDate) {
      query = query.gte("created_at", fromDate);
    }
    if (toDate) {
      // Add end-of-day to include the full day
      query = query.lte("created_at", `${toDate}T23:59:59.999Z`);
    }
    if (providerId) {
      query = query.eq("provider_id", providerId);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("[admin/emails] Query failed:", error);
      return NextResponse.json({ error: "Failed to load emails" }, { status: 500 });
    }

    return NextResponse.json({ emails: data ?? [], total: count ?? 0 });
  } catch (err) {
    console.error("[admin/emails] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/admin/emails/[id]
 * Fetch a single email log entry including html_body for preview.
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

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing email ID" }, { status: 400 });
    }

    const db = getServiceClient();
    const { data, error } = await db
      .from("email_log")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json({ email: data });
  } catch (err) {
    console.error("[admin/emails] Preview error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
