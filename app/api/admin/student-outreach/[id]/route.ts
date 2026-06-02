/**
 * GET    /api/admin/student-outreach/[id]   — drawer detail
 * POST   /api/admin/student-outreach/[id]   — actions, dispatched on body.action
 *
 * One endpoint, many actions. Every mutation logs a touchpoint and updates
 * the row's last_edited_*; every stage transition cancels obsolete tasks
 * and queues stage-entry tasks per state-machine.ts.
 *
 * Response shape: refreshed DrawerContext, so UI re-renders without a follow-up fetch.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  onStageEnter,
  tasksToCancelOnExit,
  validateTransition,
} from "@/lib/student-outreach/state-machine";
import { nextSeasonalDate } from "@/lib/student-outreach/seasonal";
import { type CadenceKey, type TemplateKey } from "@/lib/student-outreach/cadence";
import { getTemplate } from "@/lib/student-outreach/templates";
import {
  planSequence,
  defaultSnapshotsByVariant,
  defaultCallScriptsFor,
  type EmailSnapshot,
  type RecipientPlan,
  type CallScript,
} from "@/lib/student-outreach/sequencer";
import { executeEmailTask } from "@/lib/student-outreach/auto-send-executor";
import {
  buildSmartleadPreview,
  enrollRowIntoCampusCampaign,
  type BridgeRow,
  type NamedContact,
} from "@/lib/medjobs/smartlead-bridge";
import {
  deriveRepliesState,
  deriveStateFromTouchpoints,
  type TouchpointRow,
} from "@/lib/student-outreach/state-derivation";
import type {
  ApprovalStatus,
  ApprovalType,
  Campus,
  Contact,
  ContactPermission,
  ContactStatus,
  DistributionEvidence,
  DrawerContext,
  OutreachRow,
  ResearchData,
  StakeholderType,
  Status,
  TaskType,
  Touchpoint,
  TouchpointType,
  Channel,
} from "@/lib/student-outreach/types";

type DB = ReturnType<typeof getServiceClient>;
const DAY_MS = 86_400_000;

// ── GET ─────────────────────────────────────────────────────────────────

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

// ── POST ────────────────────────────────────────────────────────────────

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
    .from("student_outreach")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchErr || !outreach) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const row = outreach as OutreachRow;

  // ── Conversion routing map ──────────────────────────────────────────
  //
  // Provider rows (kind='provider') convert to Clients via make_client,
  // which writes business_profiles.metadata.interview_terms_accepted_at.
  // That metadata flag is what unlocks Partner Prospects for catchment
  // Sites (see lib/medjobs/partner-prospect-gate.ts).
  //
  // Stakeholder rows convert to Partners via mark_partner, which writes
  // distribution_evidence on the outreach row and queues the first
  // seasonal email.
  //
  // The two paths are NOT interchangeable. Picking mark_partner on a
  // provider row half-converts (sets active_partner status but never
  // unlocks Partner Prospects). All four Log surfaces gate this:
  //
  //   PROVIDER conversion (→ make_client):
  //     - LogCallOutcomeModal:  convert_to_client outcome (provider only)
  //     - CallForEmailModal:    convert_to_client engagement (provider modal)
  //     - ReplyClassifierModal: not offered (gated by !isProvider; convert
  //                             via Call modal or T&C/Stripe signal)
  //     - LogMeetingModal:      not offered (gated by !isProvider; convert
  //                             via Call modal — see R1 commit)
  //
  //   STAKEHOLDER conversion (→ mark_partner):
  //     - LogCallOutcomeModal:  convert_to_partner outcome (stakeholder only)
  //     - ReplyClassifierModal: committed classification (stakeholder only)
  //     - LogMeetingModal:      done_partner status (stakeholder only)
  //
  // Terminal closeouts (→ transitionStage to closed status):
  //   - mark_not_interested      → "not_interested"
  //   - mark_dnc                 → "do_not_contact"
  //   - mark_wrong_contact       → "wrong_contact"
  //   - mark_no_response_closed  → "no_response_closed" (auto-revives on
  //                                inbound email_replied — see handleLogReply)
  //   - reopen                   → flips closed rows back to engaged
  //
  // Every conversion + terminal action emits a stage_change touchpoint
  // and cancels obsolete tasks via tasksToCancelOnExit. Single-writer
  // discipline: all mutations route through here.

  try {
    switch (action) {
      // ── Field updates ───────────────────────────────────────────────
      case "update_research":
        await handleUpdateResearch(db, row, body, user.id);
        break;
      case "update_outreach":
        await handleUpdateOutreach(db, row, body, user.id);
        break;
      case "add_note":
        await handleAddNote(db, row, body, user.id);
        break;

      // ── Stage transitions ───────────────────────────────────────────
      case "mark_research_complete":
        await transitionStage(db, row, "researched", user.id);
        break;
      case "mark_engaged":
        await transitionStage(db, row, "engaged", user.id, body.notes);
        break;
      case "mark_meeting_scheduled":
        await handleMarkMeetingScheduled(db, row, body, user.id);
        break;
      case "flag_wants_meeting":
        await handleFlagWantsMeeting(db, row, body, user.id);
        break;
      case "mark_meeting_followup":
        await handleMarkMeetingFollowup(db, row, body, user.id);
        break;
      case "mark_partner":
      case "mark_active_partner":
        await handleMarkPartner(db, row, body, user.id);
        break;
      case "mark_not_interested":
        await transitionStage(db, row, "not_interested", user.id, body.notes);
        break;
      case "mark_dnc":
        await transitionStage(db, row, "do_not_contact", user.id, body.notes);
        break;
      case "mark_wrong_contact":
        await transitionStage(db, row, "wrong_contact", user.id, body.notes);
        break;
      case "mark_no_response_closed":
        await transitionStage(db, row, "no_response_closed", user.id, body.notes);
        break;
      case "reopen":
        await handleReopen(db, row, user.id);
        break;

      // ── Channel logs ────────────────────────────────────────────────
      case "log_email_sent":
        await handleLogTouch(db, row, body, user.id, "email_sent", "email");
        break;
      case "log_email_replied":
        await handleLogReply(db, row, body, user.id, "email_replied", "email");
        break;
      case "log_email_bounced":
        await handleLogTouch(db, row, body, user.id, "email_bounced", "email");
        break;
      case "log_call":
      case "log_call_outcome":
        // log_call_outcome is the name used by NextStepCard's
        // CallDueBody and the CallForEmailModal engagement bypass.
        // Both dispatch the same handler — aliasing here so either
        // name routes correctly without forcing a rename across the
        // FE call sites.
        await handleLogCall(db, row, body, user.id);
        break;
      case "classify_reply":
        await handleClassifyReply(db, row, body, user.id);
        break;
      case "log_ig_dm_sent":
        await handleLogTouch(db, row, body, user.id, "ig_dm_sent", "ig_dm");
        break;
      case "log_ig_dm_replied":
        await handleLogReply(db, row, body, user.id, "ig_dm_replied", "ig_dm");
        break;
      case "log_contact_form":
        await handleLogTouch(db, row, body, user.id, "contact_form_submitted", "contact_form");
        break;

      // ── Meetings ────────────────────────────────────────────────────
      case "log_meeting_held":
        await handleLogMeetingHeld(db, row, body, user.id);
        break;
      case "log_meeting_no_show":
        await handleLogTouch(db, row, body, user.id, "meeting_no_show", "meeting");
        break;
      case "log_meeting_rescheduled":
        await handleLogMeetingRescheduled(db, row, body, user.id);
        break;

      // ── Contacts ────────────────────────────────────────────────────
      case "add_contact":
        await handleAddContact(db, row, body, user.id);
        break;
      case "update_contact":
        await handleUpdateContact(db, row, body, user.id);
        break;
      case "mark_contact_stale":
      case "mark_contact_incorrect":
      case "mark_contact_no_longer_valid":
        await handleMarkContactStatus(db, row, body, user.id, action);
        break;

      // ── Approvals ───────────────────────────────────────────────────
      case "request_approval":
        await handleRequestApproval(db, row, body, user.id);
        break;
      case "resolve_approval":
        await handleResolveApproval(db, row, body, user.id);
        break;
      case "unlock_professors_via_dept":
        await handleUnlockProfessors(db, row, body, user.id);
        break;
      case "mark_job_board_posted":
        await handleMarkJobBoardPosted(db, row, user.id);
        break;

      // ── Tasks ───────────────────────────────────────────────────────
      case "complete_task":
        await handleCompleteTask(db, row, body, user.id);
        break;
      case "cancel_task":
        await handleCancelTask(db, row, body, user.id);
        break;
      case "reschedule_task":
        await handleRescheduleTask(db, row, body, user.id);
        break;
      case "queue_manual_task":
        await handleQueueManualTask(db, row, body, user.id);
        break;

      // v9 Phase 4: log a research call when there's no pending call
      // task (e.g. admin calling to obtain an email pre-launch).
      // Distinct from log_call because that handler claims a pending
      // task + applies stage transitions per outcome — this one just
      // emits the touchpoint, no other side effects. Lets the row
      // stay in prospect while admin works through call attempts.
      case "log_research_call":
        await handleLogResearchCall(db, row, body, user.id);
        break;

      // v9 Phase 9: enroll a newly-discovered contact into the
      // already-launched cadence. Admin chooses send-now-only vs
      // full-cadence vs informational; the handler queues the
      // appropriate per-recipient tasks (and inline-fires any
      // Day-0 emails) so the new recipient catches up without
      // disturbing other recipients' in-flight cadence.
      case "enroll_contact_in_cadence":
        await handleEnrollContactInCadence(db, row, body, user.id);
        break;

      // v9 final: per-outreach overrides for the General Contact
      // section (email/phone/fax/contact_form_url). Writes to
      // research_data.general_contact ONLY — never touches
      // student_outreach_contacts. Maintains the strict separation
      // between organization-level General Contact and named
      // Specific Contacts per the user's architecture spec.
      case "update_general_contact":
        await handleUpdateGeneralContact(db, row, body, user.id);
        break;

      // v9.x editable Business Name on the row itself. The
      // organization_name is materialized from business_profiles at row
      // creation but the directory data can be stale or wrong — admin
      // needs to be able to fix it during pre-flight research.
      case "update_organization_name":
        await handleUpdateOrganizationName(db, row, body, user.id);
        break;

      // v9.x single Decision Maker slot on `research_data.decision_maker`.
      // Replaces the multi-contact UI for new rows; legacy
      // student_outreach_contacts data remains readable.
      case "update_decision_maker":
        await handleUpdateDecisionMaker(db, row, body, user.id);
        break;

      // v9.x admin bypass of the Pre-Flight verification gate. Sets
      // research_data.pre_flight_overridden=true and emits a note_added
      // touchpoint for audit. Used when verification isn't possible
      // (already verified elsewhere, trusted source, leadership exception).
      case "override_pre_flight":
        await handleOverridePreFlight(db, row, body, user.id);
        break;

      // v9 final: log a contact-form Day 0 outcome. Admin picks
      // Submitted / Skipped / Not available from PreFlight or from
      // the post-launch banner. Writes a contact_form_submitted
      // touchpoint regardless of outcome (the payload.outcome
      // carries the distinction). Idempotency lives at the UI
      // level — drawer hides the banner once one exists.
      case "log_contact_form_outcome":
        await handleLogContactFormOutcome(db, row, body, user.id);
        break;

      // v9 Make Client — provider conversion. Writes
      // business_profiles.metadata.interview_terms_accepted_at,
      // transitions the outreach row to active_partner so its
      // canonical Stage derives to "converted", and logs a
      // stage_change touchpoint. The metadata write closes the
      // funnel loop — the Partner-Prospect gate (lib/medjobs/
      // partner-prospect-gate.ts) auto-unlocks on the next read
      // for any Site whose catchment includes this provider.
      case "make_client":
        await handleMakeClient(db, row, user.id);
        break;

      // ── Snooze / redirect ───────────────────────────────────────────
      case "snooze":
        await handleSnooze(db, row, body, user.id);
        break;

      // ── v4 auto-send outreach ───────────────────────────────────────
      case "schedule_sequence":
        await handleScheduleSequence(db, row, body, user.id);
        break;
      case "offer_call":
        await handleOfferCall(db, row, body, user.id);
        break;
      case "edit_pending_email":
        await handleEditPendingEmail(db, row, body, user.id);
        break;
      case "skip_pending_email":
        await handleSkipPendingEmail(db, row, body, user.id);
        break;
      case "mark_engaged_bulk":
        await handleMarkEngagedBulk(db, body, user.id);
        break;

      // ── v9.0 Phase 4: read state ─────────────────────────────────
      // mark_read is fired by the workflow drawer on first mount per
      // outreach id. mark_unread is fired from the row overflow menu
      // or the drawer overflow menu to reset attention. Both write
      // viewed_at directly with no touchpoint — we don't want every
      // drawer open polluting History.
      case "mark_read":
        await db
          .from("student_outreach")
          .update({ viewed_at: new Date().toISOString(), last_edited_by: user.id })
          .eq("id", row.id)
          .is("viewed_at", null);
        break;
      case "mark_unread":
        await db
          .from("student_outreach")
          .update({ viewed_at: null, last_edited_by: user.id })
          .eq("id", row.id);
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

// ── Loader ──────────────────────────────────────────────────────────────

async function loadDrawerContext(outreachId: string): Promise<DrawerContext | null> {
  const db = getServiceClient();

  const { data: outreach } = await db
    .from("student_outreach")
    .select("*")
    .eq("id", outreachId)
    .single();
  if (!outreach) return null;
  const row = outreach as OutreachRow & { stakeholder_type: StakeholderType | null };
  // v9.0 Phase 2 Tier 3.5: kind='provider' rows have stakeholder_type
  // NULL. Coerce to 'student_org' so the drawer's existing render paths
  // don't trip; kind-aware surfaces read `kind` first.
  if (row.stakeholder_type == null) {
    row.stakeholder_type = "student_org";
  }

  const [
    { data: campus },
    { data: contacts },
    { data: touchpoints },
    { data: approvals },
    { data: pending_tasks },
    referredFrom,
    redirectedTo,
    permissionDep,
  ] = await Promise.all([
    db.from("student_outreach_campuses").select("*").eq("id", row.campus_id).single(),
    db
      .from("student_outreach_contacts")
      .select("*")
      .eq("outreach_id", outreachId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true }),
    db
      .from("student_outreach_touchpoints")
      .select("*")
      .eq("outreach_id", outreachId)
      .order("created_at", { ascending: false })
      .limit(100),
    db
      .from("student_outreach_approvals")
      .select("*")
      .eq("outreach_id", outreachId)
      .order("requested_at", { ascending: false }),
    db
      .from("student_outreach_tasks")
      .select("*")
      .eq("outreach_id", outreachId)
      .eq("status", "pending")
      .order("due_at", { ascending: true }),
    row.referred_from_id
      ? db
          .from("student_outreach")
          .select("id, organization_name, stakeholder_type")
          .eq("id", row.referred_from_id)
          .single()
      : Promise.resolve({ data: null }),
    row.redirected_to_id
      ? db
          .from("student_outreach")
          .select("id, organization_name, stakeholder_type")
          .eq("id", row.redirected_to_id)
          .single()
      : Promise.resolve({ data: null }),
    row.permission_dependency_id
      ? db
          .from("student_outreach")
          .select("id, organization_name, stakeholder_type, status")
          .eq("id", row.permission_dependency_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  if (!campus) return null;

  // Hydrate admin first names for any user IDs referenced by touchpoints,
  // tasks, approvals, contacts, or the outreach row itself. Keeps history
  // narration self-contained without follow-up fetches.
  const adminIds = new Set<string>();
  for (const t of (touchpoints ?? []) as Array<{ created_by: string | null }>) {
    if (t.created_by) adminIds.add(t.created_by);
  }
  if (row.last_edited_by) adminIds.add(row.last_edited_by);
  if (row.created_by) adminIds.add(row.created_by);

  const adminFirstNames: Record<string, string> = {};
  if (adminIds.size > 0) {
    const { data: admins } = await db
      .from("admin_users")
      .select("user_id, email")
      .in("user_id", Array.from(adminIds));
    for (const a of (admins ?? []) as Array<{ user_id: string; email: string }>) {
      adminFirstNames[a.user_id] = firstNameFromEmail(a.email);
    }
  }

  // v8.3: derive state for the drawer's NextStepPanel guidance. Same
  // function the queue endpoint uses, so the drawer and the row card
  // agree on what state the row is in.
  const tpRows: TouchpointRow[] = ((touchpoints ?? []) as Array<{
    touchpoint_type: string;
    payload: Record<string, unknown> | null;
    notes: string | null;
    created_at: string;
    created_by: string | null;
  }>).map((tp) => ({
    outreach_id: row.id,
    touchpoint_type: tp.touchpoint_type,
    payload: tp.payload,
    notes: tp.notes,
    created_at: tp.created_at,
    created_by: tp.created_by,
  }));
  const derived = deriveStateFromTouchpoints(tpRows);
  const hasPendingEmailTask = (pending_tasks ?? []).some(
    (t) => (t as { task_type: string }).task_type === "outreach_email_send",
  );
  const repliesState =
    row.status === "outreach_sent" || row.status === "engaged"
      ? deriveRepliesState(derived, hasPendingEmailTask)
      : null;

  // Provider-prospect drawers need the catchment provider's email to
  // surface as auto-populated in the Launch outreach field. Fetch it
  // only when this row represents a materialized provider prospect.
  // v9: metadata included so NextStepCard's stage derivation can detect
  // Client conversion (interview_terms_accepted_at / medjobs_subscription_active).
  let providerBusinessProfile: {
    email: string | null;
    display_name: string | null;
    city: string | null;
    state: string | null;
    metadata: Record<string, unknown> | null;
    slug: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    zip: string | null;
  } | null = null;
  if (row.kind === "provider" && row.provider_business_profile_id) {
    // v9 final: pull the bp row + zip (was missing) + source_provider_id
    // so we can fall back to the iOS olera-providers record when the
    // bp row hasn't been enriched with a full address yet. Public
    // provider pages already use the iOS data when available; the
    // drawer matches that source-of-truth so admin sees the same
    // info during pre-flight that prospects see on the live page.
    const { data: bpRow } = await db
      .from("business_profiles")
      .select(
        "email, display_name, city, state, zip, metadata, slug, phone, website, address, source_provider_id",
      )
      .eq("id", row.provider_business_profile_id)
      .maybeSingle();
    const bp = bpRow as
      | {
          email: string | null;
          display_name: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          metadata: Record<string, unknown> | null;
          slug: string | null;
          phone: string | null;
          website: string | null;
          address: string | null;
          source_provider_id: string | null;
        }
      | null;

    let iosFallback: {
      address: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
      phone: string | null;
      email: string | null;
      website: string | null;
    } | null = null;
    if (bp?.source_provider_id) {
      const { data: ios } = await db
        .from("olera-providers")
        .select("address, city, state, zipcode, phone, email, website")
        .eq("provider_id", bp.source_provider_id)
        .maybeSingle();
      if (ios) {
        const i = ios as {
          address: string | null;
          city: string | null;
          state: string | null;
          zipcode: number | string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
        };
        iosFallback = {
          address: i.address ?? null,
          city: i.city ?? null,
          state: i.state ?? null,
          zip: i.zipcode != null ? String(i.zipcode) : null,
          phone: i.phone ?? null,
          email: i.email ?? null,
          website: i.website ?? null,
        };
      }
    }

    if (bp) {
      // bp values win; iOS fills the gaps. Lets admin see the same
      // operational data their target sees on the public listing.
      providerBusinessProfile = {
        email: bp.email ?? iosFallback?.email ?? null,
        display_name: bp.display_name ?? null,
        city: bp.city ?? iosFallback?.city ?? null,
        state: bp.state ?? iosFallback?.state ?? null,
        metadata: bp.metadata ?? null,
        slug: bp.slug ?? null,
        phone: bp.phone ?? iosFallback?.phone ?? null,
        website: bp.website ?? iosFallback?.website ?? null,
        address: bp.address ?? iosFallback?.address ?? null,
        zip: bp.zip ?? iosFallback?.zip ?? null,
      };
    }
  }

  // v9 timeline engagement chips: collect email_log_ids from every
  // email_sent touchpoint's payload, fetch their denormalized
  // engagement columns in one query, and keyed return for the
  // OutreachTimeline to consume. Empty when no email sends exist
  // (pre-launch rows). Skips the fetch entirely if no log ids
  // present — minimal cost.
  const emailLogIds = ((touchpoints ?? []) as Touchpoint[])
    .filter((t) => t.touchpoint_type === "email_sent")
    .map((t) => (t.payload as Record<string, unknown> | null)?.email_log_id)
    .filter((v): v is string => typeof v === "string");
  const emailEngagement: DrawerContext["email_engagement"] = {};
  if (emailLogIds.length > 0) {
    const { data: logs } = await db
      .from("email_log")
      .select(
        "id, delivered_at, first_opened_at, first_clicked_at, bounced_at, complained_at, last_event_type",
      )
      .in("id", emailLogIds);
    for (const l of (logs ?? []) as Array<{
      id: string;
      delivered_at: string | null;
      first_opened_at: string | null;
      first_clicked_at: string | null;
      bounced_at: string | null;
      complained_at: string | null;
      last_event_type: string | null;
    }>) {
      emailEngagement[l.id] = {
        delivered_at: l.delivered_at,
        first_opened_at: l.first_opened_at,
        first_clicked_at: l.first_clicked_at,
        bounced_at: l.bounced_at,
        complained_at: l.complained_at,
        last_event_type: l.last_event_type,
      };
    }
  }

  // Smartlead-native preview — what will actually ship at launch. Built
  // for every MedJobs cadence (provider + stakeholder) when the row has
  // at least one usable recipient. Same lead-construction path as
  // enrollRowIntoSmartlead so the preview matches what the server will
  // enroll. Provider rows: General Contact + Decision Maker (max 2 leads).
  // Stakeholder rows: no general-contact concept; the Decision Maker slot
  // (or legacy student_outreach_contacts data, if no Decision Maker is set
  // yet) carries the named recipients.
  const previewDm = row.research_data?.decision_maker;
  const previewContacts: NamedContact[] = [];
  if (
    previewDm &&
    !previewDm.unavailable &&
    previewDm.email &&
    previewDm.email.trim()
  ) {
    const [first, ...rest] = (previewDm.name ?? "").trim().split(/\s+/);
    previewContacts.push({
      contact_id: `dm:${row.id}`,
      email: previewDm.email.trim(),
      first_name: first || null,
      last_name: rest.length > 0 ? rest.join(" ") : null,
      title: null,
      role: previewDm.role ?? null,
    });
  } else if (!previewDm) {
    // Backward-compat for rows enrolled BEFORE the Decision Maker
    // migration — surface existing student_outreach_contacts entries
    // (active, email present, not General Office/Inbox) as preview
    // recipients so the modal doesn't suddenly hide leads the cron is
    // still managing.
    for (const c of (contacts ?? []) as Contact[]) {
      if (c.status !== "active") continue;
      if (!c.email || !c.email.trim()) continue;
      if (c.role === "General Office" || c.role === "General Inbox") continue;
      previewContacts.push({
        contact_id: c.id,
        email: c.email,
        first_name: c.first_name,
        last_name: c.last_name,
        title: c.title,
        role: c.role,
      });
    }
  }
  const gc = row.research_data?.general_contact;
  const previewRow: BridgeRow = {
    outreach_id: row.id,
    kind: row.kind,
    status: row.status,
    organization_name: row.organization_name,
    city: gc?.city ?? (campus?.city ?? null),
    email: gc?.email ?? null,
    first_name: null,
    already_enrolled: typeof row.research_data?.smartlead?.campaign_id === "number",
    contacts: previewContacts,
  };
  const yyyymm = new Date().toISOString().slice(0, 7);
  const campusName = campus?.name ?? "Unknown Campus";
  const campusCity = campus?.city ?? null;
  const cadenceKey: CadenceKey =
    row.kind === "provider" ? "provider" : row.stakeholder_type;
  let smartleadPreviewSnapshot: DrawerContext["smartlead_preview"] = null;
  if (previewRow.email || previewContacts.length > 0) {
    smartleadPreviewSnapshot = buildSmartleadPreview({
      row: previewRow,
      campus: { name: campusName, city: campusCity, slug: (campus as { slug?: string | null } | null)?.slug ?? null },
      campaignName: `MedJobs — ${campusName} — ${yyyymm}`,
      cadenceKey,
    });
  }

  return {
    outreach: row,
    campus: campus as Campus,
    contacts: (contacts ?? []) as DrawerContext["contacts"],
    touchpoints: (touchpoints ?? []) as DrawerContext["touchpoints"],
    approvals: (approvals ?? []) as DrawerContext["approvals"],
    pending_tasks: (pending_tasks ?? []) as DrawerContext["pending_tasks"],
    referred_from: (referredFrom.data ?? null) as DrawerContext["referred_from"],
    redirected_to: (redirectedTo.data ?? null) as DrawerContext["redirected_to"],
    permission_dependency: (permissionDep.data ?? null) as DrawerContext["permission_dependency"],
    admin_first_names: adminFirstNames,
    replies_state: repliesState,
    meeting_state: derived.meeting_state,
    meeting_at: derived.meeting_at,
    followup_notes: derived.followup_notes,
    awaiting_callback_at: derived.awaiting_callback_at,
    awaiting_callback_kind: derived.awaiting_callback_kind,
    provider_business_profile: providerBusinessProfile,
    email_engagement: emailEngagement,
    smartlead_preview: smartleadPreviewSnapshot,
  };
}

function firstNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  // "tj.alohun" → "Tj"; "logan" → "Logan"
  const first = local.split(/[._-]/)[0] ?? local;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

// ── Core helpers ────────────────────────────────────────────────────────

async function insertTouchpoint(
  db: DB,
  outreachId: string,
  type: TouchpointType,
  createdBy: string | null,
  fields: {
    notes?: string | null;
    payload?: Record<string, unknown>;
    contact_id?: string | null;
    channel?: Channel | null;
    outcome?: string | null;
  } = {},
) {
  await db.from("student_outreach_touchpoints").insert({
    outreach_id: outreachId,
    contact_id: fields.contact_id ?? null,
    touchpoint_type: type,
    channel: fields.channel ?? null,
    outcome: fields.outcome ?? null,
    notes: fields.notes ?? null,
    payload: fields.payload ?? {},
    created_by: createdBy,
  });

  // v9.0 Phase 4: every new touchpoint resets the row to unread, so
  // admins see the row freshly bolded after a state change (stage
  // transition, reply received, call logged, etc.). The drawer will
  // re-mark it read on next open. mark_read / mark_unread actions
  // don't write touchpoints, so this doesn't fight them.
  await db
    .from("student_outreach")
    .update({ viewed_at: null })
    .eq("id", outreachId);
}

async function touchOutreach(
  db: DB,
  outreachId: string,
  userId: string,
  patch: Record<string, unknown> = {},
) {
  await db
    .from("student_outreach")
    .update({
      ...patch,
      last_edited_by: userId,
      last_edited_at: new Date().toISOString(),
    })
    .eq("id", outreachId);
}

async function cancelTasksByType(
  db: DB,
  outreachId: string,
  taskTypes: TaskType[],
  userId: string,
) {
  if (taskTypes.length === 0) return;
  const { data: cancelled } = await db
    .from("student_outreach_tasks")
    .update({ status: "superseded", completed_at: new Date().toISOString(), completed_by: userId })
    .eq("outreach_id", outreachId)
    .eq("status", "pending")
    .in("task_type", taskTypes)
    .select("id");
  if (cancelled && cancelled.length > 0) {
    await insertTouchpoint(db, outreachId, "task_superseded", userId, {
      payload: { cancelled_task_ids: cancelled.map((c) => (c as { id: string }).id), reason: "stage_change" },
    });
  }
}

async function queueTask(
  db: DB,
  outreachId: string,
  task: { task_type: TaskType; due_at: Date; payload?: Record<string, unknown> },
  userId: string,
  approval_id: string | null = null,
) {
  await db.from("student_outreach_tasks").insert({
    outreach_id: outreachId,
    approval_id,
    task_type: task.task_type,
    due_at: task.due_at.toISOString(),
    payload: task.payload ?? {},
    created_by: userId,
  });
}

/**
 * Stage-transition primitive: validate, cancel obsolete tasks, update row,
 * log stage_change touchpoint, queue new entry tasks via state-machine.
 */
async function transitionStage(
  db: DB,
  row: OutreachRow,
  to: Status,
  userId: string,
  notes?: string | null,
  extraPatch: Record<string, unknown> = {},
) {
  if (row.status === to && Object.keys(extraPatch).length === 0) return;
  const { ok, reason } = validateTransition(row.status, to);
  if (!ok) throw new Error(reason ?? "Illegal transition");

  // Cancel obsolete tasks for the stage we're leaving.
  await cancelTasksByType(db, row.id, tasksToCancelOnExit(row.status), userId);

  // Apply state-machine entry effects.
  const effects = onStageEnter(to, { stakeholderType: row.stakeholder_type });
  await touchOutreach(db, row.id, userId, {
    status: to,
    ...(effects.fieldsToUpdate ?? {}),
    ...extraPatch,
  });

  await insertTouchpoint(db, row.id, "stage_change", userId, {
    notes: notes ?? null,
    payload: { from: row.status, to },
  });

  if (effects.taskToQueue) {
    await queueTask(db, row.id, effects.taskToQueue, userId);
  }
}

// ── Field-update handlers ───────────────────────────────────────────────

async function handleUpdateResearch(
  db: DB,
  row: OutreachRow,
  body: { research?: Record<string, unknown> },
  userId: string,
) {
  const merged = { ...row.research_data, ...(body.research ?? {}) };
  await touchOutreach(db, row.id, userId, { research_data: merged });
  await insertTouchpoint(db, row.id, "note_added", userId, {
    payload: { fields_updated: Object.keys(body.research ?? {}) },
  });
}

async function handleUpdateOutreach(
  db: DB,
  row: OutreachRow,
  body: {
    organization_name?: string;
    department?: string | null;
    programs?: string[];
    notes?: string | null;
  },
  userId: string,
) {
  const patch: Record<string, unknown> = {};
  if (typeof body.organization_name === "string" && body.organization_name.trim()) {
    patch.organization_name = body.organization_name.trim();
  }
  if (body.department !== undefined) patch.department = body.department || null;
  if (Array.isArray(body.programs)) patch.programs = body.programs;
  if (body.notes !== undefined) patch.notes = body.notes;

  // v8.7.1: when a dept head's department changes, auto-update the
  // organization_name to match (unless the caller explicitly passed
  // an organization_name to override). Keeps the card title in sync
  // with the source-of-truth field.
  if (
    row.stakeholder_type === "dept_head" &&
    body.department !== undefined &&
    typeof patch.organization_name !== "string"
  ) {
    const dept = (body.department ?? "").trim();
    if (dept) {
      patch.organization_name = `${dept} Department`;
    }
  }

  if (Object.keys(patch).length === 0) return;
  await touchOutreach(db, row.id, userId, patch);
}

/**
 * v9 final: merge a General Contact override into research_data.
 * Each field is null|string — null clears the override (falls back
 * to business_profiles); string sets the override. Other research_
 * data keys are preserved. Never touches student_outreach_contacts.
 */
async function handleUpdateGeneralContact(
  db: DB,
  row: OutreachRow,
  body: {
    email?: string | null;
    phone?: string | null;
    fax?: string | null;
    contact_form_url?: string | null;
    website?: string | null;
    /** v9.x Google Business Profile URL — research signal for pre-flight. */
    google_business_profile_url?: string | null;
    /** v9 final: structured address. Each field is independently
     *  updatable so admin can fix a single ZIP without re-typing
     *  the whole address. */
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    /** v9.x "Mark not available" overrides. Each flag, when set true,
     *  satisfies the matching research-card row without an actual value. */
    fax_unavailable?: boolean;
    contact_form_unavailable?: boolean;
    website_unavailable?: boolean;
    google_business_profile_unavailable?: boolean;
    phone_unavailable?: boolean;
    email_unavailable?: boolean;
    address_unavailable?: boolean;
  },
  userId: string,
) {
  const current = (row.research_data ?? {}) as ResearchData;
  const currentGc = current.general_contact ?? {};
  const nextGc: ResearchData["general_contact"] = { ...currentGc };
  for (const k of [
    "email",
    "phone",
    "fax",
    "contact_form_url",
    "website",
    "google_business_profile_url",
    "street",
    "city",
    "state",
    "zip",
  ] as const) {
    if (body[k] === undefined) continue;
    const value = body[k];
    if (value === null || (typeof value === "string" && value.trim() === "")) {
      nextGc[k] = null;
    } else if (typeof value === "string") {
      nextGc[k] = value.trim();
    }
  }
  for (const flag of [
    "fax_unavailable",
    "contact_form_unavailable",
    "website_unavailable",
    "google_business_profile_unavailable",
    "phone_unavailable",
    "email_unavailable",
    "address_unavailable",
  ] as const) {
    if (typeof body[flag] === "boolean") {
      nextGc[flag] = body[flag];
    }
  }
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    throw new Error("Invalid email");
  }
  if (body.zip && !/^\d{5}(?:-\d{4})?$/.test(body.zip.trim())) {
    throw new Error("ZIP must be 5 digits (or 5+4)");
  }
  const nextResearch: ResearchData = { ...current, general_contact: nextGc };
  await touchOutreach(db, row.id, userId, { research_data: nextResearch });
}

/**
 * v9.x update the row's organization_name directly. Directory data can be
 * stale or wrong; admin needs to correct it during pre-flight research so
 * outreach emails, snapshots, and the Smartlead campaign carry the right
 * brand. Writes to the row's column (not research_data) — this is the
 * canonical org name everything else reads from.
 */
async function handleUpdateOrganizationName(
  db: DB,
  row: OutreachRow,
  body: { organization_name?: string | null },
  userId: string,
) {
  const next = (body.organization_name ?? "").trim();
  if (!next) throw new Error("Business name cannot be empty");
  if (next === row.organization_name) return;
  await touchOutreach(db, row.id, userId, { organization_name: next });
}

/**
 * v9.x admin bypass of the Pre-Flight verification gate. Stamps
 * `research_data.pre_flight_overridden=true` and emits a note_added
 * touchpoint with `payload.reason="pre_flight_override"` so the audit
 * trail is clear. The Launch gate AND's verification with email-on-file
 * regardless, so an override without an email still can't ship outreach.
 */
async function handleOverridePreFlight(
  db: DB,
  row: OutreachRow,
  body: { notes?: string | null },
  userId: string,
) {
  const current = (row.research_data ?? {}) as ResearchData;
  if (current.pre_flight_overridden === true) {
    // Idempotent — already overridden, no-op.
    return;
  }
  const nextResearch: ResearchData = { ...current, pre_flight_overridden: true };
  await touchOutreach(db, row.id, userId, { research_data: nextResearch });
  await insertTouchpoint(db, row.id, "note_added", userId, {
    channel: "system",
    notes: body.notes?.trim() || "Pre-Flight overridden by admin",
    payload: { reason: "pre_flight_override" },
  });
}

/**
 * v9.x update the single Decision Maker slot on `research_data.decision_maker`.
 * Replaces the multi-contact UX for new rows. Existing
 * `student_outreach_contacts` rows remain readable as a legacy section in
 * the SnapshotCard. The Smartlead bridge fan-out emails General Contact +
 * Decision Maker (max 2 leads per row) instead of N+1.
 */
async function handleUpdateDecisionMaker(
  db: DB,
  row: OutreachRow,
  body: {
    name?: string | null;
    role?: string | null;
    phone?: string | null;
    email?: string | null;
    unavailable?: boolean;
  },
  userId: string,
) {
  const current = (row.research_data ?? {}) as ResearchData;
  const currentDm = current.decision_maker ?? {};
  const nextDm: NonNullable<ResearchData["decision_maker"]> = { ...currentDm };
  for (const k of ["name", "role", "phone", "email"] as const) {
    if (body[k] === undefined) continue;
    const value = body[k];
    if (value === null || (typeof value === "string" && value.trim() === "")) {
      nextDm[k] = null;
    } else if (typeof value === "string") {
      nextDm[k] = value.trim();
    }
  }
  if (typeof body.unavailable === "boolean") {
    nextDm.unavailable = body.unavailable;
  }
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    throw new Error("Invalid Decision Maker email");
  }
  const nextResearch: ResearchData = { ...current, decision_maker: nextDm };
  await touchOutreach(db, row.id, userId, { research_data: nextResearch });
}

/**
 * v9 final: log a contact-form Day 0 outcome. Three outcomes —
 * 'submitted' (admin filled the form), 'skipped' (URL exists but
 * admin chose not to use it), 'not_available' (no usable form on
 * the URL). All three emit a contact_form_submitted touchpoint so
 * the OutreachTimeline narrates it and deriveStage / drawer banners
 * pick it up via a simple "any prior outcome?" check.
 */
async function handleLogContactFormOutcome(
  db: DB,
  row: OutreachRow,
  body: { outcome?: string; url?: string | null; notes?: string | null },
  userId: string,
) {
  const allowed = new Set(["submitted", "skipped", "not_available"]);
  const outcome = (body.outcome ?? "").trim();
  if (!allowed.has(outcome)) {
    throw new Error("outcome must be submitted | skipped | not_available");
  }
  const url = (body.url ?? "").trim() || null;
  await insertTouchpoint(db, row.id, "contact_form_submitted", userId, {
    channel: "contact_form",
    outcome,
    notes: body.notes?.trim() || null,
    payload: { url, outcome },
  });
  await touchOutreach(db, row.id, userId);
}

async function handleAddNote(
  db: DB,
  row: OutreachRow,
  body: { notes?: string },
  userId: string,
) {
  if (!body.notes?.trim()) throw new Error("Note text required");
  await insertTouchpoint(db, row.id, "note_added", userId, { notes: body.notes.trim() });
  await touchOutreach(db, row.id, userId);
}

// ── Stage-specific handlers ─────────────────────────────────────────────

/**
 * v7: log that a meeting is on the calendar (Calendly auto-booked or
 * admin manually created in Google Cal). No stage transition — meeting
 * state lives purely in touchpoint payloads. Marks engaged if not yet.
 */
async function handleMarkMeetingScheduled(
  db: DB,
  row: OutreachRow,
  body: { meeting_at?: string; notes?: string },
  userId: string,
) {
  let meetingAt: Date | null = null;
  if (body.meeting_at) {
    meetingAt = new Date(body.meeting_at);
    if (isNaN(meetingAt.getTime())) throw new Error("Invalid meeting_at");
  }

  // Ensure the row is engaged (cancels remaining cadence).
  if (row.status === "outreach_sent" || row.status === "researched" || row.status === "prospect") {
    await transitionStage(db, row, "engaged", userId, "meeting scheduled");
  }

  await insertTouchpoint(db, row.id, "meeting_scheduled", userId, {
    channel: "meeting",
    notes: body.notes ?? null,
    payload: meetingAt
      ? { meeting_at: meetingAt.toISOString() }
      : { meeting_at: null },
  });

  // v8.8: meeting on the calendar means the conversation has moved on —
  // stop both email and call cadences.
  await supersedePendingOutreachEmails(db, row.id, userId);
  await supersedePendingFollowupCalls(db, row.id, userId, "meeting_scheduled");
  await touchOutreach(db, row.id, userId);
}

/**
 * v7: admin saw a reply expressing interest in a meeting — flag the row
 * as "wants meeting (in flight)". Surfaces in Meetings tab as
 * "Finding a time" and stays in Replies for ongoing email coordination.
 */
async function handleFlagWantsMeeting(
  db: DB,
  row: OutreachRow,
  body: { notes?: string; no_show?: boolean },
  userId: string,
) {
  // Mark engaged if not yet — cancels cadence so we're not still emailing
  // while coordinating a meeting.
  if (row.status === "outreach_sent" || row.status === "researched" || row.status === "prospect") {
    await transitionStage(db, row, "engaged", userId, "wants a meeting");
  }
  // P6: when the admin is logging a no-show / cancellation that they're
  // about to reschedule, emit the existing meeting_no_show touchpoint
  // FIRST so the timeline shows the no-show event. Then the
  // note_added{reason: meeting_in_flight} below lands as the most
  // recent touchpoint — state-derivation's DESC scan hits it first
  // and keeps meeting_state = "in_flight" so the row stays in the
  // Meetings queue ready to be rebooked.
  if (body.no_show) {
    await insertTouchpoint(db, row.id, "meeting_no_show", userId, {
      channel: "meeting",
      notes: body.notes ?? null,
    });
  }
  await insertTouchpoint(db, row.id, "note_added", userId, {
    notes: body.notes ?? null,
    payload: { reason: "meeting_in_flight" },
  });
  // v8.8: coordinating a meeting now — stop both email and call cadences.
  await supersedePendingOutreachEmails(db, row.id, userId);
  await supersedePendingFollowupCalls(db, row.id, userId, "wants_meeting");
  await touchOutreach(db, row.id, userId);
}

/**
 * v7: meeting happened — admin wants to keep the row in dialogue (NOT
 * graduate to Active Partner). Logs the meeting outcome notes which
 * surface in the Replies tab so the team knows context for follow-up.
 */
async function handleMarkMeetingFollowup(
  db: DB,
  row: OutreachRow,
  body: { notes?: string },
  userId: string,
) {
  if (!body.notes?.trim()) throw new Error("Follow-up notes required so the team has context");
  await insertTouchpoint(db, row.id, "meeting_held", userId, {
    channel: "meeting",
    outcome: "needs_followup",
    notes: body.notes.trim(),
  });
  await insertTouchpoint(db, row.id, "note_added", userId, {
    notes: body.notes.trim(),
    payload: { reason: "post_meeting_followup", notes: body.notes.trim() },
  });
  await touchOutreach(db, row.id, userId);
}

async function handleLogMeetingHeld(
  db: DB,
  row: OutreachRow,
  body: { outcome?: string; notes?: string },
  userId: string,
) {
  await insertTouchpoint(db, row.id, "meeting_held", userId, {
    channel: "meeting",
    outcome: body.outcome ?? null,
    notes: body.notes ?? null,
  });
  // Cancel the "log meeting" task that fired this.
  await db
    .from("student_outreach_tasks")
    .update({ status: "completed", completed_at: new Date().toISOString(), completed_by: userId })
    .eq("outreach_id", row.id)
    .eq("status", "pending")
    .eq("task_type", "meeting_held_logging");
  await touchOutreach(db, row.id, userId);
}

async function handleLogMeetingRescheduled(
  db: DB,
  row: OutreachRow,
  body: { meeting_at?: string; notes?: string },
  userId: string,
) {
  if (!body.meeting_at) throw new Error("meeting_at required");
  const meetingAt = new Date(body.meeting_at);
  if (isNaN(meetingAt.getTime())) throw new Error("Invalid meeting_at");

  // Reschedule the existing meeting_held_logging task.
  await db
    .from("student_outreach_tasks")
    .update({ due_at: meetingAt.toISOString() })
    .eq("outreach_id", row.id)
    .eq("status", "pending")
    .eq("task_type", "meeting_held_logging");

  const research = { ...row.research_data, meeting_at: meetingAt.toISOString() };
  await touchOutreach(db, row.id, userId, { research_data: research });

  await insertTouchpoint(db, row.id, "meeting_rescheduled", userId, {
    channel: "meeting",
    notes: body.notes ?? null,
    payload: { meeting_at: meetingAt.toISOString() },
  });
}

/**
 * The unified "Mark as Partner" graduation. Replaces the v1
 * mark_agreed + mark_distributed pair: one stage (active_partner),
 * with evidence captured on the row + as a touchpoint.
 *
 * Auto-queues the first seasonal check-in and (for student orgs) the
 * yearly leadership recheck.
 */
async function handleMarkPartner(
  db: DB,
  row: OutreachRow,
  body: { evidence?: DistributionEvidence; evidence_notes?: string; notes?: string },
  userId: string,
) {
  if (!body.evidence) throw new Error("evidence required");
  await transitionStage(db, row, "active_partner", userId, body.notes, {
    distribution_evidence: body.evidence,
    distribution_evidence_notes: body.evidence_notes ?? null,
  });
  await insertTouchpoint(db, row.id, "distribution_confirmed", userId, {
    notes: body.evidence_notes ?? null,
    payload: { evidence: body.evidence },
  });

  // v4: queue the first seasonal email as an outreach_email_send task
  // with a snapshot of the seasonal template body. The cron picks it
  // up, sends, and queues the next seasonal automatically.
  const { data: campus } = await db
    .from("student_outreach_campuses")
    .select("name")
    .eq("id", row.campus_id)
    .single();
  const seasonal = nextSeasonalDate(new Date());
  const tpl = getTemplate("seasonal", {
    stakeholder_type: row.stakeholder_type,
    organization_name: row.organization_name,
    campus_name: (campus as { name: string } | null)?.name ?? "your campus",
  });
  await queueTask(
    db,
    row.id,
    {
      task_type: "outreach_email_send",
      due_at: seasonal.due_at,
      payload: {
        day: -1,
        template: "seasonal" as TemplateKey,
        season: seasonal.label,
        subject: tpl.subject,
        body: tpl.body,
      },
    },
    userId,
  );

  // Yearly leadership recheck for student orgs (officer turnover).
  if (row.stakeholder_type === "student_org") {
    await queueTask(
      db,
      row.id,
      {
        task_type: "yearly_leadership_recheck",
        due_at: new Date(Date.now() + 365 * DAY_MS),
      },
      userId,
    );
  }
}

async function handleReopen(db: DB, row: OutreachRow, userId: string) {
  if (row.status !== "no_response_closed" && row.status !== "wrong_contact") {
    throw new Error(`Cannot reopen from status "${row.status}"`);
  }
  // Reset cadence and go back to researched (admin already did the research before closing).
  await touchOutreach(db, row.id, userId, {
    status: "researched",
    cadence_day: 0,
    reopen_at: null,
    snoozed_until: null,
  });
  await insertTouchpoint(db, row.id, "stage_change", userId, {
    payload: { from: row.status, to: "researched", reopen: true },
  });
  // Queue Day 0 again.
  await queueTask(
    db,
    row.id,
    { task_type: "outreach_day_0", due_at: new Date() },
    userId,
  );
}

// ── Channel logging ─────────────────────────────────────────────────────

async function handleLogTouch(
  db: DB,
  row: OutreachRow,
  body: { contact_id?: string; outcome?: string; notes?: string; payload?: Record<string, unknown> },
  userId: string,
  type: TouchpointType,
  channel: Channel,
) {
  await insertTouchpoint(db, row.id, type, userId, {
    contact_id: body.contact_id ?? null,
    channel,
    outcome: body.outcome ?? null,
    notes: body.notes ?? null,
    payload: body.payload ?? {},
  });

  // If still in researched/prospect, advance to outreach_sent — we DID outreach.
  // Cadence advancement to NEXT day is now explicit (advance_to_next_day action),
  // not implicit on every logged touchpoint.
  if (row.status === "researched" || row.status === "prospect") {
    await transitionStage(db, row, "outreach_sent", userId);
  } else {
    await touchOutreach(db, row.id, userId);
  }
}

async function handleLogReply(
  db: DB,
  row: OutreachRow,
  body: { contact_id?: string; notes?: string },
  userId: string,
  type: TouchpointType,
  channel: Channel,
) {
  await insertTouchpoint(db, row.id, type, userId, {
    contact_id: body.contact_id ?? null,
    channel,
    notes: body.notes ?? null,
  });
  // v9.2: logging a reply does NOT stop the cadence. The sequence continues
  // until the admin explicitly selects a close-out status (not_interested,
  // became_client, committed, etc.) or advances the row to meetings. This
  // allows admins to log replies for tracking while the automated outreach
  // continues in the background.
  //
  // A reply transitions the row to engaged status.
  // v8.10.6: no_response_closed (archived) rows also re-enter engaged
  // when a reply lands — admin's "Log reply" CTA from the Archive tab
  // pulls the stakeholder back into active Replies. reopen_at is
  // cleared so they don't auto-reopen later via the cron sweep.
  if (
    row.status === "outreach_sent" ||
    row.status === "researched" ||
    row.status === "prospect" ||
    row.status === "no_response_closed"
  ) {
    if (row.status === "no_response_closed") {
      await db
        .from("student_outreach")
        .update({ reopen_at: null })
        .eq("id", row.id);
    }
    await transitionStage(db, row, "engaged", userId, body.notes ?? null);
  } else {
    await touchOutreach(db, row.id, userId);
  }
}

/**
 * v8: cancel any pending outreach_email_send tasks for this row. Called
 * when admin signals they've heard back (reply, callback, classify_reply,
 * mark_meeting_scheduled, flag_wants_meeting). Prevents the cron from
 * firing the next cadence email after the conversation has moved on.
 */
async function supersedePendingOutreachEmails(db: DB, outreachId: string, userId: string) {
  const { data: cancelled } = await db
    .from("student_outreach_tasks")
    .update({
      status: "superseded",
      completed_at: new Date().toISOString(),
      completed_by: userId,
    })
    .eq("outreach_id", outreachId)
    .eq("status", "pending")
    .eq("task_type", "outreach_email_send")
    .select("id");
  if (cancelled && cancelled.length > 0) {
    await insertTouchpoint(db, outreachId, "task_superseded", userId, {
      payload: {
        cancelled_task_ids: cancelled.map((c) => (c as { id: string }).id),
        reason: "reply_received",
      },
    });
  }
}

/**
 * v8.8: cancel ALL pending outreach_followup_call tasks for this row.
 * Used when the conversation has moved on and we don't need to keep
 * calling — email reply, meeting scheduled / in flight, partner /
 * closed transitions, "Interested" outcome, etc.
 *
 * Distinct from markCurrentCallTaskComplete (below), which only closes
 * the single in-progress call (used for no_answer / voicemail /
 * promised_callback so future scheduled calls keep firing).
 */
async function supersedePendingFollowupCalls(
  db: DB,
  outreachId: string,
  userId: string,
  reason = "conversation_moved_on",
) {
  const { data: cancelled } = await db
    .from("student_outreach_tasks")
    .update({
      status: "superseded",
      completed_at: new Date().toISOString(),
      completed_by: userId,
    })
    .eq("outreach_id", outreachId)
    .eq("status", "pending")
    .eq("task_type", "outreach_followup_call")
    .select("id");
  if (cancelled && cancelled.length > 0) {
    await insertTouchpoint(db, outreachId, "task_superseded", userId, {
      payload: {
        cancelled_task_ids: cancelled.map((c) => (c as { id: string }).id),
        reason,
      },
    });
  }
}

/**
 * v8.8: mark the single most-overdue pending outreach_followup_call task
 * complete. Used when the admin logs no_answer / voicemail /
 * promised_callback — the *current* call is done, but FUTURE scheduled
 * call days should still fire on cadence. This is the new
 * "natural-cadence" behavior that replaces the old supersede-all logic
 * for those outcomes.
 *
 * Returns true when a task was found and marked complete.
 */
async function markCurrentCallTaskComplete(
  db: DB,
  outreachId: string,
  userId: string,
  pinnedTaskId?: string,
): Promise<{ claimed: boolean; cadence_day: number | null }> {
  const nowIso = new Date().toISOString();
  // v9 Phase 9: when admin logs a specific call task (from the
  // OutreachTimeline per-task Log button), claim THAT task by id
  // instead of the most-overdue auto-pick. Lets admin log calls
  // out of due-order — e.g. they called Logan first, voicemail;
  // then called General Office, connected. Per-task logging
  // matches operational reality with per-recipient cadence.
  let query = db
    .from("student_outreach_tasks")
    .select("id, payload")
    .eq("outreach_id", outreachId)
    .eq("status", "pending")
    .eq("task_type", "outreach_followup_call");
  if (pinnedTaskId) {
    query = query.eq("id", pinnedTaskId);
  } else {
    query = query.lte("due_at", nowIso).order("due_at", { ascending: false });
  }
  const { data: dueRows } = await query.limit(1);
  const due = (dueRows ?? []) as Array<{ id: string; payload: Record<string, unknown> | null }>;
  if (due.length === 0) return { claimed: false, cadence_day: null };
  const dayRaw = due[0].payload?.day;
  const cadence_day = typeof dayRaw === "number" ? dayRaw : null;
  await db
    .from("student_outreach_tasks")
    .update({ status: "completed", completed_at: nowIso, completed_by: userId })
    .eq("id", due[0].id);
  return { claimed: true, cadence_day };
}

/**
 * v8.8: log a phone-call outcome from the Calls-tab Log Call Outcome modal.
 *
 * Seven outcomes drive different downstream effects:
 *   - no_answer            → log call_no_answer + mark CURRENT call task
 *                             complete (future call days still fire)
 *   - voicemail            → log call_voicemail{awaiting_callback:true} +
 *                             mark CURRENT call task complete → row to
 *                             Replies as awaiting_callback (kind=voicemail);
 *                             future scheduled calls remain queued
 *   - promised_callback    → log call_connected{awaiting_callback:true} +
 *                             mark CURRENT call task complete → engaged;
 *                             row to Replies awaiting_callback (kind=promised);
 *                             future scheduled calls remain queued
 *   - connected_engaged ("Interested") → log call_connected + mark current
 *                             call task complete + supersede ALL future
 *                             pending email + call tasks → engaged
 *   - convert_to_partner   → log call_connected + mark current call task
 *                             complete; the FE chains into MarkPartnerModal
 *                             which then issues mark_partner with evidence
 *   - connected_not_interested → log call_connected + transition to
 *                             not_interested (stage transition cancels
 *                             remaining tasks via tasksToCancelOnExit)
 *   - wrong_number         → log call_wrong_number + transition to
 *                             wrong_contact (same)
 *
 * Also supports the legacy `disposition` shape from OutreachStepList.
 */
async function handleLogCall(
  db: DB,
  row: OutreachRow,
  body: {
    disposition?: string;
    outcome?: string;
    contact_id?: string;
    notes?: string;
    /** v8.10: client-provided cadence day (PhoneStepRow knows it locally).
     *  Server prefers this when set; otherwise it reads the day from the
     *  task that markCurrentCallTaskComplete claims. */
    cadence_day?: number;
    /**
     * v9 Phase 9: when admin clicks per-task Log inside the drawer
     * Timeline, this carries the specific call task id so the claim
     * targets that task instead of the most-overdue auto-pick. Lets
     * admin log out-of-order calls when multiple recipients are
     * pending simultaneously.
     */
    task_id?: string;
  },
  userId: string,
) {
  // v8 outcome routing (preferred). Falls back to legacy disposition map.
  const outcome = body.outcome ?? legacyDispositionToOutcome(body.disposition);
  if (!outcome) throw new Error("Invalid call outcome");

  // v8.10: claim the current call task first so we can tag the touchpoint
  // with the right cadence_day. Outcomes that don't mark a task complete
  // (connected_not_interested, wrong_number) still get tagged via body
  // hint or the outermost claim — they transition stage immediately
  // afterward, which cancels remaining tasks via tasksToCancelOnExit.
  const claim = await markCurrentCallTaskComplete(db, row.id, userId, body.task_id);
  const cadence_day =
    typeof body.cadence_day === "number" ? body.cadence_day : claim.cadence_day;
  const callPayload: Record<string, unknown> = {};
  if (cadence_day !== null && cadence_day !== undefined) {
    callPayload.cadence_day = cadence_day;
  }

  switch (outcome) {
    case "no_answer": {
      await insertTouchpoint(db, row.id, "call_no_answer", userId, {
        contact_id: body.contact_id ?? null,
        channel: "phone",
        outcome,
        notes: body.notes ?? null,
        payload: callPayload,
      });
      if (row.status === "researched" || row.status === "prospect") {
        await transitionStage(db, row, "outreach_sent", userId);
      } else {
        await touchOutreach(db, row.id, userId);
      }
      return;
    }
    case "voicemail": {
      await insertTouchpoint(db, row.id, "call_voicemail", userId, {
        contact_id: body.contact_id ?? null,
        channel: "phone",
        outcome,
        notes: body.notes ?? null,
        payload: { ...callPayload, awaiting_callback: true },
      });
      if (row.status === "researched" || row.status === "prospect") {
        await transitionStage(db, row, "outreach_sent", userId);
      } else {
        await touchOutreach(db, row.id, userId);
      }
      return;
    }
    case "promised_callback": {
      await insertTouchpoint(db, row.id, "call_connected", userId, {
        contact_id: body.contact_id ?? null,
        channel: "phone",
        outcome,
        notes: body.notes ?? null,
        payload: { ...callPayload, awaiting_callback: true },
      });
      if (row.status === "outreach_sent" || row.status === "researched" || row.status === "prospect") {
        await transitionStage(db, row, "engaged", userId, body.notes ?? null);
      } else {
        await touchOutreach(db, row.id, userId);
      }
      return;
    }
    case "connected_engaged": {
      await insertTouchpoint(db, row.id, "call_connected", userId, {
        contact_id: body.contact_id ?? null,
        channel: "phone",
        outcome,
        notes: body.notes ?? null,
        payload: callPayload,
      });
      // Conversation has moved on — stop the cadence.
      await supersedePendingOutreachEmails(db, row.id, userId);
      await supersedePendingFollowupCalls(db, row.id, userId, "connected_engaged");
      if (row.status === "outreach_sent" || row.status === "researched" || row.status === "prospect") {
        await transitionStage(db, row, "engaged", userId, body.notes ?? null);
      } else {
        await touchOutreach(db, row.id, userId);
      }
      return;
    }
    case "convert_to_partner": {
      // v8.8: log the call + close the current call task only. The FE then
      // mounts MarkPartnerModal which issues `mark_partner` with evidence
      // — that path runs the active_partner stage transition, queues the
      // first seasonal email, and cancels remaining tasks via
      // tasksToCancelOnExit.
      await insertTouchpoint(db, row.id, "call_connected", userId, {
        contact_id: body.contact_id ?? null,
        channel: "phone",
        outcome,
        notes: body.notes ?? null,
        payload: callPayload,
      });
      await touchOutreach(db, row.id, userId);
      return;
    }
    case "convert_to_client": {
      // v9 final: provider conversion lives inside the Log workflow.
      // Log the call touchpoint, then run handleMakeClient which
      // writes business_profiles.metadata.interview_terms_accepted_at,
      // transitions the row to active_partner (deriveStage maps that
      // to 'converted' for provider rows), and unlocks Partner
      // Prospects for catchment Sites.
      await insertTouchpoint(db, row.id, "call_connected", userId, {
        contact_id: body.contact_id ?? null,
        channel: "phone",
        outcome,
        notes: body.notes ?? null,
        payload: callPayload,
      });
      await handleMakeClient(db, row, userId);
      return;
    }
    case "connected_not_interested": {
      await insertTouchpoint(db, row.id, "call_connected", userId, {
        contact_id: body.contact_id ?? null,
        channel: "phone",
        outcome,
        notes: body.notes ?? null,
        payload: callPayload,
      });
      await transitionStage(db, row, "not_interested", userId, body.notes ?? null);
      return;
    }
    case "wrong_number": {
      await insertTouchpoint(db, row.id, "call_wrong_number", userId, {
        contact_id: body.contact_id ?? null,
        channel: "phone",
        outcome,
        notes: body.notes ?? null,
        payload: callPayload,
      });
      await transitionStage(db, row, "wrong_contact", userId, body.notes ?? null);
      return;
    }
    default:
      throw new Error(`Unknown call outcome: ${outcome}`);
  }
}

function legacyDispositionToOutcome(disposition: string | undefined): string | null {
  if (!disposition) return null;
  switch (disposition) {
    case "no_answer": return "no_answer";
    case "voicemail": return "voicemail";
    case "connected": return "connected_engaged";
    case "wrong_number": return "wrong_number";
    default: return null;
  }
}

// v8.8: handleResumeOutreach removed. With voicemail/promised_callback
// only marking the *current* call task complete (not all future calls),
// the next scheduled phone day naturally re-engages the row. Manual
// "Try again" is no longer a needed affordance.

/**
 * v8: ReplyClassifierModal callback. Maps the four user choices to
 * existing actions. The mini-modal is shared between "they replied
 * via email" and "got a callback" paths.
 *
 *   keep_emailing      → log_email_replied (engaged, cadence continues)
 *   wants_meeting      → flag_wants_meeting (note_added meeting_in_flight)
 *   already_booked     → mark_meeting_scheduled (with optional meeting_at)
 *   committed          → mark_partner with the supplied evidence
 */
async function handleClassifyReply(
  db: DB,
  row: OutreachRow,
  body: {
    classification?: string;
    notes?: string;
    meeting_at?: string;
    evidence?: DistributionEvidence;
    evidence_notes?: string;
    // v9.2: when true, explicitly stop the cadence. Used by `redirected`
    // flow where the admin is switching to a different contact.
    stop_cadence?: boolean;
  },
  userId: string,
) {
  switch (body.classification) {
    case "keep_emailing":
      await handleLogReply(db, row, { notes: body.notes }, userId, "email_replied", "email");
      // v9.2: if stop_cadence is explicitly requested (e.g., redirected flow),
      // stop the email/call cadence even though we're logging a reply.
      if (body.stop_cadence) {
        await supersedePendingOutreachEmails(db, row.id, userId);
        await supersedePendingFollowupCalls(db, row.id, userId, "redirected");
      }
      return;
    case "wants_meeting":
      await handleFlagWantsMeeting(db, row, { notes: body.notes }, userId);
      return;
    case "already_booked":
      await handleMarkMeetingScheduled(
        db,
        row,
        { meeting_at: body.meeting_at, notes: body.notes },
        userId,
      );
      return;
    case "committed":
      await handleMarkPartner(
        db,
        row,
        { evidence: body.evidence, evidence_notes: body.evidence_notes, notes: body.notes },
        userId,
      );
      return;
    case "not_interested":
      // v8.10.8: "They said no thanks" path. Mirrors the Stop Outreach
      // overflow's not_interested option but reachable inline from the
      // Log Reply modal so admin doesn't have to switch menus.
      await transitionStage(db, row, "not_interested", userId, body.notes ?? null);
      return;
    default:
      throw new Error("Invalid classification");
  }
}

// ── v4 auto-send outreach handlers ──────────────────────────────────────

/**
 * Schedule the full email cadence for a stakeholder. Inserts one
 * `outreach_email_send` task per email day (with subject/body snapshot)
 * + one `outreach_followup_call` task per phone day. Transitions stage
 * to `outreach_sent`. Then INLINE-fires Day 0 so the admin sees the
 * first email go out immediately rather than waiting for the cron.
 */
/**
 * Log that we offered a call (Calendly link sent). No stage transition.
 * The admin sends the link externally (in their reply) and clicks
 * "I sent it" in the modal, which triggers this action.
 */
async function handleOfferCall(
  db: DB,
  row: OutreachRow,
  body: { notes?: string },
  userId: string,
) {
  await insertTouchpoint(db, row.id, "note_added", userId, {
    notes: body.notes ?? "Offered Calendly link to book a 15-min call",
    payload: { reason: "call_offered", calendly: "https://calendly.com/caregivers979/olera-demo" },
  });
  await touchOutreach(db, row.id, userId);
}

async function handleScheduleSequence(
  db: DB,
  row: OutreachRow,
  body: {
    // Legacy single-snapshot mode (stakeholder paths).
    email_snapshots?: EmailSnapshot[];
    // v9 Phase 9 per-recipient mode (provider paths).
    recipients?: RecipientPlan[];
    email_snapshots_by_variant?: {
      general?: EmailSnapshot[];
      named?: EmailSnapshot[];
    };
    call_scripts?: CallScript[];
    // v9 final: optional contact-form Day 0 outcome. PreFlight
    // sends this when the General Contact has a contact_form_url.
    // Emits a contact_form_submitted touchpoint as part of the
    // launch so it lands in the timeline alongside Day 0 emails.
    contact_form_outcome?: "submitted" | "skipped" | "not_available";
    contact_form_url?: string | null;
  },
  userId: string,
) {
  // Snapshot validation (subject/body presence) is no longer enforced —
  // Smartlead ships canonical templates from `lib/student-outreach/templates.ts`
  // via `buildEmailSequence`, so the client doesn't send editable subject/body
  // copy. The bridge's `selectEligibleRows` handles the "at least one usable
  // recipient" check below; route-side snapshot validation would block
  // launches that Smartlead would actually accept.

  // Reject if a sequence is already in flight (avoid duplicate scheduling).
  const { data: existing } = await db
    .from("student_outreach_tasks")
    .select("id")
    .eq("outreach_id", row.id)
    .eq("status", "pending")
    .eq("task_type", "outreach_email_send");
  if ((existing ?? []).length > 0) {
    throw new Error("Sequence already scheduled — cancel or wait for it to complete first");
  }

  // Legacy has_phone gate (multi-recipient single-task mode only).
  const { data: phoneContactRows } = await db
    .from("student_outreach_contacts")
    .select("id")
    .eq("outreach_id", row.id)
    .eq("status", "active")
    .not("phone", "is", null)
    .neq("phone", "")
    .limit(1);
  const hasPhone = (phoneContactRows ?? []).length > 0;

  const cadenceKey: CadenceKey =
    row.kind === "provider" ? "provider" : row.stakeholder_type;

  const plan = planSequence({
    outreach_id: row.id,
    stakeholder_type: cadenceKey,
    email_snapshots: body.email_snapshots,
    recipients: body.recipients,
    email_snapshots_by_variant: body.email_snapshots_by_variant,
    call_scripts: body.call_scripts,
    user_id: userId,
    has_phone: hasPhone,
  });
  // Smartlead is the delivery engine for all MedJobs cold outreach. Enroll
  // the lead into its campus campaign FIRST so any skip (no email / already
  // enrolled) or API failure aborts BEFORE any CRM mutation — no orphaned
  // tasks, no half-transitioned row. enrollRowIntoSmartlead throws on skip
  // or failure and writes the linkage + touchpoint on success.
  await enrollRowIntoSmartlead(db, row, userId);

  // Smartlead owns the email drip — we only queue CRM-side call tasks.
  const tasksToInsert = plan.filter((p) => p.task_type === "outreach_followup_call");
  let insertedTasks: Array<{
    id: string;
    task_type: string;
    payload: Record<string, unknown>;
    due_at: string;
  }> = [];
  if (tasksToInsert.length > 0) {
    const inserts = tasksToInsert.map((p) => ({
      outreach_id: row.id,
      task_type: p.task_type,
      due_at: p.due_at.toISOString(),
      payload: p.payload,
      created_by: userId,
    }));
    const { data, error: insertErr } = await db
      .from("student_outreach_tasks")
      .insert(inserts)
      .select("id, task_type, payload, due_at");
    if (insertErr) throw new Error(insertErr.message);
    insertedTasks = (data ?? []) as typeof insertedTasks;
  }

  if (row.status !== "outreach_sent") {
    await transitionStage(db, row, "outreach_sent", userId, "sequence_scheduled");
  } else {
    await touchOutreach(db, row.id, userId);
  }

  // v9 final: clear viewed_at so the row + every per-recipient card
  // it now generates surface as unread on the Calls + Replies tabs.
  // Admin opened the drawer pre-launch (mark_read fired then), but
  // launching CREATES new operational work — those cards should
  // bold + boost the tab fractions until admin acts on each.
  await db
    .from("student_outreach")
    .update({ viewed_at: null })
    .eq("id", row.id);

  // Smartlead owns the email drip — there are no inline Day-0 email tasks
  // to fire here. The campaign starts PAUSED in Smartlead and a human
  // clicks Start in the Smartlead UI when ready (existing safety: no
  // START literal in the bridge code).

  // v9 final: contact-form Day 0 step. When PreFlight passed an
  // outcome, emit the touchpoint as part of the launch so the
  // OutreachTimeline shows the form decision next to the Day 0
  // emails. Banner in the drawer keys off the absence of any
  // contact_form_submitted touchpoint, so this also clears the
  // banner on launch.
  const cfOutcome = body.contact_form_outcome;
  if (
    cfOutcome === "submitted" ||
    cfOutcome === "skipped" ||
    cfOutcome === "not_available"
  ) {
    await insertTouchpoint(db, row.id, "contact_form_submitted", userId, {
      channel: "contact_form",
      outcome: cfOutcome,
      payload: {
        url: body.contact_form_url ?? null,
        outcome: cfOutcome,
        day: 0,
      },
    });
  }
}

/**
 * Smartlead engine path for schedule_sequence (G2-approved branch). Enrolls the
 * row's General Contact into its campus Smartlead campaign and records the
 * linkage + a timeline touchpoint. Single-writer: the only CRM mutations here
 * are the research_data linkage update and the note_added touchpoint.
 *
 * Approach (b): the campus's campaign id is reused from a sibling row's stored
 * linkage; the first row for a campus provisions a new PAUSED campaign. The
 * Smartlead API calls + find-or-create live in lib/medjobs/smartlead-bridge.ts;
 * this function only assembles the inputs and persists the result.
 *
 * Throws on skip (no email / already enrolled) or API failure so the action
 * surfaces the reason to the admin and aborts before queueing call tasks.
 */
async function enrollRowIntoSmartlead(db: DB, row: OutreachRow, userId: string) {
  const { data: campusRow } = await db
    .from("student_outreach_campuses")
    .select("name, city, slug")
    .eq("id", row.campus_id)
    .maybeSingle();
  const campus = campusRow as { name?: string; city?: string | null; slug?: string | null } | null;
  const campusName = campus?.name ?? "Unknown Campus";
  const campusCity = campus?.city ?? null;
  const campusSlug = campus?.slug ?? null;

  // Approach (b): reuse the campus's existing campaign id from a sibling row's
  // stored linkage (one indexed read; no new engine surface).
  const { data: siblings } = await db
    .from("student_outreach")
    .select("research_data")
    .eq("campus_id", row.campus_id)
    .neq("id", row.id);
  let existingCampaignId: number | undefined;
  for (const s of (siblings ?? []) as Array<{ research_data: ResearchData | null }>) {
    const cid = s.research_data?.smartlead?.campaign_id;
    if (typeof cid === "number") {
      existingCampaignId = cid;
      break;
    }
  }

  // v9.x Decision Maker fan-out: General Contact + ONE Decision Maker (max
  // 2 leads per row). Replaces the prior multi-contact fan-out — admins
  // identify a single decision maker during pre-flight and store them in
  // `research_data.decision_maker`. When absent or marked unavailable, the
  // row enrolls with the General Contact lead only.
  const dm = row.research_data?.decision_maker;
  const namedContacts: NamedContact[] = [];
  if (dm && !dm.unavailable && dm.email && dm.email.trim()) {
    const [first, ...rest] = (dm.name ?? "").trim().split(/\s+/);
    const lastName = rest.length > 0 ? rest.join(" ") : null;
    namedContacts.push({
      // Synthetic contact_id so the D2 webhook can attribute back to the
      // Decision Maker slot without a contacts-table row.
      contact_id: `dm:${row.id}`,
      email: dm.email.trim(),
      first_name: first || null,
      last_name: lastName,
      title: null,
      role: dm.role ?? null,
    });
  }

  const gc = row.research_data?.general_contact;
  const bridgeRow: BridgeRow = {
    outreach_id: row.id,
    kind: row.kind,
    status: row.status,
    organization_name: row.organization_name,
    city: gc?.city ?? campusCity,
    // Pre-flight requires the General Contact email before launch; if it's
    // somehow absent, the bridge filters the row out (no_email) and we throw —
    // unless the row has Named Contacts with usable emails, in which case
    // those alone carry the enrollment.
    email: gc?.email ?? null,
    first_name: null,
    already_enrolled: typeof row.research_data?.smartlead?.campaign_id === "number",
    contacts: namedContacts,
  };

  const cadenceKey: CadenceKey = row.kind === "provider" ? "provider" : row.stakeholder_type;
  const yyyymm = new Date().toISOString().slice(0, 7);

  const enroll = await enrollRowIntoCampusCampaign({
    row: bridgeRow,
    campus: { name: campusName, city: campusCity, slug: campusSlug },
    campaignName: `MedJobs — ${campusName} — ${yyyymm}`,
    existingCampaignId,
    cadenceKey,
  });

  if (enroll.skipped_reason) {
    throw new Error(`Smartlead enrollment skipped: ${enroll.skipped_reason}`);
  }
  if (!enroll.ok || !enroll.campaign_id) {
    const detail = enroll.errors.map((e) => `${e.stage}: ${e.message}`).join("; ") || "unknown error";
    throw new Error(`Smartlead enrollment failed: ${detail}`);
  }

  // Linkage on the row (G3: research_data JSONB, no migration). Mirror the
  // Named Contact fan-out so the D2 webhook can resolve a Smartlead event's
  // `contact_id` custom field back to a CRM contact without re-querying.
  const enrolledContactIds = namedContacts.map((c) => c.contact_id);
  const nextResearch: ResearchData = {
    ...row.research_data,
    smartlead: {
      campaign_id: enroll.campaign_id,
      lead_email: bridgeRow.email,
      enrolled_at: new Date().toISOString(),
      enrolled_contact_ids: enrolledContactIds,
    },
  };
  await db.from("student_outreach").update({ research_data: nextResearch }).eq("id", row.id);

  // Timeline touchpoint (G1/G5: existing note_added type). Capture the
  // recipient count so the admin can see fan-out happened in the timeline.
  const recipientCount = (bridgeRow.email ? 1 : 0) + enrolledContactIds.length;
  await insertTouchpoint(db, row.id, "note_added", userId, {
    channel: "email",
    payload: {
      reason: "smartlead_enrolled",
      campaign_id: enroll.campaign_id,
      created_campaign: enroll.created,
      recipient_count: recipientCount,
      named_contact_count: enrolledContactIds.length,
    },
  });
}

/**
 * Edit the subject/body snapshot of an upcoming pending email task.
 * Server enforces: task must be `pending` and due_at must be at least
 * 15 minutes in the future (one cron interval) so we don't race the
 * executor.
 */
async function handleEditPendingEmail(
  db: DB,
  row: OutreachRow,
  body: { task_id?: string; subject?: string; body?: string },
  userId: string,
) {
  if (!body.task_id) throw new Error("task_id required");
  if (!body.subject?.trim() || !body.body?.trim()) {
    throw new Error("Subject and body required");
  }

  const { data: task } = await db
    .from("student_outreach_tasks")
    .select("id, status, due_at, task_type, payload")
    .eq("id", body.task_id)
    .eq("outreach_id", row.id)
    .single();
  if (!task) throw new Error("Task not found");
  const t = task as {
    status: string;
    due_at: string;
    task_type: string;
    payload: Record<string, unknown>;
  };
  if (t.status !== "pending") {
    return Promise.reject(
      Object.assign(new Error("Task is no longer pending"), { code: 409 }),
    );
  }
  if (t.task_type !== "outreach_email_send") {
    throw new Error("Can only edit outreach_email_send tasks");
  }
  const dueMs = new Date(t.due_at).getTime();
  if (dueMs - Date.now() < 15 * 60 * 1000) {
    throw new Error("Too close to send time to edit (within 15 minutes of due_at)");
  }

  const newPayload = { ...t.payload, subject: body.subject.trim(), body: body.body.trim() };
  await db
    .from("student_outreach_tasks")
    .update({ payload: newPayload })
    .eq("id", body.task_id);

  await insertTouchpoint(db, row.id, "note_added", userId, {
    payload: { edited_task_id: body.task_id, edited_day: t.payload?.day },
  });
  await touchOutreach(db, row.id, userId);
}

/** Cancel a single pending outreach_email_send task. */
async function handleSkipPendingEmail(
  db: DB,
  row: OutreachRow,
  body: { task_id?: string; reason?: string },
  userId: string,
) {
  if (!body.task_id) throw new Error("task_id required");
  const { data: task } = await db
    .from("student_outreach_tasks")
    .select("id, status, task_type, payload, due_at")
    .eq("id", body.task_id)
    .eq("outreach_id", row.id)
    .single();
  if (!task) throw new Error("Task not found");
  const t = task as { status: string; task_type: string; payload: Record<string, unknown>; due_at: string };
  if (t.status !== "pending") throw new Error("Task is no longer pending");
  if (t.task_type !== "outreach_email_send") throw new Error("Can only skip outreach_email_send tasks");
  const dueMs = new Date(t.due_at).getTime();
  if (dueMs - Date.now() < 15 * 60 * 1000) {
    throw new Error("Too close to send time to skip (within 15 minutes of due_at)");
  }

  await db
    .from("student_outreach_tasks")
    .update({
      status: "cancelled",
      completed_at: new Date().toISOString(),
      completed_by: userId,
      payload: { ...t.payload, outcome: "admin_skipped", reason: body.reason ?? null },
    })
    .eq("id", body.task_id);

  await insertTouchpoint(db, row.id, "task_cancelled", userId, {
    payload: { task_id: body.task_id, day: t.payload?.day, reason: body.reason ?? null },
  });
  await touchOutreach(db, row.id, userId);
}

/**
 * Bulk: mark multiple rows as engaged in one call (used by inbox check).
 * Each transition runs the full state-machine with cancellation hooks,
 * so all pending email tasks for those rows get superseded.
 */
async function handleMarkEngagedBulk(
  db: DB,
  body: { outreach_ids?: string[]; notes?: string },
  userId: string,
) {
  const ids = body.outreach_ids ?? [];
  if (ids.length === 0) throw new Error("outreach_ids required");
  if (ids.length > 50) throw new Error("Max 50 rows at once");

  for (const id of ids) {
    const { data: rowData } = await db
      .from("student_outreach")
      .select("*")
      .eq("id", id)
      .single();
    if (!rowData) continue;
    const r = rowData as OutreachRow;
    if (r.status !== "outreach_sent") continue; // Only flip rows currently in outreach.
    await transitionStage(db, r, "engaged", userId, body.notes ?? "via inbox check");
  }
}


// ── Contacts ────────────────────────────────────────────────────────────

async function handleAddContact(
  db: DB,
  row: OutreachRow,
  body: {
    name?: string;
    title?: string | null;
    first_name?: string;
    last_name?: string;
    role?: string;
    email?: string;
    phone?: string;
    /** v9 Phase 9: optional cell + PBX extension. */
    mobile?: string;
    extension?: string;
    instagram?: string;
    contact_form_url?: string;
    is_primary?: boolean;
    notes?: string;
  },
  userId: string,
) {
  // v8.7: accept either legacy `name` or new first_name + last_name. At
  // least a first name is required; we derive the full name for the
  // legacy `name` column.
  const first = (body.first_name ?? "").trim();
  const last = (body.last_name ?? "").trim();
  const fullName =
    body.name?.trim() ||
    [first, last].filter(Boolean).join(" ") ||
    "";
  if (!fullName) throw new Error("Contact first name required");
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    throw new Error("Invalid email");
  }

  // If marking primary, demote existing primaries.
  if (body.is_primary) {
    await db
      .from("student_outreach_contacts")
      .update({ is_primary: false })
      .eq("outreach_id", row.id);
  }

  const { data: contact, error } = await db
    .from("student_outreach_contacts")
    .insert({
      outreach_id: row.id,
      name: fullName,
      title: body.title?.trim() || null,
      first_name: first || null,
      last_name: last || null,
      role: body.role ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      mobile: body.mobile ?? null,
      extension: body.extension ?? null,
      instagram: body.instagram ?? null,
      contact_form_url: body.contact_form_url ?? null,
      is_primary: body.is_primary ?? false,
      notes: body.notes ?? null,
      created_by: userId,
    })
    .select("*")
    .single();
  if (error || !contact) throw new Error(error?.message ?? "Contact insert failed");

  await insertTouchpoint(db, row.id, "contact_added", userId, {
    contact_id: (contact as { id: string }).id,
    notes: body.notes ?? null,
  });
  await touchOutreach(db, row.id, userId);

  // If this row was marked wrong_contact, prompt-friendly: silently surface
  // the row again by setting reopen_at = today. Admin still has to reopen.
  if (row.status === "wrong_contact") {
    await db
      .from("student_outreach")
      .update({ reopen_at: new Date().toISOString().slice(0, 10) })
      .eq("id", row.id);
  }
}

async function handleUpdateContact(
  db: DB,
  row: OutreachRow,
  body: {
    contact_id?: string;
    name?: string;
    title?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    role?: string | null;
    email?: string | null;
    phone?: string | null;
    /** v9 Phase 9: optional cell + PBX extension. */
    mobile?: string | null;
    extension?: string | null;
    instagram?: string | null;
    contact_form_url?: string | null;
    is_primary?: boolean;
    notes?: string | null;
    // v9: status flip via the same endpoint that handles other field
    // edits. Drives the SnapshotCard's per-contact "include in send"
    // toggle (active ↔ stale). The dedicated mark_contact_stale
    // action still works for stakeholder-side UX paths.
    status?: ContactStatus;
  },
  userId: string,
) {
  if (!body.contact_id) throw new Error("contact_id required");
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    throw new Error("Invalid email");
  }
  if (body.is_primary) {
    await db
      .from("student_outreach_contacts")
      .update({ is_primary: false })
      .eq("outreach_id", row.id);
  }
  const patch: Record<string, unknown> = {
    last_edited_by: userId,
    last_edited_at: new Date().toISOString(),
  };
  for (const k of ["name", "title", "first_name", "last_name", "role", "email", "phone", "mobile", "extension", "instagram", "contact_form_url", "is_primary", "notes", "status"] as const) {
    if (body[k] !== undefined) patch[k] = body[k];
  }
  // v8.7: keep `name` in sync with first_name + last_name when those are
  // provided and `name` wasn't explicitly set in the same patch.
  let derivedName: string | null = null;
  if (
    body.name === undefined &&
    (body.first_name !== undefined || body.last_name !== undefined)
  ) {
    const first = (body.first_name ?? "").trim();
    const last = (body.last_name ?? "").trim();
    const derived = [first, last].filter(Boolean).join(" ");
    if (derived) {
      patch.name = derived;
      derivedName = derived;
    }
  }
  await db
    .from("student_outreach_contacts")
    .update(patch)
    .eq("id", body.contact_id)
    .eq("outreach_id", row.id);

  // v8.7.1: when the primary contact's name changes on a single-contact
  // type (advisor/professor), keep the stakeholder's display name in
  // sync. Without this, renaming Marcus→Mark in the inline form leaves
  // the card and drawer header showing the old name.
  if (
    (row.stakeholder_type === "advisor" || row.stakeholder_type === "professor") &&
    (body.first_name !== undefined || body.last_name !== undefined || body.name !== undefined)
  ) {
    const { data: contactRow } = await db
      .from("student_outreach_contacts")
      .select("is_primary, name")
      .eq("id", body.contact_id)
      .single();
    const isPrimary = (contactRow as { is_primary: boolean } | null)?.is_primary === true;
    if (isPrimary) {
      const newOrgName =
        body.name?.trim() ||
        derivedName ||
        (contactRow as { name: string } | null)?.name?.trim();
      if (newOrgName && newOrgName !== row.organization_name) {
        await db
          .from("student_outreach")
          .update({ organization_name: newOrgName })
          .eq("id", row.id);
      }
    }
  }

  await touchOutreach(db, row.id, userId);
}

async function handleMarkContactStatus(
  db: DB,
  row: OutreachRow,
  body: { contact_id?: string; notes?: string },
  userId: string,
  action: string,
) {
  if (!body.contact_id) throw new Error("contact_id required");
  const map: Record<string, ContactStatus> = {
    mark_contact_stale: "stale",
    mark_contact_incorrect: "incorrect",
    mark_contact_no_longer_valid: "no_longer_valid",
  };
  const status = map[action];
  if (!status) throw new Error("Invalid contact-status action");
  await db
    .from("student_outreach_contacts")
    .update({
      status,
      last_edited_by: userId,
      last_edited_at: new Date().toISOString(),
    })
    .eq("id", body.contact_id)
    .eq("outreach_id", row.id);
  await insertTouchpoint(db, row.id, "contact_marked_stale", userId, {
    contact_id: body.contact_id,
    notes: body.notes ?? null,
    payload: { new_status: status },
  });
  await touchOutreach(db, row.id, userId);
}

// ── Approvals ───────────────────────────────────────────────────────────

async function handleRequestApproval(
  db: DB,
  row: OutreachRow,
  body: {
    approval_type?: ApprovalType;
    approval_for?: string;
    approval_from?: string;
    notes?: string;
  },
  userId: string,
) {
  if (!body.approval_type) throw new Error("approval_type required");
  if (!body.approval_for?.trim()) throw new Error("approval_for required");

  const followupAt = new Date(Date.now() + 5 * DAY_MS);
  const { data: approval, error } = await db
    .from("student_outreach_approvals")
    .insert({
      outreach_id: row.id,
      approval_type: body.approval_type,
      approval_for: body.approval_for.trim(),
      approval_from: body.approval_from?.trim() ?? null,
      next_followup_at: followupAt.toISOString(),
      notes: body.notes ?? null,
      created_by: userId,
      last_updated_by: userId,
    })
    .select("*")
    .single();
  if (error || !approval) throw new Error(error?.message ?? "Approval insert failed");

  await queueTask(
    db,
    row.id,
    {
      task_type: "approval_request_followup",
      due_at: followupAt,
      payload: { approval_for: body.approval_for, approval_type: body.approval_type },
    },
    userId,
    (approval as { id: string }).id,
  );

  await insertTouchpoint(db, row.id, "approval_requested", userId, {
    notes: body.notes ?? null,
    payload: {
      approval_id: (approval as { id: string }).id,
      approval_type: body.approval_type,
      approval_for: body.approval_for,
    },
  });
  await touchOutreach(db, row.id, userId);
}

async function handleResolveApproval(
  db: DB,
  row: OutreachRow,
  body: { approval_id?: string; resolution?: ApprovalStatus; notes?: string },
  userId: string,
) {
  if (!body.approval_id) throw new Error("approval_id required");
  if (!body.resolution || !["granted", "denied", "expired"].includes(body.resolution)) {
    throw new Error("Invalid resolution");
  }

  const { data: approval } = await db
    .from("student_outreach_approvals")
    .select("*")
    .eq("id", body.approval_id)
    .eq("outreach_id", row.id)
    .single();
  if (!approval) throw new Error("Approval not found");

  await db
    .from("student_outreach_approvals")
    .update({
      status: body.resolution,
      resolved_at: new Date().toISOString(),
      next_followup_at: null,
      notes: body.notes ?? (approval as { notes: string | null }).notes,
      last_updated_by: userId,
      last_updated_at: new Date().toISOString(),
    })
    .eq("id", body.approval_id);

  // Cancel the approval_request_followup task tied to this approval.
  await db
    .from("student_outreach_tasks")
    .update({ status: "completed", completed_at: new Date().toISOString(), completed_by: userId })
    .eq("approval_id", body.approval_id)
    .eq("status", "pending");

  const tpType: TouchpointType =
    body.resolution === "granted"
      ? "approval_granted"
      : body.resolution === "denied"
      ? "approval_denied"
      : "approval_expired";
  await insertTouchpoint(db, row.id, tpType, userId, {
    notes: body.notes ?? null,
    payload: {
      approval_id: body.approval_id,
      approval_type: (approval as { approval_type: string }).approval_type,
    },
  });

  // v8.7: granting "Post on university job board" queues a campus-scoped
  // post task. Dedupe: only queue if no other stakeholder at this campus
  // already has a pending job-board task — admin posts ONCE per campus.
  const approvalFor = (approval as { approval_for: string }).approval_for;
  if (body.resolution === "granted" && approvalFor === "Post on university job board") {
    await maybeQueueJobBoardTask(db, row, userId);
  }

  await touchOutreach(db, row.id, userId);
}

/**
 * v8.7: admin clicked "Mark posted" on the job board task. Completes
 * any pending job-board task on this stakeholder (typically just one)
 * and logs a touchpoint for history.
 */
async function handleMarkJobBoardPosted(db: DB, row: OutreachRow, userId: string) {
  const { data: tasks } = await db
    .from("student_outreach_tasks")
    .select("id, payload")
    .eq("outreach_id", row.id)
    .eq("status", "pending")
    .eq("task_type", "partner_share_update");
  const jobBoardTasks = ((tasks ?? []) as Array<{ id: string; payload: Record<string, unknown> | null }>)
    .filter((t) => t.payload?.reason === "job_board_post");
  if (jobBoardTasks.length === 0) {
    throw new Error("No pending job board task on this stakeholder");
  }
  for (const t of jobBoardTasks) {
    await db
      .from("student_outreach_tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by: userId,
      })
      .eq("id", t.id);
  }
  await insertTouchpoint(db, row.id, "note_added", userId, {
    payload: { reason: "job_board_posted" },
  });
  await touchOutreach(db, row.id, userId);
}

/**
 * v8.7: queue a "Post to university job board" task on this stakeholder
 * — but only if there isn't already a pending one for any other
 * stakeholder at this campus. Job board is a campus-level resource;
 * we post ONCE per campus.
 */
async function maybeQueueJobBoardTask(db: DB, row: OutreachRow, userId: string) {
  // Pull all stakeholder ids at this campus.
  const { data: campusRows } = await db
    .from("student_outreach")
    .select("id")
    .eq("campus_id", row.campus_id);
  const campusIds = ((campusRows ?? []) as Array<{ id: string }>).map((r) => r.id);
  if (campusIds.length === 0) return;

  // Any pending job-board task already?
  const { data: existing } = await db
    .from("student_outreach_tasks")
    .select("id")
    .in("outreach_id", campusIds)
    .eq("status", "pending")
    .eq("task_type", "partner_share_update")
    .contains("payload", { reason: "job_board_post" });
  if ((existing ?? []).length > 0) return;

  // Queue on the granter (this row).
  await queueTask(
    db,
    row.id,
    {
      task_type: "partner_share_update",
      due_at: new Date(),
      payload: { reason: "job_board_post" },
    },
    userId,
  );
  await insertTouchpoint(db, row.id, "note_added", userId, {
    payload: { reason: "job_board_task_queued" },
  });
}

async function handleUnlockProfessors(
  db: DB,
  row: OutreachRow,
  body: { professor_ids?: string[]; permission?: ContactPermission },
  userId: string,
) {
  const ids = body.professor_ids ?? [];
  const permission = body.permission ?? "via_dept";
  if (ids.length === 0) throw new Error("professor_ids required");
  if (!["granted_direct", "via_dept", "via_listserv"].includes(permission)) {
    throw new Error("Invalid permission for unlock");
  }

  const { error } = await db
    .from("student_outreach")
    .update({
      contact_permission: permission,
      permission_dependency_id: row.id,
      last_edited_by: userId,
      last_edited_at: new Date().toISOString(),
    })
    .in("id", ids)
    .eq("stakeholder_type", "professor");
  if (error) throw new Error(error.message);

  // Queue Day 0 for each unlocked professor.
  const now = new Date();
  for (const profId of ids) {
    await queueTask(
      db,
      profId,
      { task_type: "outreach_followup_email", due_at: now },
      userId,
    );
    await insertTouchpoint(db, profId, "approval_granted", userId, {
      payload: { source: "unlock_via_dept", parent_outreach_id: row.id, permission },
    });
  }

  await insertTouchpoint(db, row.id, "approval_granted", userId, {
    payload: { unlocked_professor_count: ids.length, permission },
  });
}

// ── Tasks ───────────────────────────────────────────────────────────────

async function handleCompleteTask(
  db: DB,
  row: OutreachRow,
  body: { task_id?: string; notes?: string },
  userId: string,
) {
  if (!body.task_id) throw new Error("task_id required");
  const { data: task } = await db
    .from("student_outreach_tasks")
    .select("*")
    .eq("id", body.task_id)
    .eq("outreach_id", row.id)
    .single();
  if (!task) throw new Error("Task not found");
  const t = task as { task_type: TaskType; status: string };
  if (t.status !== "pending") throw new Error("Task already resolved");

  await db
    .from("student_outreach_tasks")
    .update({
      status: "completed",
      notes: body.notes ?? null,
      completed_at: new Date().toISOString(),
      completed_by: userId,
    })
    .eq("id", body.task_id);

  // Some task types trigger follow-up tasks on completion.
  if (t.task_type === "partner_seasonal_checkin" && row.status === "active_partner") {
    const seasonal = nextSeasonalDate(new Date());
    await queueTask(
      db,
      row.id,
      {
        task_type: "partner_seasonal_checkin",
        due_at: seasonal.due_at,
        payload: { season: seasonal.label },
      },
      userId,
    );
  }
  if (t.task_type === "yearly_leadership_recheck" && row.status === "active_partner") {
    await queueTask(
      db,
      row.id,
      {
        task_type: "yearly_leadership_recheck",
        due_at: new Date(Date.now() + 365 * DAY_MS),
      },
      userId,
    );
  }

  await touchOutreach(db, row.id, userId);
}

async function handleCancelTask(
  db: DB,
  row: OutreachRow,
  body: { task_id?: string; notes?: string },
  userId: string,
) {
  if (!body.task_id) throw new Error("task_id required");
  await db
    .from("student_outreach_tasks")
    .update({
      status: "cancelled",
      notes: body.notes ?? null,
      completed_at: new Date().toISOString(),
      completed_by: userId,
    })
    .eq("id", body.task_id)
    .eq("outreach_id", row.id)
    .eq("status", "pending");
  await insertTouchpoint(db, row.id, "task_cancelled", userId, {
    payload: { task_id: body.task_id },
    notes: body.notes ?? null,
  });
  await touchOutreach(db, row.id, userId);
}

async function handleRescheduleTask(
  db: DB,
  row: OutreachRow,
  body: { task_id?: string; due_at?: string },
  userId: string,
) {
  if (!body.task_id || !body.due_at) throw new Error("task_id + due_at required");
  const due = new Date(body.due_at);
  if (isNaN(due.getTime())) throw new Error("Invalid due_at");
  await db
    .from("student_outreach_tasks")
    .update({ due_at: due.toISOString() })
    .eq("id", body.task_id)
    .eq("outreach_id", row.id)
    .eq("status", "pending");
  await touchOutreach(db, row.id, userId);
}

/**
 * v9 Phase 4: log a research-phase call attempt. Used when admin is
 * calling a provider to obtain a hiring email (or any other
 * pre-launch research call). No task claim, no stage transition —
 * just emits the appropriate call_* touchpoint with a research_call
 * marker in the payload so the timeline + drawer can distinguish
 * from cadence-driven calls.
 *
 * Outcome map mirrors the existing log_call vocabulary for narration
 * consistency:
 *   no_answer   → call_no_answer
 *   voicemail   → call_voicemail
 *   connected   → call_connected
 *   wrong_number→ call_wrong_number
 *
 * After log: caller decides whether to add_contact (if email was
 * obtained) — the modal chains the two actions client-side.
 */
/**
 * v9 Phase 9: enroll a newly-discovered contact into the already-
 * launched cadence. Modes are channel-aware — UI shows only what
 * the contact's data supports (email-only contact can't choose
 * call modes, etc.).
 *
 *   send_now_email      → 1 outreach_email_send task at due_at=now;
 *                          inline fires.
 *   send_now_call       → 1 outreach_followup_call task at now.
 *   send_now_both       → both above.
 *   full_email_cadence  → planSequence per-recipient mode with
 *                          channels.email=true, channels.phone=false;
 *                          full cadence starting today (Day 0 fires
 *                          inline, follow-ups queue per cadence).
 *   full_call_cadence   → planSequence channels.email=false,
 *                          channels.phone=true.
 *   full_both           → planSequence both channels.
 *   informational       → note_added touchpoint with contact_id +
 *                          informational_only=true. No tasks. Banner
 *                          on the contact dismisses on next refetch.
 *
 * Per-recipient cadence tasks use the same plan/payload shape as
 * the original launch (step 2's planSequence), so they integrate
 * cleanly with the existing Calls tab + drawer Timeline per-task
 * surfaces.
 */
async function handleEnrollContactInCadence(
  db: DB,
  row: OutreachRow,
  body: {
    contact_id?: string;
    mode?:
      | "send_now_email"
      | "send_now_call"
      | "send_now_both"
      | "full_email_cadence"
      | "full_call_cadence"
      | "full_both"
      | "informational";
  },
  userId: string,
) {
  if (!body.contact_id) throw new Error("contact_id required");
  if (!body.mode) throw new Error("mode required");

  // Load the contact + verify it belongs to this outreach row.
  const { data: contactData } = await db
    .from("student_outreach_contacts")
    .select("*")
    .eq("id", body.contact_id)
    .eq("outreach_id", row.id)
    .single();
  if (!contactData) throw new Error("Contact not found on this outreach");
  const contact = contactData as {
    id: string;
    first_name: string | null;
    last_name: string | null;
    name: string;
    role: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    status: ContactStatus;
  };

  if (body.mode === "informational") {
    await insertTouchpoint(db, row.id, "note_added", userId, {
      payload: { contact_id: contact.id, informational_only: true },
      notes: `${contact.name} marked informational-only — no outreach queued.`,
    });
    await touchOutreach(db, row.id, userId);
    return;
  }

  const wantsEmail =
    body.mode === "send_now_email" ||
    body.mode === "send_now_both" ||
    body.mode === "full_email_cadence" ||
    body.mode === "full_both";
  const wantsCall =
    body.mode === "send_now_call" ||
    body.mode === "send_now_both" ||
    body.mode === "full_call_cadence" ||
    body.mode === "full_both";

  if (wantsEmail && !contact.email) {
    throw new Error("Contact has no email — pick a call-only mode");
  }
  if (wantsCall && !contact.phone && !contact.mobile) {
    throw new Error("Contact has no phone — pick an email-only mode");
  }

  const cadenceKey: CadenceKey =
    row.kind === "provider" ? "provider" : row.stakeholder_type;

  const isGeneral =
    contact.role === "General Office" || contact.role === "General Inbox";

  // Load the row's campus for snapshot composition.
  const { data: campusData } = await db
    .from("student_outreach_campuses")
    .select("name")
    .eq("id", row.campus_id)
    .single();
  const campusName = (campusData as { name: string } | null)?.name ?? "the university";

  // Load ALL active contacts for the team-greeting context — the
  // general variant body references the named contacts to date.
  const { data: allContacts } = await db
    .from("student_outreach_contacts")
    .select("*")
    .eq("outreach_id", row.id)
    .eq("status", "active");

  const snapshotsByVariant = defaultSnapshotsByVariant(cadenceKey, {
    organization_name: row.organization_name,
    campus_name: campusName,
    contacts: (allContacts ?? []) as Contact[],
  });
  const callScripts = defaultCallScriptsFor(cadenceKey);

  const recipientPlan: RecipientPlan = {
    contact_id: contact.id,
    variant: isGeneral ? "general" : "named",
    channels: {
      email: wantsEmail,
      phone: wantsCall,
    },
    recipient_name:
      [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim() ||
      contact.name,
    recipient_first_name: contact.first_name,
    recipient_phone: contact.phone || contact.mobile || null,
    recipient_role: contact.role,
  };

  const fullPlan = planSequence({
    outreach_id: row.id,
    stakeholder_type: cadenceKey,
    recipients: [recipientPlan],
    email_snapshots_by_variant: snapshotsByVariant,
    call_scripts: callScripts,
    user_id: userId,
  });

  const isSendNow =
    body.mode === "send_now_email" ||
    body.mode === "send_now_call" ||
    body.mode === "send_now_both";
  const tasksToQueue = isSendNow
    ? fullPlan.filter((p) => {
        const day = (p.payload as Record<string, unknown>).day;
        return day === 0;
      })
    : fullPlan;

  if (tasksToQueue.length === 0) {
    throw new Error("Nothing to queue for this enrollment mode");
  }

  const inserts = tasksToQueue.map((p) => ({
    outreach_id: row.id,
    task_type: p.task_type,
    due_at: p.due_at.toISOString(),
    payload: p.payload,
    created_by: userId,
  }));
  const { data: insertedTasks, error: insertErr } = await db
    .from("student_outreach_tasks")
    .insert(inserts)
    .select("id, task_type, payload, due_at");
  if (insertErr) throw new Error(insertErr.message);

  await insertTouchpoint(db, row.id, "note_added", userId, {
    payload: { contact_id: contact.id, enrolled_mode: body.mode },
    notes: `${contact.name} enrolled in cadence (${body.mode}).`,
  });
  await touchOutreach(db, row.id, userId);

  // Inline-fire Day-0 email tasks if any (for send_now_email/both
  // and full_email_cadence / full_both modes).
  const day0EmailTasks = (insertedTasks ?? []).filter((t) => {
    const tt = t as { task_type: string; payload: Record<string, unknown> };
    return tt.task_type === "outreach_email_send" && tt.payload?.day === 0;
  }) as Array<{ id: string }>;
  if (day0EmailTasks.length > 0) {
    const fireResults = await Promise.allSettled(
      day0EmailTasks.map((t) => executeEmailTask(t.id)),
    );
    for (const r of fireResults) {
      if (r.status === "rejected") {
        console.error("Post-launch enrollment Day-0 send failed:", r.reason);
      }
    }
  }
}

async function handleLogResearchCall(
  db: DB,
  row: OutreachRow,
  body: { outcome?: string; notes?: string; verified?: boolean },
  userId: string,
) {
  const outcomeMap: Record<string, TouchpointType> = {
    no_answer: "call_no_answer",
    voicemail: "call_voicemail",
    connected: "call_connected",
    wrong_number: "call_wrong_number",
  };
  const tpType = outcomeMap[body.outcome ?? ""];
  if (!tpType) throw new Error("Invalid research-call outcome");
  // Pre-Flight 3-call verification gate: when admin reaches someone AND
  // confirms contacts on the call, mark the touchpoint with `verified: true`.
  // The Launch Outreach gate (derived state, see verification-state.ts) treats
  // any `call_connected` touchpoint with `verified: true` as immediate
  // verification; otherwise it counts toward the 3-attempts-across-3-days
  // fallback unblock.
  const verified = body.verified === true && body.outcome === "connected";
  await insertTouchpoint(db, row.id, tpType, userId, {
    channel: "phone",
    outcome: body.outcome,
    notes: body.notes ?? null,
    payload: { reason: "research_call", verified },
  });
  await touchOutreach(db, row.id, userId);
}

async function handleQueueManualTask(
  db: DB,
  row: OutreachRow,
  body: { task_type?: TaskType; due_at?: string; notes?: string },
  userId: string,
) {
  if (!body.task_type) throw new Error("task_type required");
  if (!body.due_at) throw new Error("due_at required");
  const due = new Date(body.due_at);
  if (isNaN(due.getTime())) throw new Error("Invalid due_at");
  // v8.10.26: tag manual_followup tasks with reason=custom so the
  // queue route's customTaskByOutreach map picks them up. Notes go in
  // payload.notes so the Tasks section in the drawer can render them.
  const payload: Record<string, unknown> = {};
  if (body.task_type === "manual_followup") {
    payload.reason = "custom";
    if (body.notes) payload.notes = body.notes;
  } else if (body.notes) {
    payload.admin_notes = body.notes;
  }
  await queueTask(
    db,
    row.id,
    { task_type: body.task_type, due_at: due, payload },
    userId,
  );
  await touchOutreach(db, row.id, userId);
}

// ── Snooze ──────────────────────────────────────────────────────────────

/**
 * v9 Make Client — provider conversion handler. The provider side of
 * the funnel terminates here: writes the Client signal on the
 * business_profile metadata (the same field the Partner-Prospect
 * gate reads), advances the outreach row to active_partner so its
 * canonical Stage derives to "converted", and logs a stage_change
 * touchpoint for the timeline.
 *
 * Provider rows only (kind='provider'). Stakeholder rows use the
 * existing mark_partner action; the operational intent is the same
 * (graduate to active relationship), the implementation differs
 * because client-ness is stored on business_profiles, not on the
 * outreach row.
 *
 * Loop closure: writing interview_terms_accepted_at fires the
 * Partner-Prospect gate for any Site whose catchment includes this
 * provider. The university research card surfaces in Partner
 * Prospects on the admin's next In Basket fetch. No additional
 * machinery — the gate is already reading from this column.
 */
async function handleMakeClient(db: DB, row: OutreachRow, userId: string) {
  if (row.kind !== "provider") {
    throw new Error("make_client only valid for kind='provider' rows");
  }

  const nowIso = new Date().toISOString();
  let businessProfileId = row.provider_business_profile_id;

  // For olera-providers based rows, we need to create a business_profiles
  // row first since they don't have one yet.
  if (!businessProfileId) {
    const oleraProviderId = (row.research_data as { olera_provider_id?: string })?.olera_provider_id;
    if (!oleraProviderId) {
      throw new Error("Provider row missing both provider_business_profile_id and olera_provider_id");
    }

    // Fetch provider data from olera-providers
    const { data: oleraProvider } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, city, state, email, phone, website, slug, address, zipcode")
      .eq("provider_id", oleraProviderId)
      .maybeSingle();

    if (!oleraProvider) {
      throw new Error(`olera-providers entry not found: ${oleraProviderId}`);
    }

    // Create a business_profiles row for this provider
    const { data: newBp, error: createErr } = await db
      .from("business_profiles")
      .insert({
        type: "organization",
        display_name: oleraProvider.provider_name || row.organization_name,
        city: oleraProvider.city,
        state: oleraProvider.state,
        email: oleraProvider.email,
        phone: oleraProvider.phone,
        website: oleraProvider.website,
        slug: oleraProvider.slug,
        address: oleraProvider.address,
        zip: oleraProvider.zipcode?.toString() || null,
        metadata: { interview_terms_accepted_at: nowIso },
        source_provider_id: oleraProviderId,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select("id")
      .single();

    if (createErr || !newBp) {
      throw new Error(`Failed to create business_profiles: ${createErr?.message ?? "unknown error"}`);
    }

    businessProfileId = newBp.id;

    // Update student_outreach to link to the new business_profiles row
    await db
      .from("student_outreach")
      .update({ provider_business_profile_id: businessProfileId })
      .eq("id", row.id);
  } else {
    // Existing business_profiles row - update its metadata
    const { data: bp } = await db
      .from("business_profiles")
      .select("metadata")
      .eq("id", businessProfileId)
      .maybeSingle();
    if (!bp) throw new Error("Business profile not found");

    const existingMeta = (bp.metadata as Record<string, unknown> | null) ?? {};
    const newMeta = {
      ...existingMeta,
      interview_terms_accepted_at: nowIso,
    };

    const { error: bpErr } = await db
      .from("business_profiles")
      .update({ metadata: newMeta, updated_at: nowIso })
      .eq("id", businessProfileId);
    if (bpErr) throw new Error(bpErr.message);
  }

  await insertTouchpoint(db, row.id, "stage_change", userId, {
    notes: "Marked as Client (provider conversion)",
    payload: { to: "client", via: "admin_make_client" },
  });

  const { error: srErr } = await db
    .from("student_outreach")
    .update({
      status: "active_partner",
      last_edited_by: userId,
      last_edited_at: nowIso,
    })
    .eq("id", row.id);
  if (srErr) throw new Error(srErr.message);

  // v9 final: clean up every pending operational task on this
  // outreach. The provider organization just converted — General
  // Contact cards, Specific Contact cards, queued call follow-ups,
  // queued cadence emails are all moot. Cancelling here removes
  // them from Calls / Replies / Meetings instantly so admin
  // doesn't have to chase ghost cards after conversion. The status
  // transition above already removes the outreach from those tab
  // queries, but cancelling pending tasks closes the loop on the
  // task table too so the per-recipient fan-out counts go to 0
  // (Calls especially counts pending tasks directly).
  await db
    .from("student_outreach_tasks")
    .update({
      status: "cancelled",
      completed_at: nowIso,
      completed_by: userId,
    })
    .eq("outreach_id", row.id)
    .eq("status", "pending");
}

async function handleSnooze(
  db: DB,
  row: OutreachRow,
  body: { snoozed_until?: string; notes?: string },
  userId: string,
) {
  if (!body.snoozed_until) throw new Error("snoozed_until required");
  const until = new Date(body.snoozed_until);
  if (isNaN(until.getTime())) throw new Error("Invalid snoozed_until");

  // Push all pending task due_ats out to the snooze date if they're before it.
  const { data: tasks } = await db
    .from("student_outreach_tasks")
    .select("id, due_at")
    .eq("outreach_id", row.id)
    .eq("status", "pending");
  for (const t of (tasks ?? []) as Array<{ id: string; due_at: string }>) {
    if (new Date(t.due_at) < until) {
      await db
        .from("student_outreach_tasks")
        .update({ due_at: until.toISOString() })
        .eq("id", t.id);
    }
  }

  await touchOutreach(db, row.id, userId, { snoozed_until: until.toISOString() });
  await insertTouchpoint(db, row.id, "snoozed", userId, {
    notes: body.notes ?? null,
    payload: { snoozed_until: until.toISOString() },
  });
}

// Suppress unused-import warning (Status is used implicitly in transitionStage signature).
const _statusKeepalive: Status[] = ["prospect"];
void _statusKeepalive;
const _stakeholderKeepalive: StakeholderType[] = ["advisor"];
void _stakeholderKeepalive;
