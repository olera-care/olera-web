/**
 * GET    /api/admin/staffing-outreach/[id]   — drawer detail
 * POST   /api/admin/staffing-outreach/[id]   — actions, dispatched on body.action
 *
 * V2 Core Actions (MVP Simplified):
 *   claim                    hold the row for 60 min
 *   release                  drop the claim
 *   update_research          set research_data fields, optional notes
 *   start_sequence           trigger Resend automation for email sequence
 *   move_to_needs_call       skip sequence, start calling immediately
 *   disposition              log a call disposition + state transition
 *   add_contact_and_send     capture verified contact + fire enrollment email
 *   mark_closed              mark as closed
 *   reopen                   reopen a closed provider → needs_call
 *   reopen_to_queue          reopen closed provider → queued (manual start)
 *   restart_sequence         update email + auto-start sequence → sequencing
 *
 * Legacy Actions (kept for backwards compatibility):
 *   mark_pre_call_complete   advance status queued→pre_call_outreach
 *   send_pre_call            fire pre-call email + log touchpoint
 *   send_follow_up           fire follow-up reminder email
 *   log_email_sent           log email touchpoint only (Gmail flow)
 *   log_contact_form         log a contact_form_submitted touchpoint
 *   revert_to_queued         move back to queued (use reopen_to_queue instead)
 *   resend_enrollment_email  resend enrollment email to consented/activated provider
 *
 * Mutations always insert a touchpoint and update outreach.updated_at.
 * Response shape mirrors the GET payload (refreshed DrawerContext) so
 * the client can re-render without a follow-up fetch.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import {
  preCallEmail,
  followUpReminderEmail,
  postConsentStep1Email,
  SENDER_OLERA_TEAM,
  SENDER_LOGAN,
} from "@/lib/staffing-outreach/email-templates";
import { buildStaffingPilotActivationUrl } from "@/lib/staffing-outreach/tokens";
import {
  startEmailSequence,
  stopEmailSequence,
  getSequenceEmailPreviews,
} from "@/lib/staffing-outreach/resend-automation";
import {
  getServiceArea,
  type DrawerContext,
  type ResearchData,
  type StaffingOutreachRow,
  type StaffingStatus,
  type TouchpointType,
} from "@/lib/staffing-outreach/types";

const CLAIM_TTL_MIN = 60;
const DEMO_VIDEO_URL = "https://www.youtube.com/watch?v=ParY1tGaiew";
const PILOT_AGREEMENT_URL = process.env.PILOT_AGREEMENT_PDF_URL ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

// ── GET: drawer context ──────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const ctx = await loadDrawerContext(id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ctx);
}

// ── POST: actions ────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const action = body.action as string;

  const db = getServiceClient();
  const { data: outreach, error: fetchErr } = await db
    .from("staffing_outreach")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchErr || !outreach) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    switch (action) {
      // ── V2 Core Actions ────────────────────────────────────────────────
      case "claim":
        await handleClaim(id, user.id);
        break;
      case "release":
        await handleRelease(id, user.id);
        break;
      case "update_research":
        await handleUpdateResearch(outreach, body, user.id);
        break;
      case "start_sequence":
        await handleStartSequence(outreach, body, user.id);
        break;
      case "move_to_needs_call":
        await handleMoveToNeedsCall(outreach, user.id);
        break;
      case "disposition":
        await handleDisposition(outreach, body, user.id);
        break;
      case "add_contact_and_send":
        // Captures consent + sends enrollment email (still used in V2)
        await handleAddContactAndSend(outreach, body, user.id);
        break;
      case "mark_closed":
        await handleMarkClosed(outreach, body, user.id);
        break;
      case "reopen":
        // Reopen closed provider to needs_call
        await handleReopen(outreach, user.id);
        break;
      case "reopen_to_queue":
        // Reopen closed provider to queue (manual start required)
        await handleReopenToQueue(outreach, body, user.id);
        break;
      case "restart_sequence":
        // Update email and auto-start sequence (from Needs Call)
        await handleRestartSequence(outreach, body, user.id);
        break;

      // ── Legacy Actions (kept for backwards compatibility) ──────────────
      case "mark_pre_call_complete":
        // Legacy: manual pre-call workflow
        await handleMarkPreCallComplete(outreach, user.id);
        break;
      case "send_pre_call":
        // Legacy: manual email send via Olera
        await handleSendPreCall(outreach, body, user.id, admin);
        break;
      case "send_follow_up":
        // Legacy: manual follow-up email via Olera
        await handleSendFollowUp(outreach, body, user.id, admin);
        break;
      case "log_email_sent":
        // Legacy: Gmail flow (mark as sent manually)
        await handleLogEmailSent(outreach, body, user.id);
        break;
      case "log_contact_form":
        // Legacy: contact form submission tracking
        await handleLogContactForm(outreach, body, user.id);
        break;
      case "revert_to_queued":
        // Legacy: use reopen_to_queue instead
        await handleRevertToQueued(outreach, user.id);
        break;
      case "resend_enrollment_email":
        // Legacy: resend magic link enrollment email
        await handleResendEnrollmentEmail(outreach, body, user.id);
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Action failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const refreshed = await loadDrawerContext(id);
  return NextResponse.json(refreshed);
}

// ── Loaders ──────────────────────────────────────────────────────────────

async function loadDrawerContext(outreachId: string): Promise<DrawerContext | null> {
  const db = getServiceClient();

  const { data: outreach } = await db
    .from("staffing_outreach")
    .select("*")
    .eq("id", outreachId)
    .single();
  if (!outreach) return null;

  const [{ data: batch }, { data: provider }, { data: contacts }, { data: touchpoints }] =
    await Promise.all([
      db.from("staffing_batches").select("*").eq("id", outreach.batch_id).single(),
      db
        .from("olera-providers")
        .select(
          "provider_id, provider_name, provider_category, phone, email, website, address, city, state, slug",
        )
        .eq("provider_id", outreach.provider_id)
        .single(),
      db
        .from("staffing_contacts")
        .select("*")
        .eq("outreach_id", outreachId)
        .order("created_at", { ascending: false }),
      db
        .from("staffing_touchpoints")
        .select("*")
        .eq("outreach_id", outreachId)
        .order("created_at", { ascending: false }),
    ]);

  if (!batch || !provider) return null;

  return {
    outreach,
    batch,
    provider,
    contacts: contacts ?? [],
    touchpoints: touchpoints ?? [],
  };
}

// ── Action handlers ──────────────────────────────────────────────────────

async function handleClaim(outreachId: string, userId: string) {
  const db = getServiceClient();
  const claimedUntil = new Date(Date.now() + CLAIM_TTL_MIN * 60_000).toISOString();
  await db
    .from("staffing_outreach")
    .update({ claimed_by: userId, claimed_until: claimedUntil, updated_at: new Date().toISOString() })
    .eq("id", outreachId);
}

async function handleRelease(outreachId: string, userId: string) {
  const db = getServiceClient();
  await db
    .from("staffing_outreach")
    .update({ claimed_by: null, claimed_until: null, updated_at: new Date().toISOString() })
    .eq("id", outreachId)
    .eq("claimed_by", userId);
}

async function handleUpdateResearch(
  outreach: StaffingOutreachRow,
  body: { research?: ResearchData; notes?: string },
  userId: string,
) {
  const db = getServiceClient();
  const merged = { ...outreach.research_data, ...(body.research ?? {}) };
  await db
    .from("staffing_outreach")
    .update({
      research_data: merged,
      notes: body.notes ?? outreach.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", outreach.id);
  await insertTouchpoint(outreach.id, "research_completed", userId, body.notes ?? null, {
    fields_updated: Object.keys(body.research ?? {}),
  });
}

async function handleMarkPreCallComplete(outreach: StaffingOutreachRow, userId: string) {
  const db = getServiceClient();
  // Pre-call complete → ready to call immediately (no overnight wait per spec)
  await db
    .from("staffing_outreach")
    .update({
      status: "pre_call_outreach",
      next_action_due_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", outreach.id);
  await insertTouchpoint(outreach.id, "research_completed", userId, "Pre-call complete", {
    transition: "queued→pre_call_outreach",
  });
}

async function handleSendPreCall(
  outreach: StaffingOutreachRow,
  body: { recipientEmail?: string; adminFirstName?: string },
  userId: string,
  admin: { email: string },
) {
  const db = getServiceClient();
  const recipient = (body.recipientEmail ?? outreach.research_data.general_email ?? "").trim();
  if (!recipient) throw new Error("No recipient email — set research_data.general_email first");

  const [{ data: provider }, { data: batch }] = await Promise.all([
    db.from("olera-providers")
      .select("provider_name, provider_id")
      .eq("provider_id", outreach.provider_id)
      .single(),
    db.from("staffing_batches")
      .select("university_name")
      .eq("id", outreach.batch_id)
      .single(),
  ]);
  if (!provider) throw new Error("Provider not found");
  if (!batch) throw new Error("Batch not found");

  const adminFirstName =
    body.adminFirstName?.trim() ||
    admin.email?.split("@")[0] ||
    "Olera";

  const { subject, html } = preCallEmail({
    providerName: provider.provider_name,
    adminFirstName,
    universityName: batch.university_name,
    demoVideoUrl: DEMO_VIDEO_URL,
  });

  const send = await sendEmail({
    to: recipient,
    from: SENDER_OLERA_TEAM,
    subject,
    html,
    emailType: "staffing_pre_call",
    recipientType: "provider",
    providerId: provider.provider_id,
    metadata: { outreach_id: outreach.id, batch_id: outreach.batch_id },
  });

  await insertTouchpoint(outreach.id, "pre_call_email_sent", userId, null, {
    recipient,
    email_log_id: send.emailLogId,
    success: send.success,
    error: send.error,
  });
}

async function handleSendFollowUp(
  outreach: StaffingOutreachRow,
  body: { recipientEmail?: string; adminFirstName?: string },
  userId: string,
  admin: { email: string },
) {
  const db = getServiceClient();
  const recipient = (body.recipientEmail ?? outreach.research_data.general_email ?? "").trim();
  if (!recipient) throw new Error("No recipient email — set research_data.general_email first");

  const [{ data: provider }, { data: batch }] = await Promise.all([
    db.from("olera-providers")
      .select("provider_name, provider_id")
      .eq("provider_id", outreach.provider_id)
      .single(),
    db.from("staffing_batches")
      .select("university_name")
      .eq("id", outreach.batch_id)
      .single(),
  ]);
  if (!provider) throw new Error("Provider not found");
  if (!batch) throw new Error("Batch not found");

  const adminFirstName =
    body.adminFirstName?.trim() ||
    admin.email?.split("@")[0] ||
    "Olera";

  const { subject, html } = followUpReminderEmail({
    providerName: provider.provider_name,
    adminFirstName,
    universityName: batch.university_name,
  });

  const send = await sendEmail({
    to: recipient,
    from: SENDER_OLERA_TEAM,
    subject,
    html,
    emailType: "staffing_follow_up",
    recipientType: "provider",
    providerId: provider.provider_id,
    metadata: { outreach_id: outreach.id, batch_id: outreach.batch_id },
  });

  await insertTouchpoint(outreach.id, "follow_up_email_sent", userId, null, {
    recipient,
    email_log_id: send.emailLogId,
    success: send.success,
    error: send.error,
  });
}

async function handleLogContactForm(
  outreach: StaffingOutreachRow,
  body: { url?: string; notes?: string },
  userId: string,
) {
  await insertTouchpoint(outreach.id, "contact_form_submitted", userId, body.notes ?? null, {
    url: body.url ?? outreach.research_data.contact_form_url ?? null,
  });
}

/**
 * Log email sent touchpoint without actually sending an email.
 * Used for the "Open in Gmail" flow where the user sends via Gmail
 * and then marks it as sent in our system.
 *
 * When initial email is sent:
 * - Status changes from queued → pre_call_outreach (moves to Nurturing tab)
 * - Schedules follow-up in 5 days
 */
async function handleLogEmailSent(
  outreach: StaffingOutreachRow,
  body: { emailType: "initial" | "follow_up"; recipientEmail?: string },
  userId: string,
) {
  const db = getServiceClient();
  const recipient = body.recipientEmail?.trim() || outreach.research_data.general_email || "";

  const touchpointType: TouchpointType =
    body.emailType === "follow_up" ? "follow_up_email_sent" : "pre_call_email_sent";

  await insertTouchpoint(outreach.id, touchpointType, userId, null, {
    recipient,
    sent_via: "gmail",
  });

  if (body.emailType === "initial") {
    // Move from New → Nurturing tab and schedule follow-up (3 business days ≈ 5 calendar days)
    const nextDue = new Date(Date.now() + 5 * 86400_000).toISOString();
    await db
      .from("staffing_outreach")
      .update({
        status: "pre_call_outreach",
        next_action_due_at: nextDue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", outreach.id);
  } else {
    // Follow-up sent - schedule next action in 3 days
    const nextDue = new Date(Date.now() + 3 * 86400_000).toISOString();
    await db
      .from("staffing_outreach")
      .update({
        next_action_due_at: nextDue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", outreach.id);
  }
}

async function handleDisposition(
  outreach: StaffingOutreachRow,
  body: { type?: string; notes?: string },
  userId: string,
) {
  const type = body.type as TouchpointType;
  const validCallTypes: TouchpointType[] = [
    "call_no_answer",
    "call_voicemail",
    "call_wrong_number",
    "call_connected_no_consent",
    "call_not_interested",
    "manual_dnc",
  ];
  if (!validCallTypes.includes(type)) {
    throw new Error(`Invalid disposition type: ${type}`);
  }

  const transition = computeCallTransition(outreach, type);
  const db = getServiceClient();
  await db
    .from("staffing_outreach")
    .update({
      status: transition.status,
      next_action_due_at: transition.nextDueAt,
      attempts_count: outreach.attempts_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", outreach.id);

  await insertTouchpoint(outreach.id, type, userId, body.notes ?? null, {
    transition: `${outreach.status}→${transition.status}`,
    attempts_after: outreach.attempts_count + 1,
  });
}

async function handleAddContactAndSend(
  outreach: StaffingOutreachRow,
  body: { name?: string; role?: string; email?: string; phone?: string; notes?: string },
  userId: string,
) {
  const name = body.name?.trim();
  const email = body.email?.trim();
  if (!name || !email) throw new Error("name and email are required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email");

  const db = getServiceClient();

  const { data: provider } = await db
    .from("olera-providers")
    .select("provider_name, provider_id, city, state")
    .eq("provider_id", outreach.provider_id)
    .single();
  if (!provider) throw new Error("Provider not found");

  const { data: batch } = await db
    .from("staffing_batches")
    .select("university_name")
    .eq("id", outreach.batch_id)
    .single();
  if (!batch) throw new Error("Batch not found");

  // Insert verified contact
  const { data: contact, error: contactErr } = await db
    .from("staffing_contacts")
    .insert({
      outreach_id: outreach.id,
      provider_id: outreach.provider_id,
      name,
      role: body.role ?? null,
      email,
      phone: body.phone ?? null,
      consent_source: "call",
      consent_notes: body.notes ?? null,
      created_by: userId,
    })
    .select("*")
    .single();
  if (contactErr || !contact) throw new Error(contactErr?.message ?? "Contact insert failed");

  // Log the connected_consent call disposition
  await insertTouchpoint(outreach.id, "call_connected_consent", userId, body.notes ?? null, {
    contact_id: contact.id,
  });

  // Build activation magic link (the route handler ships in PR 4 — link is final)
  const activationUrl = buildStaffingPilotActivationUrl(
    { oid: outreach.id, cid: contact.id, pid: outreach.provider_id },
    BASE_URL,
  );

  const { subject, html } = postConsentStep1Email({
    contactFirstName: name.split(/\s+/)[0],
    providerName: provider.provider_name,
    universityName: batch.university_name,
    activationUrl,
    demoVideoUrl: DEMO_VIDEO_URL,
  });

  // Attach the pilot agreement PDF if uploaded; otherwise send without
  let attachments:
    | Array<{ filename: string; content: string; encoding?: string; type?: string }>
    | undefined;
  if (PILOT_AGREEMENT_URL) {
    try {
      const res = await fetch(PILOT_AGREEMENT_URL);
      if (res.ok) {
        const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
        attachments = [
          {
            filename: "olera-student-caregiver-pilot-agreement.pdf",
            content: base64,
            encoding: "base64",
            type: "application/pdf",
          },
        ];
      }
    } catch {
      // Fail open — send the email without the PDF rather than blocking
    }
  }

  const send = await sendEmail({
    to: email,
    from: SENDER_LOGAN,
    subject,
    html,
    emailType: "staffing_post_consent_step1",
    recipientType: "provider",
    providerId: provider.provider_id,
    metadata: {
      outreach_id: outreach.id,
      batch_id: outreach.batch_id,
      contact_id: contact.id,
      university: batch.university_name,
    },
    attachments,
  });

  await insertTouchpoint(outreach.id, "email_post_consent_step1_sent", userId, null, {
    recipient: email,
    contact_id: contact.id,
    email_log_id: send.emailLogId,
    activation_url: activationUrl,
    pdf_attached: Boolean(attachments),
    success: send.success,
    error: send.error,
  });

  // Status: consented; next call attempt in +3 days (confirmation call)
  const next = new Date(Date.now() + 3 * 86400_000).toISOString();
  await db
    .from("staffing_outreach")
    .update({
      status: "consented",
      next_action_due_at: next,
      attempts_count: outreach.attempts_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", outreach.id);
}

/**
 * Revert a provider back to queued status (To Queue tab).
 * Used to restart the email sequence from the beginning.
 */
async function handleRevertToQueued(outreach: StaffingOutreachRow, userId: string) {
  const db = getServiceClient();

  // Stop any active Resend sequence
  const sequenceEmail = outreach.sequence_email || outreach.research_data.general_email;
  if (outreach.resend_automation_id && sequenceEmail) {
    await stopEmailSequence(sequenceEmail);
  }

  // Log touchpoint for audit trail
  await insertTouchpoint(outreach.id, "status_reverted", userId, "Restarting email sequence", {
    from_status: outreach.status,
    to_status: "queued",
    reason: "Moved back to To Queue to restart sequence",
  });

  // Revert status to queued (To Queue tab) and reset sequence tracking
  await db
    .from("staffing_outreach")
    .update({
      status: "queued",
      next_action_due_at: new Date().toISOString(), // Due now so it's ready for action
      // Reset sequence tracking fields so they can start fresh
      sequence_started_at: null,
      email1_sent_at: null,
      email2_sent_at: null,
      resend_automation_id: null,
      sequence_email: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", outreach.id);
}

/**
 * Reopen a closed provider back to needs_call.
 * V2: handles closed, bounced, do_not_contact, wrong_number
 */
async function handleReopen(outreach: StaffingOutreachRow, userId: string) {
  const db = getServiceClient();

  // Only allow reopening closed statuses (V2 + legacy)
  const closedStatuses = ["closed", "bounced", "do_not_contact", "wrong_number"];
  if (!closedStatuses.includes(outreach.status)) {
    throw new Error("Can only reopen providers that are closed");
  }

  // Log touchpoint for audit trail
  await insertTouchpoint(outreach.id, "status_reverted", userId, "Provider reopened for outreach", {
    from_status: outreach.status,
    to_status: "needs_call",
    reason: "Manually reopened by admin",
  });

  // Move back to needs_call status (V2 workflow)
  // Set due date to NOW so it immediately appears in the Needs Call list
  const nextDue = new Date().toISOString();
  await db
    .from("staffing_outreach")
    .update({
      status: "needs_call",
      next_action_due_at: nextDue,
      updated_at: new Date().toISOString(),
    })
    .eq("id", outreach.id);
}

/**
 * Reopen a closed provider back to queued status.
 * Admin must manually click "Start Sequence" after this.
 */
async function handleReopenToQueue(
  outreach: StaffingOutreachRow,
  body: { email?: string },
  userId: string,
) {
  const db = getServiceClient();

  // Only allow from closed statuses
  const closedStatuses = ["closed", "bounced", "do_not_contact", "wrong_number"];
  if (!closedStatuses.includes(outreach.status)) {
    throw new Error("Can only reopen to queue from closed status");
  }

  // Update email in research_data if provided
  const newEmail = body.email?.trim();
  const researchData = newEmail
    ? { ...outreach.research_data, general_email: newEmail }
    : outreach.research_data;

  // Log touchpoint for audit trail
  await insertTouchpoint(outreach.id, "status_reverted", userId, "Reopened to queue", {
    from_status: outreach.status,
    to_status: "queued",
    new_email: newEmail ?? null,
  });

  // Move back to queued status and reset sequence tracking
  await db
    .from("staffing_outreach")
    .update({
      status: "queued",
      research_data: researchData,
      sequence_started_at: null,
      email1_sent_at: null,
      email2_sent_at: null,
      resend_automation_id: null,
      sequence_email: null,
      next_action_due_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", outreach.id);
}

/**
 * Update email and auto-start the email sequence.
 * Used from Needs Call tab when admin gets a corrected email from a call.
 * Goes directly to 'sequencing' status (no manual start needed).
 */
async function handleRestartSequence(
  outreach: StaffingOutreachRow,
  body: { email?: string },
  userId: string,
) {
  const db = getServiceClient();

  // Only allow from needs_call statuses
  const needsCallStatuses = ["needs_call", "consented", "calling", "connected_no_consent"];
  if (!needsCallStatuses.includes(outreach.status)) {
    throw new Error("Can only restart sequence from Needs Call status");
  }

  // Email is required for restart
  const newEmail = body.email?.trim();
  if (!newEmail) {
    throw new Error("Email is required to restart sequence");
  }

  // Update email in research_data
  const researchData = { ...outreach.research_data, general_email: newEmail };

  // Defensively stop any existing sequence before starting new one
  // This is idempotent - if contact doesn't exist in Resend, it just succeeds
  if (outreach.sequence_email) {
    try {
      await stopEmailSequence(outreach.sequence_email);
    } catch (e) {
      console.error("[restart_sequence] Failed to stop existing sequence:", e);
      // Non-fatal - continue with restart
    }
  }

  // First update the research_data with new email
  await db
    .from("staffing_outreach")
    .update({
      research_data: researchData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", outreach.id);

  // Get provider and batch info for sequence
  const [{ data: provider }, { data: batch }] = await Promise.all([
    db.from("olera-providers")
      .select("provider_name, provider_id")
      .eq("provider_id", outreach.provider_id)
      .single(),
    db.from("staffing_batches")
      .select("university_name, university_slug")
      .eq("id", outreach.batch_id)
      .single(),
  ]);

  if (!provider) throw new Error("Provider not found");
  if (!batch) throw new Error("Batch not found");

  const serviceArea = getServiceArea(batch.university_slug);

  // Start the Resend automation
  const result = await startEmailSequence({
    email: newEmail,
    outreachId: outreach.id,
    providerId: outreach.provider_id,
    providerName: provider.provider_name,
    universityName: batch.university_name,
    serviceArea,
    batchId: outreach.batch_id,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to start email sequence");
  }

  // Update to sequencing status - email1_sent_at is set immediately since we send directly
  const now = new Date().toISOString();
  await db
    .from("staffing_outreach")
    .update({
      status: "sequencing",
      sequence_started_at: now,
      email1_sent_at: now, // Email sent directly, not via automation
      email2_sent_at: null, // Reset Email 2 for the new sequence
      sequence_email: newEmail,
      next_action_due_at: new Date(Date.now() + 6 * 86400_000).toISOString(),
      updated_at: now,
    })
    .eq("id", outreach.id);

  // Log touchpoint
  await insertTouchpoint(outreach.id, "sequence_email1_sent", userId, "Restarted sequence with updated email", {
    recipient_email: newEmail,
    resend_email_id: result.emailId,
    from_status: outreach.status,
    restart: true,
  });
}

/**
 * Resend the enrollment email to a consented or activated provider.
 * Used when they haven't completed T&C acceptance yet.
 */
async function handleResendEnrollmentEmail(
  outreach: StaffingOutreachRow,
  body: { contactId?: string },
  userId: string,
) {
  const db = getServiceClient();

  // Only allow for consented or activated status (waiting for enrollment)
  if (outreach.status !== "consented" && outreach.status !== "activated") {
    throw new Error("Can only resend enrollment email to consented or activated providers");
  }

  // Get the contact to send to
  const contactId = body.contactId;
  if (!contactId) throw new Error("contactId is required");

  const { data: contact } = await db
    .from("staffing_contacts")
    .select("*")
    .eq("id", contactId)
    .eq("outreach_id", outreach.id)
    .single();
  if (!contact) throw new Error("Contact not found");

  // Get provider and batch info
  const [{ data: provider }, { data: batch }] = await Promise.all([
    db.from("olera-providers")
      .select("provider_name, provider_id, city, state")
      .eq("provider_id", outreach.provider_id)
      .single(),
    db.from("staffing_batches")
      .select("university_name")
      .eq("id", outreach.batch_id)
      .single(),
  ]);
  if (!provider) throw new Error("Provider not found");
  if (!batch) throw new Error("Batch not found");

  // Build activation magic link
  const activationUrl = buildStaffingPilotActivationUrl(
    { oid: outreach.id, cid: contact.id, pid: outreach.provider_id },
    BASE_URL,
  );

  const { subject, html } = postConsentStep1Email({
    contactFirstName: contact.name.split(/\s+/)[0],
    providerName: provider.provider_name,
    universityName: batch.university_name,
    activationUrl,
    demoVideoUrl: DEMO_VIDEO_URL,
  });

  // Attach the pilot agreement PDF if uploaded
  let attachments:
    | Array<{ filename: string; content: string; encoding?: string; type?: string }>
    | undefined;
  if (PILOT_AGREEMENT_URL) {
    try {
      const res = await fetch(PILOT_AGREEMENT_URL);
      if (res.ok) {
        const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
        attachments = [
          {
            filename: "olera-student-caregiver-pilot-agreement.pdf",
            content: base64,
            encoding: "base64",
            type: "application/pdf",
          },
        ];
      }
    } catch {
      // Fail open — send without PDF
    }
  }

  const send = await sendEmail({
    to: contact.email,
    from: SENDER_LOGAN,
    subject,
    html,
    emailType: "staffing_post_consent_step1",
    recipientType: "provider",
    providerId: provider.provider_id,
    metadata: {
      outreach_id: outreach.id,
      batch_id: outreach.batch_id,
      contact_id: contact.id,
      university: batch.university_name,
      is_resend: true,
    },
    attachments,
  });

  await insertTouchpoint(outreach.id, "email_post_consent_step1_sent", userId, "Resent enrollment email", {
    recipient: contact.email,
    contact_id: contact.id,
    email_log_id: send.emailLogId,
    activation_url: activationUrl,
    pdf_attached: Boolean(attachments),
    success: send.success,
    error: send.error,
    is_resend: true,
  });
}

// ── V2 Action Handlers ────────────────────────────────────────────────────


/**
 * Start the automated email sequence for a provider.
 * Triggers Resend automation and moves to 'sequencing' status.
 */
async function handleStartSequence(
  outreach: StaffingOutreachRow,
  body: { recipientEmail?: string },
  userId: string,
) {
  const db = getServiceClient();

  // Get recipient email
  const recipientEmail = (
    body.recipientEmail?.trim() ||
    outreach.research_data.general_email ||
    ""
  ).trim();

  if (!recipientEmail) {
    throw new Error("No recipient email — set research_data.general_email first");
  }

  // Get provider and batch info
  const [{ data: provider }, { data: batch }] = await Promise.all([
    db.from("olera-providers")
      .select("provider_name, provider_id")
      .eq("provider_id", outreach.provider_id)
      .single(),
    db.from("staffing_batches")
      .select("university_name, university_slug")
      .eq("id", outreach.batch_id)
      .single(),
  ]);

  if (!provider) throw new Error("Provider not found");
  if (!batch) throw new Error("Batch not found");

  const serviceArea = getServiceArea(batch.university_slug);

  // Start the Resend automation
  const result = await startEmailSequence({
    email: recipientEmail,
    outreachId: outreach.id,
    providerId: outreach.provider_id,
    providerName: provider.provider_name,
    universityName: batch.university_name,
    serviceArea,
    batchId: outreach.batch_id,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to start email sequence");
  }

  // Update outreach status to sequencing
  // email1_sent_at is set immediately since we send directly (not via automation)
  const now = new Date().toISOString();
  await db
    .from("staffing_outreach")
    .update({
      status: "sequencing",
      sequence_started_at: now,
      email1_sent_at: now, // Email sent directly, not via automation
      sequence_email: recipientEmail,
      // Schedule auto-transition to needs_call after Email 2 + 3 days (6 days total)
      next_action_due_at: new Date(Date.now() + 6 * 86400_000).toISOString(),
      updated_at: now,
    })
    .eq("id", outreach.id);

  // Log touchpoint
  await insertTouchpoint(outreach.id, "sequence_email1_sent", userId, "Email 1 sent directly", {
    recipient_email: recipientEmail,
    resend_email_id: result.emailId,
    university: batch.university_name,
    service_area: serviceArea,
  });
}

/**
 * Skip the email sequence and move directly to needs_call.
 * Use when provider has no email or prefers phone contact.
 */
async function handleMoveToNeedsCall(
  outreach: StaffingOutreachRow,
  userId: string,
) {
  const db = getServiceClient();

  // Stop any active sequence (use sequence_email if available, fallback to research_data)
  const sequenceEmail = outreach.sequence_email || outreach.research_data.general_email;
  if (outreach.resend_automation_id && sequenceEmail) {
    await stopEmailSequence(sequenceEmail);
  }

  // Update status to needs_call
  await db
    .from("staffing_outreach")
    .update({
      status: "needs_call",
      next_action_due_at: new Date().toISOString(), // Due now
      updated_at: new Date().toISOString(),
    })
    .eq("id", outreach.id);

  // Log touchpoint
  await insertTouchpoint(outreach.id, "status_reverted", userId, "Skipped to calling", {
    from_status: outreach.status,
    to_status: "needs_call",
    reason: "Admin skipped email sequence",
  });
}

/**
 * Mark provider as closed.
 * Replaces the DNC workflow with a simpler status.
 */
async function handleMarkClosed(
  outreach: StaffingOutreachRow,
  body: { reason?: string },
  userId: string,
) {
  const db = getServiceClient();

  // Stop any active sequence (use sequence_email if available, fallback to research_data)
  const sequenceEmail = outreach.sequence_email || outreach.research_data.general_email;
  if (outreach.resend_automation_id && sequenceEmail) {
    await stopEmailSequence(sequenceEmail);
  }

  // Update status to closed
  await db
    .from("staffing_outreach")
    .update({
      status: "closed",
      next_action_due_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", outreach.id);

  // Log touchpoint
  await insertTouchpoint(outreach.id, "manual_dnc", userId, body.reason ?? null, {
    from_status: outreach.status,
    to_status: "closed",
    reason: body.reason ?? "Manually closed by admin",
  });
}

// ── State machine ───────────────────────────────────────────────────────

const MAX_CALL_ATTEMPTS = 6;

function computeCallTransition(
  outreach: StaffingOutreachRow,
  type: TouchpointType,
): { status: StaffingStatus; nextDueAt: string | null } {
  const newAttempts = outreach.attempts_count + 1;

  if (type === "call_wrong_number") {
    return { status: "wrong_number", nextDueAt: null };
  }

  if (type === "call_not_interested" || type === "manual_dnc") {
    return { status: "do_not_contact", nextDueAt: null };
  }

  if (type === "call_connected_no_consent") {
    return {
      status: "connected_no_consent",
      nextDueAt: new Date(Date.now() + 7 * 86400_000).toISOString(),
    };
  }

  // No answer / voicemail — follow up after 5 business days (~7 calendar days)
  if (newAttempts >= MAX_CALL_ATTEMPTS) {
    return { status: "do_not_contact", nextDueAt: null };
  }

  return {
    status: outreach.status === "queued" ? "pre_call_outreach" : outreach.status,
    nextDueAt: new Date(Date.now() + 7 * 86400_000).toISOString(),
  };
}

async function insertTouchpoint(
  outreachId: string,
  type: TouchpointType,
  createdBy: string | null,
  notes: string | null,
  payload: Record<string, unknown>,
) {
  const db = getServiceClient();
  await db.from("staffing_touchpoints").insert({
    outreach_id: outreachId,
    type,
    notes,
    payload,
    created_by: createdBy,
  });
}
