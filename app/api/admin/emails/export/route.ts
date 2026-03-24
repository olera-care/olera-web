import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/emails/export
 *
 * Export email audit log as CSV. Same filters as the main endpoint.
 * Excludes html_body (too large for CSV).
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

    const db = getServiceClient();

    let query = db
      .from("email_log")
      .select(
        "id, resend_id, recipient, sender, subject, email_type, recipient_type, provider_id, status, error_message, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(10000);

    if (search) query = query.ilike("recipient", `%${search}%`);
    if (emailType) query = query.eq("email_type", emailType);
    if (recipientType) query = query.eq("recipient_type", recipientType);
    if (status) query = query.eq("status", status);
    if (fromDate) query = query.gte("created_at", fromDate);
    if (toDate) query = query.lte("created_at", `${toDate}T23:59:59.999Z`);
    if (providerId) query = query.eq("provider_id", providerId);

    const { data, error } = await query;

    if (error) {
      console.error("[admin/emails/export] Query failed:", error);
      return NextResponse.json({ error: "Failed to export" }, { status: 500 });
    }

    const rows = data ?? [];
    const headers = [
      "ID",
      "Resend ID",
      "Recipient",
      "Sender",
      "Subject",
      "Email Type",
      "Recipient Type",
      "Provider ID",
      "Status",
      "Error",
      "Sent At",
    ];

    const csvRows = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.id,
          r.resend_id ?? "",
          escapeCsv(r.recipient),
          escapeCsv(r.sender),
          escapeCsv(r.subject),
          r.email_type,
          r.recipient_type ?? "",
          r.provider_id ?? "",
          r.status,
          escapeCsv(r.error_message ?? ""),
          r.created_at,
        ].join(",")
      ),
    ];

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="email-log-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (err) {
    console.error("[admin/emails/export] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
