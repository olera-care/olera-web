"use client";

/**
 * Student Outreach Drawer — v2.
 *
 * Core principle: at every moment the admin should know exactly what
 * to do next. The "Next Step" panel at the top is the single source of
 * truth — primary CTA + cadence checklist + the always-visible
 * "Mark as Partner" graduation button (from `engaged` onward).
 *
 * Sections are also stakeholder-type-aware: orgs see multi-officer +
 * IG/contact-form actions, advisors see a single contact and no
 * approvals, dept heads see approvals + the bulk-import nudge,
 * professors get the minimal flow.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { MarkPartnerModal } from "./MarkPartnerModal";
import { OutreachStepList } from "./OutreachStepList";
import { PreFlightReviewModal } from "./PreFlightReviewModal";
import {
  PARTNER_CTA_STAGES,
  STAKEHOLDER_TYPE_LABELS,
  STATUS_LABELS,
  type Approval,
  type ApprovalStatus,
  type Contact,
  type DrawerContext,
  type ResearchData,
  type StakeholderType,
  type Status,
  type Task,
} from "@/lib/student-outreach/types";
import { OUTREACH_DAYS_BY_TYPE } from "@/lib/student-outreach/cadence";
import {
  DEPARTMENTS,
  OTHER,
  PROGRAMS,
  ROLES_BY_TYPE,
  singleProgram,
  supportsApprovals,
  supportsMultipleContacts,
} from "@/lib/student-outreach/presets";
import { narrateTouchpoint } from "@/lib/student-outreach/narration";

interface DrawerProps {
  outreachId: string;
  onClose: () => void;
  onAction: (refreshed: DrawerContext | null) => void;
}

type ActionFn = (action: string, payload?: Record<string, unknown>) => Promise<DrawerContext>;

// v8.10.11: TabContext + TabContextBanner removed. The drawer's section
// h3s + per-state guidance already convey orientation; the banner was
// repeating it one row above. tabContext prop on DrawerProps was only
// used to drive that banner, so it's gone too.
export function Drawer({ outreachId, onClose, onAction }: DrawerProps) {
  const [ctx, setCtx] = useState<DrawerContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/admin/student-outreach/${outreachId}`);
        if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
        const data = await res.json();
        if (!cancelled) setCtx(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [outreachId]);

  const action: ActionFn = useCallback(
    async (action, payload = {}) => {
      const res = await fetch(`/api/admin/student-outreach/${outreachId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setCtx(data);
      onAction(data);
      return data as DrawerContext;
    },
    [outreachId, onAction],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-label="Close drawer" />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          {ctx ? (() => {
            // v8.9: contact name leads everywhere. The displayed name is
            // built from title + first + last when present, falling back
            // to the legacy `name` column. Org/campus/type drop to the
            // subline; if no contact exists yet, the org name takes the
            // headline so the card isn't blank.
            const primary = ctx.contacts.find((c) => c.status === "active") ?? ctx.contacts[0] ?? null;
            const contactDisplay = primary
              ? [primary.title, primary.first_name, primary.last_name]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || primary.name || null
              : null;
            const headline = contactDisplay || ctx.outreach.organization_name;
            const showOrgInSubline =
              !!contactDisplay && contactDisplay !== ctx.outreach.organization_name;
            return (
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-gray-900">{headline}</h2>
                <p className="truncate text-sm text-gray-500">
                  {showOrgInSubline && (
                    <>
                      {ctx.outreach.organization_name}
                      {ctx.outreach.department &&
                        ctx.outreach.department !== ctx.outreach.organization_name &&
                        ` · ${ctx.outreach.department}`}
                      {" · "}
                    </>
                  )}
                  {ctx.campus.name} · {STAKEHOLDER_TYPE_LABELS[ctx.outreach.stakeholder_type]}
                  {primary?.role && ` · ${primary.role}`}
                </p>
              </div>
            );
          })() : (
            <h2 className="text-lg font-semibold text-gray-400">Loading…</h2>
          )}
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <span aria-hidden>×</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-red-600">{error}</p>
          ) : ctx ? (
            <DrawerBody ctx={ctx} action={action} setError={setError} />
          ) : null}
        </div>
      </aside>
    </>
  );
}

/**
 * v8 two-zone layout: action card (Next Step) + Close Out (Danger Zone)
 * are always visible. Research / Contacts / Approvals / History tuck
 * under a "More details" toggle so the action surface stays clean.
 */
function DrawerBody({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  // v8.10.4: research stages are a different mode entirely. The research
  // form IS the next step, so it leads the drawer (no NextStepPanel),
  // and More details collapses by default to History (+ Permissions for
  // dept_head, since the email-professors approval gates research).
  const isResearch =
    ctx.outreach.status === "prospect" || ctx.outreach.status === "researched";
  const [showMore, setShowMore] = useState(false);
  return (
    <div className="space-y-6">
      <RelationshipBanner ctx={ctx} />
      {/* v8.10.11: TabContextBanner removed. The ResearchSection h3 +
          card orientation already convey "you're doing research" for
          research stages, and NextStepPanel's h3 + guidance already
          convey state for active-partner / closed states. The banner
          was repeating those signals one row above them. */}
      {isResearch ? (
        <ResearchModePanel ctx={ctx} action={action} setError={setError} />
      ) : (
        <NextStepPanel ctx={ctx} action={action} setError={setError} />
      )}
      <JobBoardTaskSection ctx={ctx} action={action} setError={setError} />
      {/* v8.10.7: in research stages, Close out is tucked under More
          details so it doesn't compete visually with the primary
          "Research complete" CTA. Outside research it stays at top
          level — admins use stop reasons actively across Replies,
          Calls, Meetings. */}
      {!isResearch && (
        <DangerZone ctx={ctx} action={action} setError={setError} />
      )}

      <div>
        <button
          onClick={() => setShowMore((s) => !s)}
          className="flex w-full items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          <span>{showMore ? "Hide details" : "More details"}</span>
          <span className="text-gray-400" aria-hidden>{showMore ? "▴" : "▾"}</span>
        </button>
        {showMore && (
          <div className="mt-4 space-y-6">
            {isResearch && (
              <DangerZone ctx={ctx} action={action} setError={setError} />
            )}
            {/* Research stages render ResearchSection at the top via
                ResearchModePanel — don't duplicate it inside More details. */}
            {!isResearch && (
              <ResearchSection ctx={ctx} action={action} setError={setError} />
            )}
            {/* v8.7: Contacts section only for student orgs (multi-officer).
                Single-contact types render the primary contact inline in
                ResearchSection to avoid a redundant section. */}
            {supportsMultipleContacts(ctx.outreach.stakeholder_type) && (
              <ContactsSection ctx={ctx} action={action} setError={setError} />
            )}
            {supportsApprovals(ctx.outreach.stakeholder_type) && (
              <ApprovalsSection ctx={ctx} action={action} setError={setError} />
            )}
            <HistorySection ctx={ctx} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Relationship banner ─────────────────────────────────────────────────

function RelationshipBanner({ ctx }: { ctx: DrawerContext }) {
  const items: string[] = [];
  if (ctx.referred_from) items.push(`Referred from ${ctx.referred_from.organization_name}`);
  if (ctx.redirected_to) items.push(`Redirected to ${ctx.redirected_to.organization_name}`);
  if (ctx.permission_dependency) {
    items.push(
      `Permission via ${ctx.permission_dependency.organization_name} (${STATUS_LABELS[ctx.permission_dependency.status]})`,
    );
  }
  if (ctx.outreach.snoozed_until && new Date(ctx.outreach.snoozed_until) > new Date()) {
    items.push(`Snoozed until ${new Date(ctx.outreach.snoozed_until).toLocaleDateString()}`);
  }
  if (items.length === 0) return null;
  return (
    <div className="rounded-md bg-amber-50/60 px-3 py-2 text-xs text-amber-900">
      {items.join(" · ")}
    </div>
  );
}

// ── Research mode panel (v8.10.4) ───────────────────────────────────────
//
// Replaces NextStepPanel for prospect / researched stages. Renders the
// ResearchSection input form WITH orientation paragraph + checklist +
// CTA inside a single card — admin sees one cohesive workflow instead
// of an orientation card plus a separately-collapsed input form. CTA
// changes by status: prospect → "Research complete", researched →
// opens PreFlightReviewModal.

function ResearchModePanel({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const status = ctx.outreach.status;
  const type = ctx.outreach.stakeholder_type;
  const [showPreFlight, setShowPreFlight] = useState(false);

  // Readiness gating per stage.
  const haveContact = ctx.contacts.some((c) => c.status === "active");
  const havePrograms = ctx.outreach.programs.length > 0;
  const haveDept = type === "dept_head" ? Boolean(ctx.outreach.department) : true;
  const eligibleEmail = ctx.contacts.filter(
    (c) => c.status === "active" && c.email,
  ).length;

  const isProspect = status === "prospect";
  const ready = isProspect ? haveContact && havePrograms && haveDept : eligibleEmail > 0;

  // v8.10.11: orientation copy trimmed — the section h3 ("RESEARCH")
  // already says what the section is for, so the prefix sentence
  // ("Research this stakeholder." / "Ready to email.") was redundant.
  // What's left is the actionable bit only.
  const orientation = isProspect ? (
    <>Add a contact and pick programs below, then click <em>Research complete</em>. You&apos;ll review the email sequence next.</>
  ) : (
    <>Review the {OUTREACH_DAYS_BY_TYPE[type].length}-step email sequence below. Day 0 sends right away; later days fire automatically.</>
  );

  const checklist = isProspect
    ? [
        { done: haveContact, label: "At least one active contact added" },
        { done: havePrograms, label: "Programs selected" },
        ...(type === "dept_head" ? [{ done: haveDept, label: "Department selected" }] : []),
      ]
    : [{ done: eligibleEmail > 0, label: `Active contact with email (${eligibleEmail} found)` }];

  const ctaLabel = isProspect
    ? ready
      ? "✓ Research complete — review email sequence"
      : "Add a contact + programs to continue"
    : ready
      ? "Start email sequence →"
      : "Add a contact with email to continue";

  // v8.10.5: prospect's CTA chains mark_research_complete with opening
  // PreFlight. Removes the previous "two clicks to schedule" friction
  // — admin transitions to researched AND lands on the email-review
  // modal in one action. ctx re-renders to the researched-stage label
  // behind the modal, but admin doesn't have to click again.
  const onCtaClick = isProspect
    ? async () => {
        try {
          await action("mark_research_complete");
          setShowPreFlight(true);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Action failed");
        }
      }
    : () => setShowPreFlight(true);

  const cta = (
    <button
      onClick={onCtaClick}
      disabled={!ready}
      className={`w-full rounded-md px-3 py-2 text-sm font-semibold text-white transition-colors ${
        ready ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-300 cursor-not-allowed"
      }`}
    >
      {ctaLabel}
    </button>
  );

  return (
    <>
      <ResearchSection
        ctx={ctx}
        action={action}
        setError={setError}
        research={{ orientation, checklist, cta }}
      />
      {showPreFlight && (
        <PreFlightReviewModal
          stakeholderType={type}
          organizationName={ctx.outreach.organization_name}
          campusName={ctx.campus.name}
          contacts={ctx.contacts}
          onCancel={() => setShowPreFlight(false)}
          onSubmit={async (snapshots) => {
            try {
              await action("schedule_sequence", { email_snapshots: snapshots });
              setShowPreFlight(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Schedule failed");
              throw e;
            }
          }}
        />
      )}
    </>
  );
}

// ── Next Step panel ──────────────────────────────────────────────────────
//
// v8.3: drives guidance from the SAME state the row-card pill shows
// (replies_state / meeting_state from the server). Gives the admin one
// short paragraph: what's happening + what to do next. The row cards
// own the actual buttons; the drawer just describes and offers a few
// always-visible CTAs (Mark Partner, Log meeting outcome).

function NextStepPanel({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const status = ctx.outreach.status;
  const type = ctx.outreach.stakeholder_type;
  const [showPreFlight, setShowPreFlight] = useState(false);
  const [showPartner, setShowPartner] = useState(false);
  const [showFollowup, setShowFollowup] = useState(false);

  const partnerCtaVisible = PARTNER_CTA_STAGES.includes(status);
  const hasActiveScheduledMeeting = ctx.meeting_state === "scheduled";

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Next step
      </h3>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="space-y-3 px-4 py-4">
          <StageGuidance
            ctx={ctx}
            onSchedulePreFlight={() => setShowPreFlight(true)}
            onOpenPartnerModal={() => setShowPartner(true)}
            action={action}
            setError={setError}
          />
        </div>

        {/* v8: post-meeting follow-up — for booked rows where the meeting happened */}
        {hasActiveScheduledMeeting && (
          <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3">
            <button
              onClick={() => setShowFollowup(true)}
              title="Meeting happened but they need follow-up before they commit. Notes show on the row in Replies."
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Log meeting outcome — needs follow-up
            </button>
          </div>
        )}

        {/* Always-visible Mark-as-Partner graduation */}
        {partnerCtaVisible && (
          <div className="border-t border-gray-100 bg-emerald-50/30 px-4 py-3">
            <button
              onClick={() => setShowPartner(true)}
              className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Mark as Partner ★
            </button>
            <p className="mt-1.5 text-center text-[11px] text-emerald-900/80">
              Click when you&apos;re confident they&apos;ve committed to sharing with students.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showPreFlight && (
        <PreFlightReviewModal
          stakeholderType={type}
          organizationName={ctx.outreach.organization_name}
          campusName={ctx.campus.name}
          contacts={ctx.contacts}
          onCancel={() => setShowPreFlight(false)}
          onSubmit={async (snapshots) => {
            try {
              await action("schedule_sequence", { email_snapshots: snapshots });
              setShowPreFlight(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Schedule failed");
              throw e;
            }
          }}
        />
      )}
      {showPartner && (
        <MarkPartnerModal
          organizationName={ctx.outreach.organization_name}
          onCancel={() => setShowPartner(false)}
          onConfirm={async (payload) => {
            try {
              await action("mark_partner", payload);
              setShowPartner(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
            }
          }}
        />
      )}
      {showFollowup && (
        <FollowupNotesModal
          onCancel={() => setShowFollowup(false)}
          onConfirm={async (notes) => {
            try {
              await action("mark_meeting_followup", { notes });
              setShowFollowup(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
              throw e;
            }
          }}
        />
      )}
    </section>
  );
}

// ── Stage guidance ───────────────────────────────────────────────────────
//
// v8.3: drives the next-step paragraph entirely off the *pill* state
// (replies_state / meeting_state from the server) when the row is in
// outreach_sent / engaged. Other statuses (research / partner / closed)
// stay status-driven because they don't have a pill substate.

function StageGuidance({
  ctx,
  onSchedulePreFlight,
  onOpenPartnerModal,
  action,
  setError,
}: {
  ctx: DrawerContext;
  onSchedulePreFlight: () => void;
  onOpenPartnerModal?: () => void;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const status = ctx.outreach.status;
  const type = ctx.outreach.stakeholder_type;
  const handleErr = (p: Promise<unknown>) =>
    p.catch((e) => setError(e instanceof Error ? e.message : "Action failed"));

  // Research: prospect → researched
  if (status === "prospect") {
    const haveContact = ctx.contacts.some((c) => c.status === "active");
    const havePrograms = ctx.outreach.programs.length > 0;
    const haveDept = type === "dept_head" ? Boolean(ctx.outreach.department) : true;
    const ready = haveContact && havePrograms && haveDept;
    return (
      <>
        <Guidance>
          <strong>Research this stakeholder.</strong> Add a contact and pick programs below, then click <em>Research complete</em>. You&apos;ll review the email sequence next.
        </Guidance>
        <ChecklistInline items={[
          { done: haveContact, label: "At least one active contact added" },
          { done: havePrograms, label: "Programs selected" },
          ...(type === "dept_head" ? [{ done: haveDept, label: "Department selected" }] : []),
        ]} />
        <div className="pt-1">
          <button
            onClick={() => handleErr(action("mark_research_complete"))}
            disabled={!ready}
            className={`w-full rounded-md px-3 py-2 text-sm font-semibold text-white transition-colors ${
              ready ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {ready ? "✓ Research complete — review email sequence" : "Add a contact + programs to continue"}
          </button>
        </div>
      </>
    );
  }

  if (status === "researched") {
    const eligibleEmail = ctx.contacts.filter((c) => c.status === "active" && c.email).length;
    const ready = eligibleEmail > 0;
    return (
      <>
        <Guidance>
          <strong>Ready to email.</strong> Review the {OUTREACH_DAYS_BY_TYPE[type].length}-email sequence and start it. Day 0 sends right away; later days fire automatically.
        </Guidance>
        <ChecklistInline items={[
          { done: ready, label: `Active contact with email (${eligibleEmail} found)` },
        ]} />
        <div className="pt-1">
          <button
            onClick={onSchedulePreFlight}
            disabled={!ready}
            className={`w-full rounded-md px-3 py-2 text-sm font-semibold text-white transition-colors ${
              ready ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {ready ? "Start email sequence →" : "Add a contact with email to continue"}
          </button>
        </div>
      </>
    );
  }

  // outreach_sent / engaged / meeting_scheduled: v8.9 always renders the
  // cadence step list (timeline + dial affordance). When higher-priority
  // states are active (stale / engaged-reply / wants_meeting / etc), a
  // contextual banner appears above the step list rather than replacing
  // it — so the phone number and call-outcome buttons stay reachable
  // regardless of which sub-state the row is in. Multiple things can be
  // true at once (e.g. stale on email + call due today); both render.
  if (status === "outreach_sent" || status === "engaged" || status === "meeting_scheduled") {
    const m = ctx.meeting_state;
    const r = ctx.replies_state;

    // v8.10: when a phone call is overdue, the call card in the step list
    // IS the action — banners would compete with it. Suppress the
    // stale/engaged/awaiting/wants_meeting/needs_followup banners; keep
    // meeting_scheduled (carries the meeting date, no call action expected).
    const now = Date.now();
    const hasOverdueCall = ctx.pending_tasks.some(
      (t) => t.task_type === "outreach_followup_call" && new Date(t.due_at).getTime() <= now,
    );

    let banner: React.ReactNode = null;
    if (m === "scheduled") {
      banner = (
        <Guidance>
          <strong>Meeting is on the calendar.</strong>
          {ctx.meeting_at && <> It&apos;s scheduled for {new Date(ctx.meeting_at).toLocaleString()}.</>}
          {" "}After the meeting, click <em>Mark as Partner</em> if they committed, or use <em>Log meeting outcome</em> below if they need a follow-up email first.
        </Guidance>
      );
    } else if (hasOverdueCall) {
      // Single source of truth: the call card. Drop competing banners.
      banner = null;
    } else if (m === "in_flight" || r === "wants_meeting") {
      banner = (
        <Guidance>
          <strong>They want to meet.</strong> Coordinate the time over email. When you have a date, close this drawer and click <em>Booked it</em> on the row.
        </Guidance>
      );
    } else if (r === "needs_followup") {
      banner = (
        <>
          <Guidance>
            <strong>Met — needs a follow-up.</strong> The meeting happened and they want time to think. Send a follow-up email through Gmail to keep the conversation alive. Once they commit, click <em>Mark as Partner</em>.
          </Guidance>
          {ctx.followup_notes && (
            <p className="rounded-md bg-gray-50 px-3 py-2 text-xs italic text-gray-700">
              From the meeting: &ldquo;{ctx.followup_notes}&rdquo;
            </p>
          )}
        </>
      );
    } else if (r === "awaiting_callback") {
      const kindText = ctx.awaiting_callback_kind === "promised"
        ? "they promised to call back"
        : "you left them a voicemail";
      banner = (
        <Guidance>
          <strong>Waiting for a callback.</strong> You called and {kindText}. Watch Gmail for callback or voicemail-to-email notifications. The next scheduled phone day will automatically re-engage this row.
        </Guidance>
      );
    } else if (r === "engaged") {
      banner = (
        <Guidance>
          <strong>They replied.</strong> Open the email in Gmail to see what they said. Then close this drawer and click <em>Open reply</em> on the row to record the next step. If they&apos;ve already committed, click <em>Mark as Partner</em> below.
        </Guidance>
      );
    } else if (r === "stale") {
      banner = (
        <Guidance>
          <strong>Email cadence has stalled.</strong> Send a custom re-engage email through Gmail, or close the row if it&apos;s not going anywhere.
        </Guidance>
      );
    }

    return (
      <>
        {banner}
        <OutreachStepList ctx={ctx} action={action} setError={setError} onOpenPartnerModal={onOpenPartnerModal} />
      </>
    );
  }

  if (status === "active_partner") {
    const seasonal = ctx.pending_tasks.find((t) => t.task_type === "outreach_email_send");
    return (
      <Guidance>
        <strong>Partner.</strong>{" "}
        {seasonal
          ? `Next seasonal email auto-sends ${new Date(seasonal.due_at).toLocaleDateString()}.`
          : "Seasonal emails are queued automatically — no action needed."}
      </Guidance>
    );
  }

  if (status === "no_response_closed" || status === "wrong_contact") {
    return (
      <>
        <Guidance>
          {status === "no_response_closed"
            ? <>Closed — no response. {ctx.outreach.reopen_at && `Auto-reopens ${ctx.outreach.reopen_at}.`}</>
            : "Closed — wrong contact. Add a new contact below and re-open if you find someone reachable."}
        </Guidance>
        <PrimaryButton onClick={() => handleErr(action("reopen"))}>Re-open now</PrimaryButton>
      </>
    );
  }

  if (status === "not_interested" || status === "do_not_contact" || status === "redirected") {
    return (
      <Guidance>
        {STATUS_LABELS[status]}. No further outreach. Use the campus view to find related stakeholders or add a new one.
      </Guidance>
    );
  }

  return <Guidance>No actions available in this stage.</Guidance>;
}

// ── Research section ───────────────────────────────────────────────────

function ResearchSection({
  ctx,
  action,
  setError,
  /** v8.10.4: when in research stages we hoist this section to the top
   *  of the drawer and render orientation + checklist + CTA inside the
   *  same card. Outside research stages this stays a plain input form
   *  inside More details. */
  research,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
  research?: {
    orientation: React.ReactNode;
    checklist: Array<{ done: boolean; label: string }>;
    cta: React.ReactNode;
  };
}) {
  const r = ctx.outreach.research_data;
  const type = ctx.outreach.stakeholder_type;
  const [notes, setNotes] = useState(r.notes ?? "");
  const [orgName, setOrgName] = useState(ctx.outreach.organization_name);

  const [department, setDepartment] = useState(
    ctx.outreach.department && DEPARTMENTS.includes(ctx.outreach.department)
      ? ctx.outreach.department
      : ctx.outreach.department ? OTHER : "",
  );
  const [departmentOther, setDepartmentOther] = useState(
    ctx.outreach.department && !DEPARTMENTS.includes(ctx.outreach.department)
      ? ctx.outreach.department
      : "",
  );

  const [programs, setPrograms] = useState<string[]>(ctx.outreach.programs);

  const programOptions = useMemo(() => PROGRAMS.filter((p) => p !== OTHER), []);

  // v8.7: for single-contact types (advisor / dept_head / professor) we
  // render the primary contact inline here instead of a separate
  // Contacts section. Track the first/last/email/phone right alongside
  // the rest of the research fields.
  const isMultiContact = type === "student_org";
  const showTitleField = type === "dept_head" || type === "professor";
  const primary = ctx.contacts.find((c) => c.status === "active") ?? ctx.contacts[0] ?? null;
  const [title, setTitle] = useState(primary?.title ?? (showTitleField ? "Dr." : ""));
  const [firstName, setFirstName] = useState(primary?.first_name ?? "");
  const [lastName, setLastName] = useState(primary?.last_name ?? "");
  const [email, setEmail] = useState(primary?.email ?? "");
  const [phone, setPhone] = useState(primary?.phone ?? "");

  const saveResearch = async () => {
    try {
      await action("update_research", {
        research: {
          notes,
        } satisfies ResearchData,
      });
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
  };

  const saveOutreach = async () => {
    try {
      const departmentValue = department === OTHER ? departmentOther.trim() || null : department || null;
      await action("update_outreach", {
        organization_name: orgName,
        department: departmentValue,
        programs,
      });
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
  };

  const savePrimaryContact = async () => {
    if (!primary) {
      // No contact exists yet; create one. Only fire when there's at least a first name.
      if (!firstName.trim()) return;
      try {
        await action("add_contact", {
          title: title.trim() || null,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          is_primary: true,
        });
      } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
      return;
    }
    try {
      await action("update_contact", {
        contact_id: primary.id,
        title: title.trim() || null,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
      });
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
  };

  const showDepartment = type === "dept_head" || type === "professor";
  const showOrgName = type === "student_org"; // others auto-derive

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Research
      </h3>
      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        {research?.orientation && (
          <Guidance>{research.orientation}</Guidance>
        )}
        {showOrgName && (
          <Field label="Organization name" value={orgName} onChange={setOrgName} onBlur={saveOutreach} />
        )}

        {showDepartment && (
          <>
            <Select
              label="Department"
              value={department}
              onChange={(v) => { setDepartment(v); setTimeout(saveOutreach, 0); }}
              options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
            />
            {department === OTHER && (
              <Field
                label="Other department"
                value={departmentOther}
                onChange={setDepartmentOther}
                onBlur={saveOutreach}
              />
            )}
          </>
        )}

        {/* v8.7: primary contact embedded for single-contact types */}
        {!isMultiContact && (
          <>
            {showTitleField && (
              <Field
                label="Title"
                value={title}
                onChange={setTitle}
                onBlur={savePrimaryContact}
                placeholder="Dr."
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <Field label="First name" value={firstName} onChange={setFirstName} onBlur={savePrimaryContact} />
              <Field label="Last name" value={lastName} onChange={setLastName} onBlur={savePrimaryContact} />
              <Field type="email" label="Email" value={email} onChange={setEmail} onBlur={savePrimaryContact} placeholder="name@uni.edu" />
              <Field label="Phone" value={phone} onChange={setPhone} onBlur={savePrimaryContact} />
            </div>
          </>
        )}

        {/* Programs */}
        {singleProgram(type) ? (
          <Select
            label="Program"
            value={programs[0] ?? ""}
            onChange={(v) => { setPrograms(v ? [v] : []); setTimeout(saveOutreach, 0); }}
            options={programOptions.map((p) => ({ value: p, label: p }))}
          />
        ) : (
          <MultiToggle
            label="Programs"
            values={programs}
            options={programOptions}
            onToggle={(v) => {
              const next = programs.includes(v) ? programs.filter((p) => p !== v) : [...programs, v];
              setPrograms(next);
              setTimeout(saveOutreach, 0);
            }}
          />
        )}

        <Field label="Research notes" value={notes} onChange={setNotes} onBlur={saveResearch} multiline />

        {research && (
          <>
            <ChecklistInline items={research.checklist} />
            <div className="pt-1">{research.cta}</div>
          </>
        )}
      </div>
    </section>
  );
}

// ── Contacts section (type-aware) ──────────────────────────────────────

function ContactsSection({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const type = ctx.outreach.stakeholder_type;
  const multi = supportsMultipleContacts(type);
  const [showAdd, setShowAdd] = useState(false);
  const active = ctx.contacts.filter((c) => c.status === "active");

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {multi ? `Contacts (${active.length} active)` : "Contact"}
        </h3>
        {(multi || active.length === 0) && (
          <SmallButton onClick={() => setShowAdd((s) => !s)}>
            {showAdd ? "Cancel" : multi ? "+ Add officer" : "+ Add contact"}
          </SmallButton>
        )}
      </div>
      <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
        {multi && (
          <div className="rounded-md border border-blue-100 bg-blue-50/60 p-2.5 text-xs text-blue-900">
            💡 Don't rely on one inbox — President, VP, and the outreach officer at minimum.
            Email each officer so info reaches whoever's online first.
          </div>
        )}
        {ctx.contacts.length === 0 && !showAdd && (
          <p className="text-sm text-gray-400">No contacts yet.</p>
        )}
        {ctx.contacts.map((c) => (
          <ContactRow key={c.id} contact={c} action={action} setError={setError} />
        ))}
        {showAdd && (
          <AddContactInline
            type={type}
            action={action}
            setError={setError}
            onSaved={() => setShowAdd(false)}
          />
        )}
      </div>
    </section>
  );
}

function ContactRow({
  contact,
  action,
  setError,
}: {
  contact: Contact;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const stale = contact.status !== "active";
  return (
    <div className={`rounded-md border border-gray-100 px-3 py-2 ${stale ? "bg-gray-50 opacity-70" : "bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            {contact.is_primary && "★ "}
            {[contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.name}
            {contact.role && <span className="ml-2 text-gray-500">{contact.role}</span>}
            {stale && <span className="ml-2 text-xs text-gray-400">[{contact.status}]</span>}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {[contact.email, contact.phone].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        {!stale && (
          <SmallButton onClick={() => action("mark_contact_stale", { contact_id: contact.id }).catch((e) => setError(e.message))}>
            Mark stale
          </SmallButton>
        )}
      </div>
    </div>
  );
}

function AddContactInline({
  type,
  action,
  setError,
  onSaved,
}: {
  type: StakeholderType;
  action: ActionFn;
  setError: (e: string | null) => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [roleOther, setRoleOther] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  return (
    <div className="space-y-2 rounded-md border border-dashed border-gray-200 p-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="First name *" value={firstName} onChange={setFirstName} />
        <Field label="Last name" value={lastName} onChange={setLastName} />
      </div>
      <Select
        label="Role"
        value={role}
        onChange={setRole}
        options={ROLES_BY_TYPE[type].map((r) => ({ value: r, label: r }))}
      />
      {role === OTHER && (
        <Field label="Other role" value={roleOther} onChange={setRoleOther} />
      )}
      <Field label="Email" value={email} onChange={setEmail} type="email" />
      <Field label="Phone" value={phone} onChange={setPhone} />
      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
        Primary contact
      </label>
      <PrimaryButton onClick={async () => {
        if (!firstName.trim()) { setError("First name required"); return; }
        try {
          await action("add_contact", {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            role: role === OTHER ? roleOther : role,
            email,
            phone,
            is_primary: isPrimary,
          });
          onSaved();
        } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
      }}>Add contact</PrimaryButton>
    </div>
  );
}

// ── Job board task (v8.7) ──────────────────────────────────────────────
//
// When this stakeholder granted "Post on university job board", a
// partner_share_update task is queued (deduped by campus). Render an
// action card with a Gmail composer link + Mark posted button.

function JobBoardTaskSection({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const task = ctx.pending_tasks.find(
    (t) =>
      t.task_type === "partner_share_update" &&
      (t.payload as Record<string, unknown> | null)?.reason === "job_board_post",
  );
  if (!task) return null;

  const handleErr = (p: Promise<unknown>) =>
    p.catch((e) => setError(e instanceof Error ? e.message : "Action failed"));

  const subject = encodeURIComponent(
    `Olera — clinical experience opportunity for ${ctx.campus.name} pre-health students`,
  );
  const composerUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}`;

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Job board post
      </h3>
      <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 text-sm text-emerald-950">
        <p>
          <strong>Permission granted.</strong> Post Olera&apos;s clinical-experience listing to{" "}
          {ctx.campus.name}&apos;s job board, then click <em>Mark posted</em> below.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href={composerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Open Gmail composer ↗
          </a>
          <button
            onClick={() => handleErr(action("mark_job_board_posted"))}
            className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-50"
          >
            Mark posted
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Approvals (advisor + dept_head) ────────────────────────────────────

// v8.7: collapsed to two binary permissions per the simplification spec.
//   - "Email professors directly" — dept_head only. Yes = bulk import
//     unlocks; No (denied) = dept distributes on our behalf.
//   - "Post on university job board" — both advisor and dept_head. Yes =
//     queue a campus-scoped post task (deduped by campus).
//
// Each kind doubles as the canonical approval_for string so we can
// recognize granted/denied rows by string match against the approvals
// table.

interface PermissionKind {
  key: string;
  approval_for: string;
  approval_type: "department" | "marketing" | "listserv" | "job_board" | "other";
  title: string;
  blurb: string;
  tooltip: string;
}

const PROFESSOR_PERMISSION: PermissionKind = {
  key: "email_professors",
  approval_for: "Email professors directly",
  approval_type: "department",
  title: "Email professors directly",
  blurb: "Yes — bulk-import professors. No — dept head distributes our materials on our behalf.",
  tooltip: "When granted, you can bulk-import professors and email them directly.",
};

const JOB_BOARD_PERMISSION: PermissionKind = {
  key: "job_board",
  approval_for: "Post on university job board",
  approval_type: "job_board",
  title: "Post on university job board",
  blurb: "Permission to publish Olera's clinical-experience posting on the campus job board.",
  tooltip: "When granted, a 'Post to job board' task is queued (one per campus, deduped if multiple grant).",
};

function permissionKindsFor(
  type: StakeholderType,
  status: Status,
): PermissionKind[] {
  // v8.10.4: at research stages (prospect / researched), only show
  // permissions that GATE the research flow itself. Job-board permission
  // is only meaningful once they're an active partner, so hide it from
  // research drawers entirely. Email-professors permission for dept_head
  // stays — it gates the Bulk Professor Import flow during research.
  const isResearch = status === "prospect" || status === "researched";
  if (type === "dept_head") {
    return isResearch ? [PROFESSOR_PERMISSION] : [PROFESSOR_PERMISSION, JOB_BOARD_PERMISSION];
  }
  if (type === "advisor") {
    return isResearch ? [] : [JOB_BOARD_PERMISSION];
  }
  return [];
}

const ALL_PERMISSION_KINDS = [PROFESSOR_PERMISSION, JOB_BOARD_PERMISSION];

function ApprovalsSection({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const [showOther, setShowOther] = useState(false);
  const [showBulkProf, setShowBulkProf] = useState(false);

  const kinds = permissionKindsFor(ctx.outreach.stakeholder_type, ctx.outreach.status);

  // Look up each permission's current status from approvals.
  const findApproval = (approval_for: string) =>
    ctx.approvals.find((a) => a.approval_for === approval_for) ?? null;

  // Other approvals (non-checklist, e.g. "Other" generics or legacy
  // listserv/distribute approvals from before v8.7's simplification).
  const knownStrings: Set<string> = new Set(ALL_PERMISSION_KINDS.map((p) => p.approval_for));
  const otherApprovals = ctx.approvals.filter((a) => !knownStrings.has(a.approval_for));

  if (kinds.length === 0) return null;

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500" title="Permissions you can ask this stakeholder for. Track which is granted.">
        Permissions
      </h3>
      <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
        {kinds.map((p) => {
          const approval = findApproval(p.approval_for);
          return (
            <PermissionRow
              key={p.key}
              kind={p}
              approval={approval}
              action={action}
              setError={setError}
              onGranted={() => {
                if (p.key === "email_professors") setShowBulkProf(true);
              }}
            />
          );
        })}

        {otherApprovals.length > 0 && (
          <div className="mt-2 border-t border-gray-100 pt-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Other</p>
            {otherApprovals.map((a) => (
              <ApprovalRow key={a.id} approval={a} action={action} setError={setError} resolved={a.status !== "requested"} />
            ))}
          </div>
        )}

        <div className="border-t border-gray-100 pt-2">
          <button
            onClick={() => setShowOther((s) => !s)}
            className="text-xs text-gray-500 hover:text-gray-700"
            title="Need to ask for something not on the checklist? Use this."
          >
            {showOther ? "Hide" : "+ Other approval"}
          </button>
          {showOther && (
            <div className="mt-2">
              <RequestApprovalModalInline
                action={action}
                setError={setError}
                onClose={() => setShowOther(false)}
              />
            </div>
          )}
        </div>
      </div>

      {showBulkProf && (
        <BulkProfImportPrompt
          ctx={ctx}
          onClose={() => setShowBulkProf(false)}
        />
      )}
    </section>
  );
}

/**
 * One row in the permissions checklist. Maps the abstract permission to
 * either: a not-yet-asked CTA, an in-flight approval (with grant/deny),
 * or a resolved row.
 */
function PermissionRow({
  kind,
  approval,
  action,
  setError,
  onGranted,
}: {
  kind: PermissionKind;
  approval: Approval | null;
  action: ActionFn;
  setError: (e: string | null) => void;
  onGranted: () => void;
}) {
  const [askInFlight, setAskInFlight] = useState(false);
  const stateLabel = !approval
    ? "Not asked yet"
    : approval.status === "requested"
    ? `Asked${approval.requested_at ? ` ${formatRelative(approval.requested_at)}` : ""}`
    : approval.status === "granted"
    ? "✓ Granted"
    : approval.status === "denied"
    ? "Denied"
    : "Expired";

  const tone = approval?.status === "granted"
    ? "border-emerald-200 bg-emerald-50/40"
    : approval?.status === "requested"
    ? "border-amber-200 bg-amber-50/40"
    : "border-gray-200";

  const ask = async () => {
    setAskInFlight(true);
    try {
      await action("request_approval", {
        approval_type: kind.approval_type,
        approval_for: kind.approval_for,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setAskInFlight(false);
    }
  };

  const resolve = async (resolution: ApprovalStatus) => {
    if (!approval) return;
    try {
      await action("resolve_approval", { approval_id: approval.id, resolution });
      if (resolution === "granted") onGranted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resolve failed");
    }
  };

  return (
    <div className={`rounded-md border px-3 py-2 ${tone}`} title={kind.tooltip}>
      <p className="text-sm font-medium text-gray-900">{kind.title}</p>
      <p className="mt-0.5 text-xs text-gray-600">{kind.blurb}</p>
      <p className="mt-0.5 text-[11px] text-gray-500">Status: {stateLabel}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {!approval && (
          <button
            onClick={ask}
            disabled={askInFlight}
            title="Send the ask externally, then click here to track that you asked."
            className="rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            Mark as asked
          </button>
        )}
        {approval?.status === "requested" && (
          <>
            <button
              onClick={() => resolve("granted")}
              title="They said yes. Records it and (for 'Email professors') opens the bulk import."
              className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Granted
            </button>
            <button
              onClick={() => resolve("denied")}
              title="They said no."
              className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              Denied
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * After "Email professors directly" is granted, prompt admin to bulk-import
 * professors right away with simple guidance.
 */
function BulkProfImportPrompt({
  ctx,
  onClose,
}: {
  ctx: DrawerContext;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <header className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">🎉 Permission granted!</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Now let's add the professors so we can email them.
          </p>
        </header>
        <div className="space-y-2 px-6 py-4 text-sm text-gray-700">
          <p><strong>Quick steps:</strong></p>
          <ol className="ml-5 list-decimal space-y-1 text-xs">
            <li>Open the <strong>{ctx.outreach.organization_name}</strong> faculty page on the university website.</li>
            <li>Find the most relevant professors (target: faculty teaching pre-health-aligned courses).</li>
            <li>Copy each professor's name + email into the bulk import form on the next screen.</li>
            <li>Stuck finding emails? Ask your supervisor — they can help locate them.</li>
          </ol>
          <p className="mt-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-900">
            💡 Open the Campus page to use Bulk Professor Import. The "Email professors" permission you just granted makes the import enabled.
          </p>
        </div>
        <footer className="flex justify-end border-t border-gray-100 bg-gray-50 px-6 py-3">
          <a
            href={`/admin/student-outreach/campus/${ctx.campus.slug}`}
            onClick={onClose}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
          >
            Open Campus page →
          </a>
          <button onClick={onClose} className="ml-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Later
          </button>
        </footer>
      </div>
    </div>
  );
}

/** Inline lightweight "Other approval" form (collapses RequestApprovalModal contents). */
function RequestApprovalModalInline({
  action,
  setError,
  onClose,
}: {
  action: ActionFn;
  setError: (e: string | null) => void;
  onClose: () => void;
}) {
  const [approvalFor, setApprovalFor] = useState("");
  const submit = async () => {
    if (!approvalFor.trim()) return setError("Add a description");
    try {
      await action("request_approval", { approval_type: "other", approval_for: approvalFor.trim() });
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Request failed"); }
  };
  return (
    <div className="space-y-2 rounded-md border border-dashed border-gray-300 p-2">
      <input
        value={approvalFor}
        onChange={(e) => setApprovalFor(e.target.value)}
        placeholder="What approval do you need?"
        className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs"
      />
      <div className="flex gap-2">
        <button onClick={submit} className="rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white">Track this</button>
        <button onClick={onClose} className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700">Cancel</button>
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

function ApprovalRow({
  approval,
  action,
  setError,
  resolved,
}: {
  approval: Approval;
  action: ActionFn;
  setError: (e: string | null) => void;
  resolved?: boolean;
}) {
  const [notes, setNotes] = useState("");
  const resolve = async (resolution: ApprovalStatus) => {
    try {
      await action("resolve_approval", { approval_id: approval.id, resolution, notes });
    } catch (e) { setError(e instanceof Error ? e.message : "Resolve failed"); }
  };
  return (
    <div className={`rounded-md border border-gray-100 px-3 py-2 ${resolved ? "bg-gray-50" : "bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">
            {approval.approval_for}
            <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-600">
              {approval.approval_type}
            </span>
            <span className="ml-2 text-xs text-gray-500">{approval.status}</span>
          </p>
          {approval.approval_from && (
            <p className="mt-0.5 text-xs text-gray-500">From: {approval.approval_from}</p>
          )}
          <p className="mt-0.5 text-[11px] text-gray-400">
            Requested {new Date(approval.requested_at).toLocaleDateString()}
            {approval.resolved_at && ` · Resolved ${new Date(approval.resolved_at).toLocaleDateString()}`}
          </p>
        </div>
      </div>
      {!resolved && (
        <div className="mt-2 space-y-2">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Resolution notes (optional)"
            className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <PrimaryButton onClick={() => resolve("granted")}>Granted</PrimaryButton>
            <SecondaryButton onClick={() => resolve("denied")}>Denied</SecondaryButton>
            <SecondaryButton onClick={() => resolve("expired")}>Expired</SecondaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ── History (with narration) ───────────────────────────────────────────

function HistorySection({ ctx }: { ctx: DrawerContext }) {
  const adminFirstNames = useMemo(
    () => new Map(Object.entries(ctx.admin_first_names ?? {})),
    [ctx.admin_first_names],
  );
  const contactsById = useMemo(
    () => new Map(ctx.contacts.map((c) => [c.id, c])),
    [ctx.contacts],
  );

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        History
      </h3>
      {ctx.touchpoints.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
          No touchpoints yet.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {ctx.touchpoints.map((t) => {
            const n = narrateTouchpoint(t, { adminFirstNames, contactsById });
            return (
              <li key={t.id} className="rounded-md border border-gray-100 bg-white px-3 py-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-gray-700">{n.text}</span>
                  <span className="shrink-0 whitespace-nowrap text-xs text-gray-400">
                    {n.admin && <span className="mr-2 text-gray-500">{n.admin}</span>}
                    {relativeTime(n.whenIso)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 14) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ── Danger zone ────────────────────────────────────────────────────────

function DangerZone({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const status = ctx.outreach.status;
  const terminals: Status[] = ["not_interested", "do_not_contact", "wrong_contact", "redirected", "no_response_closed"];
  if (terminals.includes(status)) return null;

  const confirm = (msg: string, fn: () => Promise<unknown>) => {
    if (window.confirm(msg)) fn().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  };

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Close out
      </h3>
      <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <SecondaryButton onClick={() => confirm("Mark Not Interested?", () => action("mark_not_interested"))}>
          Not interested
        </SecondaryButton>
        <SecondaryButton onClick={() => confirm("Close as No Response (re-open in 90d)?", () => action("mark_no_response_closed"))}>
          Close: no response
        </SecondaryButton>
        <SecondaryButton onClick={() => confirm("Mark all known contacts wrong / unreachable?", () => action("mark_wrong_contact"))}>
          Wrong contact
        </SecondaryButton>
        <DangerButton onClick={() => confirm("Mark Do Not Contact (hard stop)?", () => action("mark_dnc"))}>
          DNC (hard stop)
        </DangerButton>
      </div>
    </section>
  );
}

// v8.10.11: TabContextBanner removed. Section h3 + per-state guidance
// already convey orientation; the banner repeated the same information
// one row above. ResearchModePanel and NextStepPanel are the single
// source of "what's next" for their respective stages.

function FollowupNotesModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: (notes: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <header className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Needs follow-up — back to Replies</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Capture what was discussed so the team can run the follow-up email. The note shows on
            the row in Replies.
          </p>
        </header>
        <div className="px-6 py-4 space-y-2">
          {err && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">Meeting outcome notes *</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="e.g. Met with dean. Open to listserv access but needs to consult marketing first. Following up next week."
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
          </label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (!notes.trim()) return setErr("Add some notes so the team has context.");
              setSubmitting(true);
              setErr(null);
              try {
                await onConfirm(notes.trim());
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Save failed");
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Send back to Replies"}
          </button>
        </footer>
      </div>
    </div>
  );
}

// ── UI primitives ──────────────────────────────────────────────────────

function Guidance({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-700 leading-relaxed">{children}</p>;
}

function ChecklistInline({ items }: { items: Array<{ done: boolean; label: string }> }) {
  return (
    <ul className="space-y-0.5">
      {items.map((i, idx) => (
        <li key={idx} className={`flex items-center gap-2 text-xs ${i.done ? "text-emerald-700" : "text-gray-500"}`}>
          <span aria-hidden>{i.done ? "✓" : "○"}</span>
          <span>{i.label}</span>
        </li>
      ))}
    </ul>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => unknown; disabled?: boolean }) {
  return (
    <button
      onClick={() => void onClick()}
      disabled={disabled}
      className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => unknown; disabled?: boolean }) {
  return (
    <button
      onClick={() => void onClick()}
      disabled={disabled}
      className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function DangerButton({ children, onClick }: { children: React.ReactNode; onClick: () => unknown }) {
  return (
    <button
      onClick={() => void onClick()}
      className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
    >
      {children}
    </button>
  );
}

function SmallButton({ children, onClick }: { children: React.ReactNode; onClick: () => unknown }) {
  return (
    <button
      onClick={() => void onClick()}
      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

function Field({
  label, value, onChange, onBlur, placeholder, type = "text", multiline,
}: {
  label: string; value: string; onChange: (v: string) => void; onBlur?: () => void;
  placeholder?: string; type?: string; multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
        />
      )}
    </label>
  );
}

function Select({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
      >
        <option value="">— select —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function MultiToggle({
  label, values, options, onToggle,
}: {
  label: string;
  values: string[];
  options: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = values.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                active
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
