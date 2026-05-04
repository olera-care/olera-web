"use client";

/**
 * Student Outreach Drawer.
 *
 * Sections (top to bottom):
 *   - Stage panel    — actions appropriate for the current stage
 *   - Research       — editable research_data fields
 *   - Contacts       — list + add/edit/mark-stale
 *   - Approvals      — open approvals + request/resolve
 *   - Tasks          — pending queue + complete/cancel/reschedule
 *   - History        — append-only touchpoints
 *   - Danger zone    — DNC / Wrong / Close / Redirect
 *
 * Every action POSTs to /[id] and re-renders from the returned context.
 */

import { useCallback, useEffect, useState } from "react";
import { EmailComposerModal } from "./EmailComposerModal";
import { RequestApprovalModal } from "./RequestApprovalModal";
import {
  STAKEHOLDER_TYPE_LABELS,
  STATUS_LABELS,
  type Approval,
  type ApprovalStatus,
  type Contact,
  type DistributionEvidence,
  type DrawerContext,
  type ResearchData,
  type StakeholderType,
  type Status,
  type Task,
  type TaskType,
  type Touchpoint,
} from "@/lib/student-outreach/types";
import {
  callScript,
  followupEmail,
  introEmail,
  postAgreedShareEmail,
  partnerSeasonalEmail,
  type EmailDraft,
} from "@/lib/student-outreach/templates";

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
    return () => {
      cancelled = true;
    };
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
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-label="Close drawer"
      />
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
              <StagePanel ctx={ctx} action={action} setError={setError} />
              <ResearchSection ctx={ctx} action={action} setError={setError} />
              <ContactsSection ctx={ctx} action={action} setError={setError} />
              <ApprovalsSection ctx={ctx} action={action} setError={setError} />
              <TasksSection ctx={ctx} action={action} setError={setError} />
              <HistorySection touchpoints={ctx.touchpoints} contacts={ctx.contacts} />
              <DangerZone ctx={ctx} action={action} setError={setError} />
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}

// ── Relationship banner (referred/redirected/permission-dep) ───────────

function RelationshipBanner({ ctx }: { ctx: DrawerContext }) {
  const items: string[] = [];
  if (ctx.referred_from)
    items.push(`Referred from ${ctx.referred_from.organization_name}`);
  if (ctx.redirected_to)
    items.push(`Redirected to ${ctx.redirected_to.organization_name}`);
  if (ctx.permission_dependency)
    items.push(
      `Permission via ${ctx.permission_dependency.organization_name} (${STATUS_LABELS[ctx.permission_dependency.status]})`,
    );
  if (ctx.outreach.snoozed_until && new Date(ctx.outreach.snoozed_until) > new Date())
    items.push(
      `Snoozed until ${new Date(ctx.outreach.snoozed_until).toLocaleDateString()}`,
    );
  if (items.length === 0) return null;
  return (
    <div className="rounded-md bg-amber-50/60 px-3 py-2 text-xs text-amber-900">
      {items.join(" · ")}
    </div>
  );
}

// ── Stage panel (the do-next-thing buttons) ────────────────────────────

function StagePanel({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const status = ctx.outreach.status;
  const [showCompose, setShowCompose] = useState(false);
  const [showCallScript, setShowCallScript] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showDistribForm, setShowDistribForm] = useState(false);

  const primary = ctx.contacts.find((c) => c.status === "active") ?? ctx.contacts[0];

  const introDraft: EmailDraft = introEmail({
    stakeholder_type: ctx.outreach.stakeholder_type,
    organization_name: ctx.outreach.organization_name,
    contact_first_name: primary?.name?.split(" ")[0],
    campus_name: ctx.campus.name,
  });
  const followDraft: EmailDraft = followupEmail(
    {
      stakeholder_type: ctx.outreach.stakeholder_type,
      organization_name: ctx.outreach.organization_name,
      contact_first_name: primary?.name?.split(" ")[0],
      campus_name: ctx.campus.name,
    },
    ctx.outreach.cadence_day,
  );
  const shareDraft: EmailDraft = postAgreedShareEmail({
    stakeholder_type: ctx.outreach.stakeholder_type,
    organization_name: ctx.outreach.organization_name,
    contact_first_name: primary?.name?.split(" ")[0],
    campus_name: ctx.campus.name,
  });
  const seasonalDraft: EmailDraft = partnerSeasonalEmail(
    {
      stakeholder_type: ctx.outreach.stakeholder_type,
      organization_name: ctx.outreach.organization_name,
      contact_first_name: primary?.name?.split(" ")[0],
      campus_name: ctx.campus.name,
    },
    "Pre-Fall",
  );

  const callDraft = callScript(
    {
      stakeholder_type: ctx.outreach.stakeholder_type,
      organization_name: ctx.outreach.organization_name,
      contact_first_name: primary?.name?.split(" ")[0],
      campus_name: ctx.campus.name,
    },
    ctx.outreach.cadence_day,
  );

  const [composerDraft, setComposerDraft] = useState<EmailDraft>(introDraft);
  const [composerKind, setComposerKind] = useState<"intro" | "followup" | "share" | "seasonal">("intro");

  const openCompose = (kind: typeof composerKind) => {
    setComposerKind(kind);
    setComposerDraft(
      kind === "intro" ? introDraft :
      kind === "followup" ? followDraft :
      kind === "share" ? shareDraft :
      seasonalDraft,
    );
    setShowCompose(true);
  };

  const handleEmailLogged = async (notes?: string) => {
    setShowCompose(false);
    try {
      await action("log_email_sent", {
        contact_id: primary?.id ?? null,
        notes: notes ?? null,
        payload: { template: composerKind },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Log failed");
    }
  };

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Stage actions
      </h3>
      <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-4">
        {status === "prospect" && (
          <ButtonRow>
            <Btn primary onClick={() => action("mark_research_complete").catch((e) => setError(e.message))}>
              Mark research complete →
            </Btn>
          </ButtonRow>
        )}

        {(status === "researched" || status === "outreach_sent" || status === "engaged") && (
          <>
            <ButtonRow>
              {status === "researched" && (
                <Btn primary onClick={() => openCompose("intro")}>
                  Send Day-0 email
                </Btn>
              )}
              {status === "outreach_sent" && (
                <Btn primary onClick={() => openCompose("followup")}>
                  Send follow-up email
                </Btn>
              )}
              {ctx.outreach.stakeholder_type === "advisor" || ctx.outreach.stakeholder_type === "dept_head" ? (
                <Btn onClick={() => setShowCallScript((s) => !s)}>
                  {showCallScript ? "Hide call script" : "Log a call"}
                </Btn>
              ) : null}
              {ctx.outreach.stakeholder_type === "student_org" && (
                <>
                  <Btn onClick={() => action("log_ig_dm_sent", { contact_id: primary?.id ?? null }).catch((e) => setError(e.message))}>
                    Log IG DM sent
                  </Btn>
                  <Btn onClick={() => action("log_contact_form", { contact_id: primary?.id ?? null }).catch((e) => setError(e.message))}>
                    Log contact-form submit
                  </Btn>
                </>
              )}
              {status !== "engaged" && (
                <Btn onClick={() => action("mark_engaged").catch((e) => setError(e.message))}>
                  Mark engaged (got reply)
                </Btn>
              )}
              {status === "engaged" && (
                <>
                  <Btn primary onClick={() => setShowMeetingForm((s) => !s)}>
                    Schedule meeting
                  </Btn>
                  <Btn onClick={() => action("mark_agreed").catch((e) => setError(e.message))}>
                    Mark agreed
                  </Btn>
                  <Btn onClick={() => setShowDistribForm((s) => !s)}>
                    Mark distributed (with evidence)
                  </Btn>
                </>
              )}
            </ButtonRow>
            {showCallScript && (
              <CallLogPanel
                script={callDraft.script}
                primaryContactId={primary?.id ?? null}
                action={action}
                setError={setError}
                onClose={() => setShowCallScript(false)}
              />
            )}
            {showMeetingForm && (
              <MeetingForm
                action={action}
                setError={setError}
                onClose={() => setShowMeetingForm(false)}
              />
            )}
            {showDistribForm && (
              <DistributedForm
                action={action}
                setError={setError}
                onClose={() => setShowDistribForm(false)}
              />
            )}
          </>
        )}

        {status === "meeting_scheduled" && (
          <ButtonRow>
            <Btn primary onClick={() => action("log_meeting_held").catch((e) => setError(e.message))}>
              Meeting held
            </Btn>
            <Btn onClick={() => action("log_meeting_no_show").catch((e) => setError(e.message))}>
              No-show
            </Btn>
            <MeetingRescheduleInline action={action} setError={setError} />
          </ButtonRow>
        )}

        {status === "agreed" && (
          <>
            <ButtonRow>
              <Btn primary onClick={() => openCompose("share")}>
                Send share materials
              </Btn>
              <Btn onClick={() => setShowDistribForm((s) => !s)}>
                Confirm distributed
              </Btn>
            </ButtonRow>
            {showDistribForm && (
              <DistributedForm
                action={action}
                setError={setError}
                onClose={() => setShowDistribForm(false)}
              />
            )}
          </>
        )}

        {status === "distributed" && (
          <ButtonRow>
            <Btn primary onClick={() => action("mark_active_partner").catch((e) => setError(e.message))}>
              Promote to Active Partner →
            </Btn>
          </ButtonRow>
        )}

        {status === "active_partner" && (
          <ButtonRow>
            <Btn primary onClick={() => openCompose("seasonal")}>
              Send seasonal check-in
            </Btn>
            <Btn
              onClick={() =>
                action("queue_manual_task", {
                  task_type: "partner_share_update" as TaskType,
                  due_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
                }).catch((e) => setError(e.message))
              }
            >
              Queue share update (+7d)
            </Btn>
          </ButtonRow>
        )}

        {(status === "no_response_closed" || status === "wrong_contact") && (
          <ButtonRow>
            <Btn primary onClick={() => action("reopen").catch((e) => setError(e.message))}>
              Re-open
            </Btn>
          </ButtonRow>
        )}
      </div>

      {showCompose && (
        <EmailComposerModal
          to={primary?.email ?? ""}
          draft={composerDraft}
          onCancel={() => setShowCompose(false)}
          onConfirmSent={handleEmailLogged}
        />
      )}
    </section>
  );
}

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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Log failed");
    }
  };
  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 p-3 text-sm">
      <pre className="mb-3 whitespace-pre-wrap text-xs text-gray-700">{script}</pre>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="mb-2 w-full rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
        rows={2}
      />
      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => log("no_answer")}>No answer</Btn>
        <Btn onClick={() => log("voicemail")}>Voicemail</Btn>
        <Btn primary onClick={() => log("connected")}>Connected</Btn>
        <Btn danger onClick={() => log("wrong_number")}>Wrong number</Btn>
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
    <div className="rounded-md border border-gray-100 bg-gray-50 p-3 space-y-2">
      <Field type="datetime-local" label="Meeting at" value={meetingAt} onChange={setMeetingAt} />
      <Select label="Kind" value={kind} onChange={setKind} options={[
        { value: "phone", label: "Phone" },
        { value: "video", label: "Video" },
        { value: "in_person", label: "In Person" },
      ]} />
      <Field label="Link / location" value={link} onChange={setLink} placeholder="https://meet.example.com/..." />
      <Field label="Notes" value={notes} onChange={setNotes} />
      <div className="flex gap-2 pt-1">
        <Btn primary onClick={async () => {
          if (!meetingAt) { setError("Meeting time required"); return; }
          try {
            await action("mark_meeting_scheduled", {
              meeting_at: new Date(meetingAt).toISOString(),
              meeting_kind: kind,
              meeting_link: link,
              notes,
            });
            onClose();
          } catch (e) { setError(e instanceof Error ? e.message : "Schedule failed"); }
        }}>Save meeting</Btn>
        <Btn onClick={onClose}>Cancel</Btn>
      </div>
    </div>
  );
}

function MeetingRescheduleInline({
  action,
  setError,
}: {
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const [val, setVal] = useState("");
  const [open, setOpen] = useState(false);
  if (!open) return <Btn onClick={() => setOpen(true)}>Reschedule</Btn>;
  return (
    <div className="flex items-center gap-2">
      <input
        type="datetime-local"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="rounded-md border border-gray-200 px-2 py-1 text-sm"
      />
      <Btn primary onClick={async () => {
        if (!val) { setError("Date required"); return; }
        try {
          await action("log_meeting_rescheduled", { meeting_at: new Date(val).toISOString() });
          setOpen(false);
          setVal("");
        } catch (e) { setError(e instanceof Error ? e.message : "Reschedule failed"); }
      }}>Save</Btn>
      <Btn onClick={() => setOpen(false)}>Cancel</Btn>
    </div>
  );
}

function DistributedForm({
  action,
  setError,
  onClose,
}: {
  action: ActionFn;
  setError: (e: string | null) => void;
  onClose: () => void;
}) {
  const [evidence, setEvidence] = useState<DistributionEvidence>("self_reported");
  const [notes, setNotes] = useState("");
  return (
    <div className="rounded-md border border-gray-100 bg-emerald-50/60 p-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
        Confirm distributed
      </p>
      <Select
        label="Evidence type"
        value={evidence}
        onChange={(v) => setEvidence(v as DistributionEvidence)}
        options={[
          { value: "explicit_email", label: "Explicit (email/written)" },
          { value: "explicit_verbal", label: "Explicit (verbal/call/meeting)" },
          { value: "observed_external", label: "Observed externally (IG, listserv, etc.)" },
          { value: "self_reported", label: "Stakeholder self-reported" },
        ]}
      />
      <Field label="Notes" value={notes} onChange={setNotes} placeholder='"Saw in pre-med IG story 5/4"' />
      <div className="flex gap-2 pt-1">
        <Btn primary onClick={async () => {
          try {
            await action("mark_distributed", { evidence, evidence_notes: notes });
            onClose();
          } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
        }}>Confirm distributed</Btn>
        <Btn onClick={onClose}>Cancel</Btn>
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
  const [website, setWebsite] = useState(r.website ?? "");
  const [officialEmail, setOfficialEmail] = useState(r.official_email ?? "");
  const [phone, setPhone] = useState(r.phone ?? "");
  const [semCal, setSemCal] = useState(r.semester_calendar ?? "");
  const [notes, setNotes] = useState(r.notes ?? "");
  const [orgName, setOrgName] = useState(ctx.outreach.organization_name);
  const [department, setDepartment] = useState(ctx.outreach.department ?? "");
  const [programs, setPrograms] = useState(ctx.outreach.programs.join(", "));

  const saveResearch = async () => {
    try {
      await action("update_research", {
        research: {
          website,
          official_email: officialEmail,
          phone,
          semester_calendar: semCal,
          notes,
        } satisfies ResearchData,
      });
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
  };

  const saveOutreach = async () => {
    try {
      await action("update_outreach", {
        organization_name: orgName,
        department: department || null,
        programs: programs.split(",").map((s) => s.trim()).filter(Boolean),
      });
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
  };

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Research
      </h3>
      <div className="space-y-2 rounded-lg border border-gray-100 bg-white p-4">
        <Field label="Organization name" value={orgName} onChange={setOrgName} onBlur={saveOutreach} />
        <Field label="Department" value={department} onChange={setDepartment} onBlur={saveOutreach} />
        <Field label="Programs (comma-separated)" value={programs} onChange={setPrograms} onBlur={saveOutreach} placeholder="pre-med, pre-pa, pre-nursing" />
        <Field label="Website" value={website} onChange={setWebsite} onBlur={saveResearch} placeholder="https://..." />
        <Field label="Official email" value={officialEmail} onChange={setOfficialEmail} onBlur={saveResearch} placeholder="advising@..." />
        <Field label="Phone" value={phone} onChange={setPhone} onBlur={saveResearch} />
        <Field label="Semester calendar / timing notes" value={semCal} onChange={setSemCal} onBlur={saveResearch} />
        <Field label="Research notes" value={notes} onChange={setNotes} onBlur={saveResearch} multiline />
      </div>
    </section>
  );
}

// ── Contacts section ───────────────────────────────────────────────────

function ContactsSection({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Contacts ({ctx.contacts.filter((c) => c.status === "active").length} active)
        </h3>
        <Btn small onClick={() => setShowAdd((s) => !s)}>{showAdd ? "Cancel" : "+ Add contact"}</Btn>
      </div>
      <div className="space-y-2 rounded-lg border border-gray-100 bg-white p-4">
        {ctx.contacts.length === 0 && !showAdd && (
          <p className="text-sm text-gray-400">No contacts yet.</p>
        )}
        {ctx.contacts.map((c) => (
          <ContactRow key={c.id} contact={c} action={action} setError={setError} />
        ))}
        {showAdd && (
          <AddContactInline
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
          <div className="flex shrink-0 gap-1">
            <Btn small onClick={() => action("mark_contact_stale", { contact_id: contact.id }).catch((e) => setError(e.message))}>
              Mark stale
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

function AddContactInline({
  action,
  setError,
  onSaved,
}: {
  action: ActionFn;
  setError: (e: string | null) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [contactFormUrl, setContactFormUrl] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  return (
    <div className="space-y-2 rounded-md border border-dashed border-gray-200 p-3">
      <Field label="Name *" value={name} onChange={setName} />
      <Field label="Role" value={role} onChange={setRole} placeholder="President / Pre-Health Advisor / ..." />
      <Field label="Email" value={email} onChange={setEmail} type="email" />
      <Field label="Phone" value={phone} onChange={setPhone} />
      <Field label="Instagram" value={instagram} onChange={setInstagram} placeholder="@handle" />
      <Field label="Contact form URL" value={contactFormUrl} onChange={setContactFormUrl} />
      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
        Primary contact
      </label>
      <Btn primary onClick={async () => {
        if (!name.trim()) { setError("Name required"); return; }
        try {
          await action("add_contact", {
            name, role, email, phone, instagram, contact_form_url: contactFormUrl, is_primary: isPrimary,
          });
          onSaved();
        } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
      }}>Add contact</Btn>
    </div>
  );
}

// ── Approvals section ──────────────────────────────────────────────────

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
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Approvals ({open.length} pending)
        </h3>
        <Btn small onClick={() => setShowRequest(true)}>+ Request approval</Btn>
      </div>
      <div className="space-y-2 rounded-lg border border-gray-100 bg-white p-4">
        {open.length === 0 && resolved.length === 0 && (
          <p className="text-sm text-gray-400">No approvals.</p>
        )}
        {open.map((a) => (
          <ApprovalRow
            key={a.id}
            approval={a}
            action={action}
            setError={setError}
            ctx={ctx}
          />
        ))}
        {resolved.map((a) => (
          <ApprovalRow
            key={a.id}
            approval={a}
            action={action}
            setError={setError}
            ctx={ctx}
            resolved
          />
        ))}
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
  ctx,
  resolved,
}: {
  approval: Approval;
  action: ActionFn;
  setError: (e: string | null) => void;
  ctx: DrawerContext;
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
            <Btn primary onClick={() => resolve("granted")}>Granted</Btn>
            <Btn onClick={() => resolve("denied")}>Denied</Btn>
            <Btn onClick={() => resolve("expired")}>Expired</Btn>
            {approval.approval_type === "department" && (
              <BulkUnlockHint outreachId={ctx.outreach.id} approval={approval} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BulkUnlockHint({ outreachId, approval }: { outreachId: string; approval: Approval }) {
  // Placeholder for the deeper unlock flow — a hint that admin should
  // also use the Bulk Professor Import after granting.
  void outreachId;
  void approval;
  return (
    <span className="self-center text-[11px] text-gray-500 italic">
      Tip: After granting, use Bulk Professor Import on the Campus page.
    </span>
  );
}

// ── Tasks section ──────────────────────────────────────────────────────

function TasksSection({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Pending tasks ({ctx.pending_tasks.length})
      </h3>
      <div className="space-y-2 rounded-lg border border-gray-100 bg-white p-4">
        {ctx.pending_tasks.length === 0 && (
          <p className="text-sm text-gray-400">No pending tasks.</p>
        )}
        {ctx.pending_tasks.map((t) => (
          <TaskRow key={t.id} task={t} action={action} setError={setError} />
        ))}
      </div>
    </section>
  );
}

function TaskRow({
  task,
  action,
  setError,
}: {
  task: Task;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-gray-100 px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-800">{humanTask(task.task_type)}</p>
        <p className="text-xs text-gray-500">
          Due {new Date(task.due_at).toLocaleString()}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Btn small onClick={() => action("complete_task", { task_id: task.id }).catch((e) => setError(e.message))}>
          Done
        </Btn>
        <Btn small onClick={() => action("cancel_task", { task_id: task.id }).catch((e) => setError(e.message))}>
          Cancel
        </Btn>
      </div>
    </div>
  );
}

// ── History ────────────────────────────────────────────────────────────

function HistorySection({
  touchpoints,
  contacts,
}: {
  touchpoints: Touchpoint[];
  contacts: Contact[];
}) {
  const contactById = new Map(contacts.map((c) => [c.id, c.name]));
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        History
      </h3>
      {touchpoints.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
          No touchpoints yet.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {touchpoints.map((t) => (
            <li
              key={t.id}
              className="rounded-md border border-gray-100 bg-white px-3 py-2 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-gray-700">
                  {humanTouchpoint(t.touchpoint_type)}
                  {t.contact_id && contactById.get(t.contact_id) && (
                    <span className="ml-1 text-xs font-normal text-gray-500">
                      ({contactById.get(t.contact_id)})
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-gray-400">
                  {new Date(t.created_at).toLocaleString()}
                </span>
              </div>
              {t.notes && <p className="mt-1 text-sm text-gray-600">{t.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
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
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Close out
      </h3>
      <div className="flex flex-wrap gap-2 rounded-lg border border-gray-100 bg-white p-4">
        <Btn onClick={() => confirm("Mark Not Interested?", () => action("mark_not_interested"))}>
          Not interested
        </Btn>
        <Btn onClick={() => confirm("Close as No Response (re-open in 90d)?", () => action("mark_no_response_closed"))}>
          Close: no response
        </Btn>
        <Btn onClick={() => confirm("Mark all known contacts wrong / unreachable?", () => action("mark_wrong_contact"))}>
          Wrong contact
        </Btn>
        <Btn danger onClick={() => confirm("Mark Do Not Contact (hard stop)?", () => action("mark_dnc"))}>
          DNC (hard stop)
        </Btn>
      </div>
    </section>
  );
}

// ── UI primitives ──────────────────────────────────────────────────────

function ButtonRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Btn({
  children,
  onClick,
  primary,
  danger,
  small,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => unknown;
  primary?: boolean;
  danger?: boolean;
  small?: boolean;
  disabled?: boolean;
}) {
  const base = `rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    small ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
  }`;
  const styles = primary
    ? "bg-gray-900 text-white hover:bg-gray-700"
    : danger
    ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50";
  return (
    <button onClick={() => void onClick()} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
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
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
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
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// ── Touchpoint + task labels ───────────────────────────────────────────

function humanTouchpoint(t: string): string {
  const map: Record<string, string> = {
    email_sent: "Email sent",
    email_replied: "Email replied",
    email_bounced: "Email bounced",
    call_no_answer: "Call: no answer",
    call_voicemail: "Call: voicemail",
    call_connected: "Call: connected",
    call_wrong_number: "Call: wrong number",
    ig_dm_sent: "Instagram DM sent",
    ig_dm_replied: "Instagram DM replied",
    contact_form_submitted: "Contact form submitted",
    meeting_scheduled: "Meeting scheduled",
    meeting_held: "Meeting held",
    meeting_no_show: "Meeting no-show",
    meeting_rescheduled: "Meeting rescheduled",
    approval_requested: "Approval requested",
    approval_granted: "Approval granted",
    approval_denied: "Approval denied",
    approval_expired: "Approval expired",
    distribution_confirmed: "Distribution confirmed",
    contact_added: "Contact added",
    contact_marked_stale: "Contact updated",
    contact_replaced: "Contact replaced",
    redirect_initiated: "Redirected",
    stage_change: "Stage changed",
    note_added: "Note added",
    snoozed: "Snoozed",
    task_cancelled: "Task cancelled",
    task_superseded: "Task superseded",
    system_seasonal_due: "Seasonal check-in due",
  };
  return map[t] ?? t;
}

function humanTask(t: string): string {
  const map: Record<string, string> = {
    research_initial: "Research stakeholder",
    outreach_day_0: "Day 0 outreach (email + call)",
    outreach_multichannel_orgs: "Day 0 multi-channel (email + IG + form)",
    outreach_followup_email: "Follow-up email",
    outreach_followup_call: "Follow-up call",
    meeting_held_logging: "Log meeting outcome",
    agreement_followup: "Confirm distribution",
    distribution_confirmation: "Confirm distribution",
    move_to_active_partner: "Promote to Active Partner",
    partner_seasonal_checkin: "Seasonal check-in",
    partner_share_update: "Share update",
    partner_event_coordination: "Coordinate event",
    approval_request_followup: "Follow up on approval",
    yearly_leadership_recheck: "Verify org leadership",
    manual_followup: "Manual follow-up",
  };
  return map[t] ?? t;
}

// Suppress unused-type warning; types are re-exported from drawer.
const _stakeholderKeepalive: StakeholderType[] = ["advisor"];
void _stakeholderKeepalive;
