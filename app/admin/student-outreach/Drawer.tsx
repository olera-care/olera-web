"use client";

/**
 * Student Outreach Drawer — v2.
 *
 * Core principle: at every moment the admin should know exactly what
 * to do next. The "Next Step" panel at the top is the single source of
 * truth — primary CTA + cadence checklist + the always-visible
 * "Mark as Active Partner" graduation button (from `engaged` onward).
 *
 * Sections are also stakeholder-type-aware: orgs see multi-officer +
 * IG/contact-form actions, advisors see a single contact and no
 * approvals, dept heads see approvals + the bulk-import nudge,
 * professors get the minimal flow.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { MarkPartnerModal } from "./MarkPartnerModal";
import { OfferCallModal } from "./OfferCallModal";
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
import { callScript } from "@/lib/student-outreach/templates";
import { CADENCE_END_DAY, OUTREACH_DAYS_BY_TYPE } from "@/lib/student-outreach/cadence";
import {
  DEPARTMENTS,
  OTHER,
  PROGRAMS,
  ROLES_BY_TYPE,
  singleProgram,
  supportsAltChannels,
  supportsApprovals,
  supportsMultipleContacts,
  supportsPhoneOutreach,
} from "@/lib/student-outreach/presets";
import { narrateTouchpoint } from "@/lib/student-outreach/narration";

interface DrawerProps {
  outreachId: string;
  onClose: () => void;
  onAction: (refreshed: DrawerContext | null) => void;
}

type ActionFn = (action: string, payload?: Record<string, unknown>) => Promise<DrawerContext>;

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
          {ctx ? (
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-gray-900">
                {ctx.outreach.organization_name}
              </h2>
              <p className="truncate text-sm text-gray-500">
                {ctx.campus.name} · {STAKEHOLDER_TYPE_LABELS[ctx.outreach.stakeholder_type]}
                {ctx.outreach.department && ` · ${ctx.outreach.department}`}
                {" · "}
                <span className="font-medium text-gray-700">
                  {STATUS_LABELS[ctx.outreach.status]}
                </span>
              </p>
            </div>
          ) : (
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
            <div className="space-y-6">
              <RelationshipBanner ctx={ctx} />
              <NextStepPanel ctx={ctx} action={action} setError={setError} />
              <ResearchSection ctx={ctx} action={action} setError={setError} />
              <ContactsSection ctx={ctx} action={action} setError={setError} />
              {supportsApprovals(ctx.outreach.stakeholder_type) && (
                <ApprovalsSection ctx={ctx} action={action} setError={setError} />
              )}
              <HistorySection ctx={ctx} />
              <DangerZone ctx={ctx} action={action} setError={setError} />
            </div>
          ) : null}
        </div>
      </aside>
    </>
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

// ── Next Step panel — the star ─────────────────────────────────────────

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
  const [showCallScript, setShowCallScript] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showOfferCall, setShowOfferCall] = useState(false);

  const primary = ctx.contacts.find((c) => c.status === "active") ?? ctx.contacts[0] ?? null;
  const partnerCtaVisible = PARTNER_CTA_STAGES.includes(status);

  const baseCtx = {
    stakeholder_type: type,
    organization_name: ctx.outreach.organization_name,
    campus_name: ctx.campus.name,
  };
  const callDraft = callScript(baseCtx, ctx.outreach.cadence_day);

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Next step
      </h3>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* Stage progress strip */}
        <div className="border-b border-gray-100 px-4 py-2.5 bg-gray-50/50">
          <p className="text-xs font-medium text-gray-700">
            Stage: <span className="text-gray-900">{STATUS_LABELS[status]}</span>
            {status === "outreach_sent" && (
              <span className="ml-1.5 text-gray-500">
                · Day {ctx.outreach.cadence_day} of {CADENCE_END_DAY}
              </span>
            )}
            {status === "meeting_scheduled" && ctx.outreach.research_data.meeting_at && (
              <span className="ml-1.5 text-gray-500">
                · {new Date(ctx.outreach.research_data.meeting_at).toLocaleString()}
              </span>
            )}
          </p>
        </div>

        {/* Stage-specific guidance + primary CTA */}
        <div className="space-y-3 px-4 py-4">
          <ManualFollowupBanner ctx={ctx} action={action} setError={setError} />
          <StageGuidance
            ctx={ctx}
            onSchedulePreFlight={() => setShowPreFlight(true)}
            onLogCall={() => setShowCallScript(true)}
            onScheduleMeeting={() => setShowMeetingForm(true)}
            onOfferCall={() => setShowOfferCall(true)}
            action={action}
            setError={setError}
          />

          {/* Inline call panel */}
          {showCallScript && (
            <CallLogPanel
              script={callDraft.script}
              primaryContactId={primary?.id ?? null}
              action={action}
              setError={setError}
              onClose={() => setShowCallScript(false)}
            />
          )}

          {/* Inline meeting form */}
          {showMeetingForm && (
            <MeetingForm
              action={action}
              setError={setError}
              onClose={() => setShowMeetingForm(false)}
            />
          )}
        </div>

        {/* Always-visible Mark-as-Partner graduation */}
        {partnerCtaVisible && (
          <div className="border-t border-gray-100 bg-emerald-50/30 px-4 py-3">
            <button
              onClick={() => setShowPartner(true)}
              className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Mark as Active Partner ★
            </button>
            <p className="mt-1.5 text-center text-[11px] text-emerald-900/80">
              Click when you're confident they've committed to (or are) distributing.
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
      {showOfferCall && (
        <OfferCallModal
          organizationName={ctx.outreach.organization_name}
          contactFirstName={primary?.name?.split(" ")[0]}
          onCancel={() => setShowOfferCall(false)}
          onConfirm={async () => {
            try {
              await action("offer_call");
              setShowOfferCall(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
            }
          }}
        />
      )}
    </section>
  );
}

// ── Stage guidance (the per-stage text + primary CTA) ──────────────────

function StageGuidance({
  ctx,
  onSchedulePreFlight,
  onLogCall,
  onScheduleMeeting,
  onOfferCall,
  action,
  setError,
}: {
  ctx: DrawerContext;
  onSchedulePreFlight: () => void;
  onLogCall: () => void;
  onScheduleMeeting: () => void;
  onOfferCall: () => void;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const status = ctx.outreach.status;
  const type = ctx.outreach.stakeholder_type;
  const primary = ctx.contacts.find((c) => c.status === "active") ?? ctx.contacts[0];
  const handleErr = (p: Promise<unknown>) => p.catch((e) => setError(e instanceof Error ? e.message : "Action failed"));

  if (status === "prospect") {
    const haveContact = ctx.contacts.some((c) => c.status === "active");
    const havePrograms = ctx.outreach.programs.length > 0;
    const haveDept = type === "dept_head" ? Boolean(ctx.outreach.department) : true;
    const ready = haveContact && havePrograms && haveDept;
    return (
      <>
        <Guidance>
          <strong>You're in research.</strong> Fill in the basics below, add at least one contact, then
          tap <em>Research complete</em>. You'll review the email sequence next, then schedule it.
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
              ready ? "bg-gray-900 hover:bg-gray-700" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {ready ? "✓ Research complete — review sequence →" : "Add a contact + programs to continue"}
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
          <strong>Ready to schedule outreach.</strong> Click below to review and edit the {OUTREACH_DAYS_BY_TYPE[type].length}-email
          sequence, then schedule. Day 0 sends immediately; later days fire automatically.
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
            {ready ? "Schedule outreach sequence →" : "Add a contact with email to continue"}
          </button>
        </div>
      </>
    );
  }

  if (status === "outreach_sent") {
    return <OutreachStepList ctx={ctx} action={action} setError={setError} />;
  }

  if (status === "engaged" || status === "meeting_scheduled") {
    return (
      <>
        <Guidance>
          They replied — pick what to do next based on what they said. Two clear options:
        </Guidance>
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={onOfferCall}
            title="Send Logan's Calendly link so they can book a 15-min chat. Use this when they want to talk."
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            📞 Offer a 15-min call (Logan's Calendly)
          </button>
          <p className="text-center text-[11px] text-gray-500">
            Use the green "Mark as Active Partner" button below when they've committed to sharing with students.
          </p>
        </div>
        {supportsPhoneOutreach(type) && (
          <div className="pt-2">
            <SecondaryButton onClick={onLogCall}>Log a phone call (no Calendly)</SecondaryButton>
          </div>
        )}
      </>
    );
  }

  if (status === "active_partner") {
    const seasonal = ctx.pending_tasks.find((t) => t.task_type === "outreach_email_send");
    return (
      <>
        <Guidance>
          {seasonal
            ? `Active Partner. Next seasonal email auto-sends ${new Date(seasonal.due_at).toLocaleDateString()}.`
            : "Active Partner. Maintain the relationship — seasonal emails are auto-queued."}
        </Guidance>
        <p className="text-xs text-gray-500">
          Seasonal sends run automatically on Aug 1, Nov 15, Jan 15, and Apr 15.
        </p>
      </>
    );
  }

  if (status === "no_response_closed" || status === "wrong_contact") {
    return (
      <>
        <Guidance>
          {status === "no_response_closed"
            ? `Closed — no response. ${ctx.outreach.reopen_at ? `Auto-reopens ${ctx.outreach.reopen_at}.` : ""}`
            : "Closed — wrong contact. Add a new contact and re-open if you find someone reachable."}
        </Guidance>
        <PrimaryButton onClick={() => handleErr(action("reopen"))}>Re-open now</PrimaryButton>
      </>
    );
  }

  if (status === "not_interested" || status === "do_not_contact" || status === "redirected") {
    return (
      <Guidance>
        {STATUS_LABELS[status]}. No further outreach. Use the campus view to find related
        stakeholders or add a new one.
      </Guidance>
    );
  }

  return <Guidance>No actions available in this stage.</Guidance>;
}

// ── Manual-followup banner ─────────────────────────────────────────────

/**
 * If this row has a pending manual_followup task, show a banner at the
 * top of the Next Step panel that explains WHY it's queued and what
 * the admin should do. Without this banner, manual_followup tasks
 * surface as "Manual follow-up" with no context.
 */
function ManualFollowupBanner({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const task = ctx.pending_tasks.find((t) => t.task_type === "manual_followup");
  if (!task) return null;
  const reason = String((task.payload as Record<string, unknown>)?.reason ?? "");
  const meta = followupMetaFor(reason);
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3">
      <p className="text-sm font-medium text-amber-900">{meta.title}</p>
      <p className="mt-1 text-xs text-amber-800">{meta.body}</p>
      <div className="mt-2">
        <button
          onClick={() => action("complete_task", { task_id: task.id }).catch((e) => setError(e instanceof Error ? e.message : "Failed"))}
          className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-50"
        >
          Mark this follow-up done
        </button>
      </div>
    </div>
  );
}

function followupMetaFor(reason: string): { title: string; body: string } {
  switch (reason) {
    case "continue_dialogue":
      return {
        title: "💬 Continue the dialogue",
        body: "You marked this stakeholder engaged. Reply to their last email externally, schedule a meeting, or escalate. When you've responded, mark this follow-up done.",
      };
    case "cadence_ended_cold":
      return {
        title: "📭 Outreach cadence ended — no reply",
        body: "All scheduled emails fired with no reply. Decide: send a custom re-engage email, close as no-response (auto-reopens in 90 days), or close as not interested.",
      };
    case "no_recipients_at_send_time":
      return {
        title: "⚠ Couldn't send — all contacts stale",
        body: "The next scheduled email had no active recipients. Add a fresh contact in the Contacts section below, or close this row as wrong-contact.",
      };
    case "all_recipients_failed":
      return {
        title: "❌ All recipients failed",
        body: "Resend errored on every recipient for the most recent send. Check the email addresses for typos, retry by editing the upcoming send, or escalate.",
      };
    default:
      return {
        title: "✋ Manual follow-up needed",
        body: "Take a look at the row's history below to decide next steps.",
      };
  }
}

// ── Inline panels (call, meeting) ──────────────────────────────────────

function CallLogPanel({
  script,
  primaryContactId,
  action,
  setError,
  onClose,
}: {
  script: string;
  primaryContactId: string | null;
  action: ActionFn;
  setError: (e: string | null) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const log = async (disposition: string) => {
    try {
      await action("log_call", { disposition, contact_id: primaryContactId, notes });
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Log failed"); }
  };
  return (
    <div className="rounded-md border border-gray-100 bg-white p-3 text-sm">
      <pre className="mb-3 whitespace-pre-wrap text-xs text-gray-700">{script}</pre>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="mb-2 w-full rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
        rows={2}
      />
      <div className="flex flex-wrap gap-2">
        <SecondaryButton onClick={() => log("no_answer")}>No answer</SecondaryButton>
        <SecondaryButton onClick={() => log("voicemail")}>Voicemail</SecondaryButton>
        <PrimaryButton onClick={() => log("connected")}>Connected</PrimaryButton>
        <DangerButton onClick={() => log("wrong_number")}>Wrong number</DangerButton>
      </div>
    </div>
  );
}

function MeetingForm({
  action,
  setError,
  onClose,
}: {
  action: ActionFn;
  setError: (e: string | null) => void;
  onClose: () => void;
}) {
  const [meetingAt, setMeetingAt] = useState("");
  const [kind, setKind] = useState("video");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <div className="space-y-2 rounded-md border border-gray-100 bg-white p-3">
      <Field type="datetime-local" label="Meeting at" value={meetingAt} onChange={setMeetingAt} />
      <Select label="Kind" value={kind} onChange={setKind} options={[
        { value: "phone", label: "Phone" },
        { value: "video", label: "Video" },
        { value: "in_person", label: "In Person" },
      ]} />
      <Field label="Link / location" value={link} onChange={setLink} placeholder="https://meet.example.com/..." />
      <Field label="Notes" value={notes} onChange={setNotes} />
      <div className="flex gap-2 pt-1">
        <PrimaryButton onClick={async () => {
          if (!meetingAt) { setError("Meeting time required"); return; }
          try {
            await action("mark_meeting_scheduled", {
              meeting_at: new Date(meetingAt).toISOString(),
              meeting_kind: kind,
              meeting_link: link,
              notes,
            });
            onClose();
          } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
        }}>Save meeting</PrimaryButton>
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
      </div>
    </div>
  );
}

// ── Research section ───────────────────────────────────────────────────

function ResearchSection({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const r = ctx.outreach.research_data;
  const type = ctx.outreach.stakeholder_type;
  const [website, setWebsite] = useState(r.website ?? "");
  const [officialEmail, setOfficialEmail] = useState(r.official_email ?? "");
  const [phone, setPhone] = useState(r.phone ?? "");
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

  const saveResearch = async () => {
    try {
      await action("update_research", {
        research: {
          website,
          official_email: officialEmail,
          phone,
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

  const showDepartment = type === "dept_head" || type === "professor";

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Research
      </h3>
      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <Field label="Organization name" value={orgName} onChange={setOrgName} onBlur={saveOutreach} />

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

        <Field label="Website" value={website} onChange={setWebsite} onBlur={saveResearch} placeholder="https://..." />
        <Field label="Official email" value={officialEmail} onChange={setOfficialEmail} onBlur={saveResearch} placeholder="advising@..." />
        <Field label="Phone" value={phone} onChange={setPhone} onBlur={saveResearch} />
        <Field label="Research notes" value={notes} onChange={setNotes} onBlur={saveResearch} multiline />
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
            {contact.name}
            {contact.role && <span className="ml-2 text-gray-500">{contact.role}</span>}
            {stale && <span className="ml-2 text-xs text-gray-400">[{contact.status}]</span>}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {[contact.email, contact.phone, contact.instagram].filter(Boolean).join(" · ") || "—"}
          </p>
          {contact.contact_form_url && (
            <a href={contact.contact_form_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
              Open contact form ↗
            </a>
          )}
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
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [roleOther, setRoleOther] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  return (
    <div className="space-y-2 rounded-md border border-dashed border-gray-200 p-3">
      <Field label="Name *" value={name} onChange={setName} />
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
      {supportsAltChannels(type) && (
        <Field label="Instagram" value={instagram} onChange={setInstagram} placeholder="@handle" />
      )}
      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
        Primary contact
      </label>
      <PrimaryButton onClick={async () => {
        if (!name.trim()) { setError("Name required"); return; }
        try {
          await action("add_contact", {
            name,
            role: role === OTHER ? roleOther : role,
            email,
            phone,
            instagram,
            is_primary: isPrimary,
          });
          onSaved();
        } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
      }}>Add contact</PrimaryButton>
    </div>
  );
}

// ── Approvals (dept_head only) ─────────────────────────────────────────

// Permission-checklist labels — these strings double as approval_for keys
// so we can recognize granted-rows by string match.
const PERMISSION_KINDS = [
  {
    key: "email_professors",
    approval_for: "Email professors directly",
    approval_type: "department" as const,
    title: "Email professors directly",
    blurb: "Get permission to email faculty in this department.",
    tooltip: "When granted, you'll be able to bulk-import professors and start emailing them.",
  },
  {
    key: "listserv",
    approval_for: "Access department listserv",
    approval_type: "listserv" as const,
    title: "Access dept listserv",
    blurb: "Send Olera info to the whole department's student listserv.",
    tooltip: "If granted, dept emails students on our behalf via their listserv.",
  },
  {
    key: "distribute",
    approval_for: "Dept head distributes for us",
    approval_type: "department" as const,
    title: "They distribute for us",
    blurb: "The dept head forwards our flyer to faculty / students themselves.",
    tooltip: "The dept head agrees to share our materials directly. Often a fast path to Active Partner.",
  },
] as const;

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

  // Look up each permission's current status from approvals.
  const findApproval = (approval_for: string) =>
    ctx.approvals.find((a) => a.approval_for === approval_for) ?? null;

  // Other approvals (non-checklist, e.g. "Other" generics).
  const knownStrings: Set<string> = new Set(PERMISSION_KINDS.map((p) => p.approval_for));
  const otherApprovals = ctx.approvals.filter((a) => !knownStrings.has(a.approval_for));

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500" title="Permissions you can ask this dept head for. Track which path is granted.">
        Permissions
      </h3>
      <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
        {PERMISSION_KINDS.map((p) => {
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
  kind: typeof PERMISSION_KINDS[number];
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
