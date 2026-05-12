import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { getCronJob } from "@/lib/crons/registry";

/**
 * GET /api/admin/automations/[id]/preview?type=<email_type>[&raw=1]
 *
 * Returns the most recent *actual* email this automation sent (real recipient,
 * real interpolated variables) by pulling email_log.html_body — no template
 * re-rendering. `?raw=1` returns the HTML directly (Content-Type text/html) for
 * opening in a new tab; otherwise JSON { html, recipient, subject, sentAt,
 * metadata }. 404 if no rendered email exists for that type.
 *
 * `type` defaults to the job's first email_type. Must be one this job sends.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const { id } = await params;
  const job = getCronJob(id);
  if (!job) return NextResponse.json({ error: "Unknown automation" }, { status: 404 });
  if (job.emailTypes.length === 0) return NextResponse.json({ error: "This automation does not send email" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const requested = searchParams.get("type");
  const type = requested && job.emailTypes.includes(requested) ? requested : job.emailTypes[0];
  const raw = searchParams.get("raw") === "1";

  const db = getServiceClient();
  const { data } = await db
    .from("email_log")
    .select("recipient, subject, html_body, metadata, created_at")
    .eq("email_type", type)
    .not("html_body", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data || !data.html_body) {
    return NextResponse.json({ error: `No rendered email found for type "${type}"` }, { status: 404 });
  }

  if (raw) {
    return new NextResponse(data.html_body, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
  return NextResponse.json({
    type,
    html: data.html_body,
    recipient: data.recipient,
    subject: data.subject,
    sentAt: data.created_at,
    metadata: data.metadata ?? null,
  });
}
