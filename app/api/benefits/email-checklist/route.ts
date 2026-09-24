import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { checklistEmail } from "@/lib/email-templates";
import { getServiceClient } from "@/lib/admin";
import { getStateById, getProgramById } from "@/data/waiver-library";

/**
 * POST /api/benefits/email-checklist
 *
 * Emails the document checklist from /senior-benefits/{state}/{benefit}/checklist.
 * The page is public and anonymous, so the recipient can't be proven — the
 * guards instead make it useless as a relay:
 *
 *   1. No caller-supplied text reaches the email. Program and state names are
 *      looked up server-side from stateId/programId; checked items are
 *      filtered to the fixed checklist. (Previously programName etc. were
 *      free text, so anyone could send arbitrary copy from olera.care.)
 *   2. Rate limits, counted from email_log (serverless-safe, no in-memory
 *      state): per recipient, per IP, and a global daily ceiling.
 */

const PER_RECIPIENT_PER_DAY = 3;
const PER_IP_PER_HOUR = 5;
const GLOBAL_PER_DAY = 100;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const stateId = typeof body.stateId === "string" ? body.stateId : "";
  const programId = typeof body.programId === "string" ? body.programId : "";
  const state = stateId ? getStateById(stateId) : undefined;
  const program = stateId && programId ? getProgramById(stateId, programId) : undefined;
  if (!state || !program) {
    return NextResponse.json({ error: "Unknown program" }, { status: 400 });
  }

  // The template ignores anything not in its fixed list, but cap the input
  // anyway so a huge array can't be used to bloat the request.
  const checked = Array.isArray(body.checked)
    ? body.checked.filter((c): c is string => typeof c === "string" && c.length <= 200).slice(0, 50)
    : [];

  const ip = clientIp(req);
  const db = getServiceClient();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [byRecipient, byIp, global] = await Promise.all([
    db
      .from("email_log")
      .select("id", { count: "exact", head: true })
      .eq("email_type", "checklist")
      .eq("recipient", email)
      .gte("created_at", dayAgo),
    db
      .from("email_log")
      .select("id", { count: "exact", head: true })
      .eq("email_type", "checklist")
      .eq("metadata->>ip", ip)
      .gte("created_at", hourAgo),
    db
      .from("email_log")
      .select("id", { count: "exact", head: true })
      .eq("email_type", "checklist")
      .gte("created_at", dayAgo),
  ]);

  // Fail closed: if we can't count, we don't send.
  if (byRecipient.error || byIp.error || global.error) {
    console.error("[email-checklist] rate-limit check failed:", byRecipient.error || byIp.error || global.error);
    return NextResponse.json({ error: "Please try again later." }, { status: 503 });
  }
  if (
    (byRecipient.count ?? 0) >= PER_RECIPIENT_PER_DAY ||
    (byIp.count ?? 0) >= PER_IP_PER_HOUR ||
    (global.count ?? 0) >= GLOBAL_PER_DAY
  ) {
    return NextResponse.json(
      { error: "Too many checklist emails sent. Please try again later." },
      { status: 429 },
    );
  }

  const html = checklistEmail({
    programName: program.name,
    programShortName: program.shortName,
    stateName: state.name,
    checked,
  });

  const result = await sendEmail({
    to: email,
    subject: `Your ${program.shortName} Document Checklist — Olera`,
    html,
    emailType: "checklist",
    recipientType: "family",
    metadata: { ip, state_id: state.id, program_id: program.id },
  });

  if (!result.success) {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
