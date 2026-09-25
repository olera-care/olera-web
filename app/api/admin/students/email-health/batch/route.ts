import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/students/email-health/batch
 *
 * Returns email health status for multiple students at once.
 * Optimized for the caregivers list page to show bounce/complaint indicators.
 *
 * This checks for RECENT bounces/complaints (last 90 days) to avoid marking
 * students as bounced when their address has since been fixed.
 *
 * Request body:
 *   - emails: string[] - List of student email addresses to check
 *
 * Response:
 *   - health: Record<string, { status: "healthy" | "bounced" | "complained", bounced: number, complained: number }>
 */
const WINDOW_DAYS = 90;
const PAGE_SIZE = 1000;

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  let emails: string[];
  try {
    const body = await request.json();
    emails = body.emails;
    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "emails array required" }, { status: 400 });
    }
    // Limit to 100 emails per request
    if (emails.length > 100) {
      emails = emails.slice(0, 100);
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const db = getServiceClient();
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();

  // Normalize emails to lowercase for consistent matching
  const emailsLower = emails.map((e) => e.toLowerCase());

  try {
    // Query email_log for bounce/complaint counts per email
    // Only check recent window to avoid stale data
    // Paginate to handle large result sets
    const healthMap: Record<string, { bounced: number; complained: number }> = {};

    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: logs, error } = await db
        .from("email_log")
        .select("recipient, bounced_at, complained_at")
        .eq("channel", "email")
        .eq("recipient_type", "student")
        .in("recipient", emails) // Use original case for query
        .gte("created_at", since)
        .or("bounced_at.not.is.null,complained_at.not.is.null")
        .order("id", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        console.error("[email-health/batch] query error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      for (const row of logs || []) {
        const key = row.recipient.toLowerCase();
        if (!healthMap[key]) {
          healthMap[key] = { bounced: 0, complained: 0 };
        }
        if (row.bounced_at) healthMap[key].bounced += 1;
        if (row.complained_at) healthMap[key].complained += 1;
      }

      hasMore = (logs?.length ?? 0) === PAGE_SIZE;
      offset += PAGE_SIZE;

      // Safety limit
      if (offset > 10000) break;
    }

    // Build response with status (use lowercase keys for consistency)
    const health: Record<string, { status: "healthy" | "bounced" | "complained"; bounced: number; complained: number }> = {};

    for (const email of emailsLower) {
      const counts = healthMap[email] ?? { bounced: 0, complained: 0 };
      let status: "healthy" | "bounced" | "complained" = "healthy";
      // Complaints are worse than bounces (affects sender reputation)
      if (counts.complained > 0) {
        status = "complained";
      } else if (counts.bounced > 0) {
        status = "bounced";
      }
      health[email] = { status, ...counts };
    }

    return NextResponse.json({ health });
  } catch (err) {
    console.error("[email-health/batch] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
