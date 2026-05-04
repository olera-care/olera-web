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
import { RequestApprovalModal } from "./RequestApprovalModal";
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
          <StageGuidance
            ctx={ctx}
            onSchedulePreFlight={() => setShowPreFlight(true)}
            onLogCall={() => setShowCallScript(true)}
            onScheduleMeeting={() => setShowMeetingForm(true)}
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
    </section>
  );
}

// ── Stage guidance (the per-stage text + primary CTA) ──────────────────

function StageGuidance({
  ctx,
  onSchedulePreFlight,
  onLogCall,
  onScheduleMeeting,
  action,
  setError,
}: {
  ctx: DrawerContext;
  onSchedulePreFlight: () => void;
  onLogCall: () => void;
  onScheduleMeeting: () => void;
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

  if (status === "engaged") {
    return (
      <>
        <Guidance>
          You're in dialogue. Keep the conversation moving toward a commitment to share with students.
          Schedule a meeting if it'll help close.
        </Guidance>
        <PrimaryButton onClick={onScheduleMeeting}>Schedule meeting</PrimaryButton>
        {supportsPhoneOutreach(type) && (
          <SecondaryButton onClick={onLogCall}>Log call</SecondaryButton>
        )}
      </>
    );
  }

  if (status === "meeting_scheduled") {
    return (
      <>
        <Guidance>
          Meeting on the calendar. Once it happens, log the outcome and decide next steps. If they
          agreed to share, the green button below graduates them to Active Partner.
        </Guidance>
        <PrimaryButton onClick={() => handleErr(action("log_meeting_held"))}>
          Meeting held
        </PrimaryButton>
        <SecondaryButton onClick={() => handleErr(action("log_meeting_no_show"))}>
          No-show
        </SecondaryButton>
        <SecondaryButton onClick={onScheduleMeeting}>Reschedule</SecondaryButton>
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

function ApprovalsSection({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const [showRequest, setShowRequest] = useState(false);
  const open = ctx.approvals.filter((a) => a.status === "requested");
  const resolved = ctx.approvals.filter((a) => a.status !== "requested");

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Approvals ({open.length} pending)
        </h3>
        <SmallButton onClick={() => setShowRequest(true)}>+ Request approval</SmallButton>
      </div>
      <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
        {open.length === 0 && resolved.length === 0 && (
          <p className="text-sm text-gray-400">No approvals.</p>
        )}
        {open.map((a) => (
          <ApprovalRow key={a.id} approval={a} action={action} setError={setError} />
        ))}
        {resolved.map((a) => (
          <ApprovalRow key={a.id} approval={a} action={action} setError={setError} resolved />
        ))}
        {open.some((a) => a.status === "requested") && (
          <p className="text-[11px] text-gray-500 italic mt-1">
            Tip: Once dept approval is granted, use Bulk Professor Import on the Campus page to
            create professor rows under this dept.
          </p>
        )}
      </div>
      {showRequest && (
        <RequestApprovalModal
          onCancel={() => setShowRequest(false)}
          onSubmit={async (payload) => {
            try {
              await action("request_approval", payload);
              setShowRequest(false);
            } catch (e) { setError(e instanceof Error ? e.message : "Request failed"); }
          }}
        />
      )}
    </section>
  );
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
