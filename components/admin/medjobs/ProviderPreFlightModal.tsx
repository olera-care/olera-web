"use client";

/**
 * ProviderPreFlightModal — v9 Phase 9 step 4.
 *
 * Per-recipient pre-flight review for provider outreach. Lives
 * alongside the existing PreFlightReviewModal which still handles
 * stakeholder paths (legacy single-snapshot mode).
 *
 * Three sections, top to bottom:
 *
 *   1. Recipients
 *      One row per active contact. Each row shows email and phone
 *      coverage (✓/–), the contact's role, and a checkbox to
 *      include/exclude this recipient from the launch. Variant
 *      assignment is automatic:
 *        role = "General Office" / "General Inbox" → general
 *        otherwise → named
 *      Admin's role tagging on the SnapshotCard drives the
 *      classification; no separate variant picker needed in MVP.
 *
 *   2. Per-day cards
 *      One card per cadence day. Each card shows:
 *        • Email step(s) — two collapsible editors for general
 *          and named variants. Admin edits each independently;
 *          edits affect every recipient in that bucket.
 *        • Phone step(s) — one collapsible editor for the
 *          day's call script. Shared across all callable
 *          recipients that day.
 *      Days with no email step skip the email editors; days
 *      with no phone step skip the call editor.
 *
 *   3. Queue summary + submit
 *      Footer summarizes total emails + calls that will queue.
 *      Day-0 emails fire inline in parallel on submit; later
 *      days queue per the cadence.
 *
 * Submit payload (per-recipient mode):
 *   recipients[]
 *   email_snapshots_by_variant: { general: [...], named: [...] }
 *   call_scripts: [{ day, script }]
 *
 * planSequence per-recipient mode (lib/student-outreach/sequencer.ts)
 * expands these into one task per (day, recipient) at queue time.
 */

import { useEffect, useMemo, useState } from "react";
import {
  OUTREACH_DAYS_BY_TYPE,
  type CadenceKey,
} from "@/lib/student-outreach/cadence";
import {
  defaultSnapshotsByVariant,
  defaultCallScriptsFor,
  defaultCallTipsForDay,
  type EmailSnapshot,
  type RecipientPlan,
  type CallScript,
} from "@/lib/student-outreach/sequencer";
import type { Contact } from "@/lib/student-outreach/types";
import Input from "@/components/ui/Input";
import { getProgramPdfConfig } from "@/lib/program-pdf/configs";

interface Props {
  organizationName: string;
  campusName: string;
  /** v9 final: campus slug. Drives which Program PDF attaches to
   *  the send (per-university config in lib/program-pdf). When a
   *  config exists for this slug, PreFlight surfaces a small
   *  "PDF attached" indicator so admin sees the package contents
   *  before launching. */
  campusSlug?: string | null;
  /** v9 final: per-campus PDF override URL from
   *  student_outreach_campuses.program_pdf_url. When set, the
   *  attachment loader uses this file instead of the code-defined
   *  template; PreFlight surfaces both the filename and the
   *  "Custom upload" source label so admin knows what's going. */
  campusProgramPdfUrl?: string | null;
  contacts: Contact[];
  /**
   * v9 final: effective General Contact for the outreach row —
   * research_data.general_contact overrides stacked on the
   * business_profiles directory fallback. When email or phone is
   * present, PreFlight prepends a synthetic "general" recipient
   * row so admin can launch outreach even without a named Specific
   * Contact. The synthetic recipient maps to recipient_kind='general'
   * + contact_id=null at submit time.
   */
  generalContact?: {
    email?: string | null;
    phone?: string | null;
  } | null;
  onCancel: () => void;
  onSubmit: (payload: {
    recipients: RecipientPlan[];
    email_snapshots_by_variant: { general: EmailSnapshot[]; named: EmailSnapshot[] };
    call_scripts: CallScript[];
  }) => Promise<void>;
}

interface RecipientUiRow {
  /** Null for the synthetic General Contact row. */
  contact_id: string | null;
  /** v9 final: 'general' = synthetic General Contact row (no
   *  underlying student_outreach_contacts row). 'specific' =
   *  a named contact. Drives recipient_kind on the queued tasks. */
  kind: "specific" | "general";
  name: string;
  first_name: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  is_general: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
}

const PROVIDER_CADENCE_KEY: CadenceKey = "provider";

const GENERAL_ROLES = new Set(["General Office", "General Inbox"]);

/**
 * v9: substitute the static placeholders that don't vary per
 * recipient — used for call scripts at seed time + preview pane.
 * Per-recipient {first_name}/{recipient_name} stay placeholders
 * until queue time so the editor shows what's varying.
 */
function substituteStaticVars(
  text: string,
  vars: {
    organization_name: string;
    campus_name: string;
    admin_first_name: string;
  },
): string {
  return text
    .replace(/\{organization_name\}/g, vars.organization_name)
    .replace(/\{campus_name\}/g, vars.campus_name)
    .replace(/\{admin_first_name\}/g, vars.admin_first_name);
}

/**
 * v9: full preview substitution including a sample {first_name}.
 * Used by VariantEditor's preview pane so admin can screen what
 * the recipient will actually see.
 */
function substitutePreviewVars(
  text: string,
  vars: {
    first_name: string;
    organization_name: string;
    campus_name: string;
    admin_first_name: string;
  },
): string {
  return text
    .replace(/\{first_name\}/g, vars.first_name)
    .replace(/\{organization_name\}/g, vars.organization_name)
    .replace(/\{campus_name\}/g, vars.campus_name)
    .replace(/\{admin_first_name\}/g, vars.admin_first_name);
}

export function ProviderPreFlightModal({
  organizationName,
  campusName,
  campusSlug,
  campusProgramPdfUrl,
  contacts,
  generalContact,
  onCancel,
  onSubmit,
}: Props) {
  // v9 final: surface the Program PDF that will be attached so
  // admin sees the outreach package before launching. Resolution
  // mirrors the server's loadProgramPdfAttachment order:
  //   1. campus.program_pdf_url override (custom upload)
  //   2. lib/program-pdf/configs/<slug>.ts (template config)
  //   3. null — no PDF indicator, no attachment
  const programPdfAttachment = (() => {
    if (campusProgramPdfUrl) {
      const filename =
        decodeURIComponent(campusProgramPdfUrl.split("/").pop() ?? "")
          .split("?")[0] || "program.pdf";
      return {
        source: "custom" as const,
        filename,
        previewUrl: campusProgramPdfUrl,
      };
    }
    if (!campusSlug) return null;
    const config = getProgramPdfConfig(campusSlug);
    if (!config) return null;
    return {
      source: "template" as const,
      filename: `${config.slug}-student-caregiver-program.pdf`,
      previewUrl: `/api/medjobs/program-pdf?university=${config.slug}`,
    };
  })();
  // Build the recipient roster. First slot (when present) is the
  // synthetic General Contact row — organization-level fallback
  // (research_data.general_contact || business_profiles fields).
  // Subsequent rows are active Specific Contacts. Admin toggles
  // inclusion per row; initial state includes every recipient with
  // at least one channel populated.
  const recipientRows = useMemo<RecipientUiRow[]>(() => {
    const rows: RecipientUiRow[] = [];
    const generalEmail = generalContact?.email?.trim() || "";
    const generalPhone = generalContact?.phone?.trim() || "";
    if (generalEmail || generalPhone) {
      rows.push({
        contact_id: null,
        kind: "general",
        // The synthetic recipient's display name = the organization
        // name. Per user spec: the General Contact row is labeled
        // as the organization itself, not a person.
        name: organizationName,
        first_name: null,
        role: "General Contact",
        email: generalEmail || null,
        phone: generalPhone || null,
        is_general: true,
        hasEmail: Boolean(generalEmail),
        hasPhone: Boolean(generalPhone),
      });
    }
    for (const c of contacts) {
      if (c.status !== "active") continue;
      const hasEmail = Boolean(c.email && c.email.trim().length > 0);
      const phoneOrMobile = c.phone?.trim() || c.mobile?.trim() || "";
      const hasPhone = phoneOrMobile.length > 0;
      if (!hasEmail && !hasPhone) continue;
      rows.push({
        contact_id: c.id,
        kind: "specific",
        name:
          [c.first_name, c.last_name].filter(Boolean).join(" ").trim() ||
          c.name,
        first_name: c.first_name?.trim() || null,
        role: c.role || null,
        email: c.email,
        phone: phoneOrMobile || null,
        // Legacy: contacts tagged with General Office / General Inbox
        // (pre-v9-final) still route to the general variant template.
        // New General Contact synthetic row also uses general variant.
        is_general: GENERAL_ROLES.has(c.role ?? ""),
        hasEmail,
        hasPhone,
      });
    }
    return rows;
  }, [contacts, generalContact?.email, generalContact?.phone, organizationName]);

  // Inclusion keyed by a stable identifier — synthetic recipient
  // uses the literal "general" sentinel; specific recipients use
  // their contact_id.
  const recipientKeyOf = (r: RecipientUiRow) =>
    r.kind === "general" ? "__general__" : r.contact_id!;
  const [includedIds, setIncludedIds] = useState<Set<string>>(
    () => new Set(recipientRows.map(recipientKeyOf)),
  );

  // Snapshots seeded from defaults. Provider templates branch per
  // variant; for non-provider cadences this still produces the same
  // body for both general + named (templates ignore variant). MVP
  // assumes this modal is provider-only — caller wires it via
  // NextStepCard for kind='provider' rows.
  const defaults = useMemo(
    () =>
      defaultSnapshotsByVariant(PROVIDER_CADENCE_KEY, {
        organization_name: organizationName,
        campus_name: campusName,
        contacts,
      }),
    [organizationName, campusName, contacts],
  );

  const [generalSnaps, setGeneralSnaps] = useState<EmailSnapshot[]>(
    defaults.general,
  );
  const [namedSnaps, setNamedSnaps] = useState<EmailSnapshot[]>(defaults.named);
  // v9: substitute static vars at seed time so admin sees the script
  // with org/campus/admin filled in. {recipient_name} stays as a
  // placeholder — planSequence substitutes per-task at queue time
  // since each call task targets a specific recipient.
  const [callScripts, setCallScripts] = useState<CallScript[]>(() => {
    const seeds = defaultCallScriptsFor(PROVIDER_CADENCE_KEY);
    return seeds.map((s) => ({
      day: s.day,
      script: substituteStaticVars(s.script, {
        organization_name: organizationName,
        campus_name: campusName,
        admin_first_name: "Graize",
      }),
    }));
  });

  // v9 final: the contact-form decision is now collected BEFORE
  // PreFlight (via ContactFormBanner in the SnapshotCard, gated by
  // the pre-flight checklist). By the time admin reaches this
  // modal, the contact_form_submitted touchpoint already exists.
  // PreFlight stays focused on email + call recipients.

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [openDay, setOpenDay] = useState<number | null>(0);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Derived state — what will the queue look like with the current
  // recipient selection?
  const includedRows = recipientRows.filter((r) => includedIds.has(recipientKeyOf(r)));
  const generalRows = includedRows.filter((r) => r.is_general);
  const namedRows = includedRows.filter((r) => !r.is_general);
  const emailRows = includedRows.filter((r) => r.hasEmail);
  const callRows = includedRows.filter((r) => r.hasPhone);

  const cadenceDays = OUTREACH_DAYS_BY_TYPE[PROVIDER_CADENCE_KEY];
  const emailDayCount = cadenceDays.filter((d) =>
    d.steps.some((s) => s.channel === "email"),
  ).length;
  const phoneDayCount = cadenceDays.filter((d) =>
    d.steps.some((s) => s.channel === "phone"),
  ).length;
  const queuedEmails = emailRows.length * emailDayCount;
  const queuedCalls = callRows.length * phoneDayCount;

  const toggleIncluded = (key: string) => {
    setIncludedIds((cur) => {
      const next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const updateGeneral = (day: number, patch: Partial<EmailSnapshot>) => {
    setGeneralSnaps((cur) =>
      cur.map((s) => (s.day === day ? { ...s, ...patch } : s)),
    );
  };
  const updateNamed = (day: number, patch: Partial<EmailSnapshot>) => {
    setNamedSnaps((cur) =>
      cur.map((s) => (s.day === day ? { ...s, ...patch } : s)),
    );
  };
  const updateScript = (day: number, script: string) => {
    setCallScripts((cur) =>
      cur.map((s) => (s.day === day ? { ...s, script } : s)),
    );
  };

  const submit = async () => {
    setErr(null);
    if (queuedEmails === 0 && queuedCalls === 0) {
      setErr("Select at least one recipient with email or phone to launch.");
      return;
    }
    // Validate snapshot copy is non-empty for the variants in use.
    if (generalRows.length > 0 && emailDayCount > 0) {
      for (const s of generalSnaps) {
        if (!s.subject?.trim() || !s.body?.trim()) {
          setErr(`Day ${s.day} general subject + body required`);
          return;
        }
      }
    }
    if (namedRows.length > 0 && emailDayCount > 0) {
      for (const s of namedSnaps) {
        if (!s.subject?.trim() || !s.body?.trim()) {
          setErr(`Day ${s.day} named subject + body required`);
          return;
        }
      }
    }

    const plans: RecipientPlan[] = includedRows.map((r) => ({
      contact_id: r.contact_id,
      recipient_kind: r.kind,
      variant: r.is_general ? "general" : "named",
      channels: {
        email: r.hasEmail,
        phone: r.hasPhone,
      },
      recipient_name: r.name,
      recipient_first_name: r.first_name,
      recipient_email: r.email,
      recipient_phone: r.phone,
      recipient_role: r.role,
    }));

    setSubmitting(true);
    try {
      await onSubmit({
        recipients: plans,
        email_snapshots_by_variant: {
          general: generalSnaps,
          named: namedSnaps,
        },
        call_scripts: callScripts,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Schedule failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Confirm outreach plan
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {organizationName} · per-recipient cadence. Day 0 emails fire
              inline; calls queue to the Calls tab.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
            aria-label="Close"
          >
            <span aria-hidden>×</span>
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {err && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </p>
          )}

          {/* v9 final: PDF attachment indicator. Two modes:
              programPdfAttachment is set    → green confirmation
                                                with filename + source
                                                label + Preview link
              null (no config + no override) → amber notice so admin
                                                knows the send goes
                                                without a PDF
              Either way, the source of truth is visible before launch. */}
          <section className="rounded-md border border-gray-200 bg-white">
            <header className="border-b border-gray-100 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                PDF attachment
              </p>
            </header>
            {programPdfAttachment ? (
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="text-base">📎</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900">
                        {programPdfAttachment.filename}
                      </p>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          programPdfAttachment.source === "custom"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-primary-50 text-primary-700"
                        }`}
                      >
                        {programPdfAttachment.source === "custom"
                          ? "Custom upload"
                          : `Default · ${campusName} template`}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Attached to every outreach email queued from this launch.
                    </p>
                  </div>
                </div>
                <a
                  href={programPdfAttachment.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                >
                  Preview ↗
                </a>
              </div>
            ) : (
              <div className="px-3 py-2.5">
                <p className="text-xs text-amber-800">
                  No PDF configured for this campus. The send will go
                  without an attachment. To wire one up, register a
                  config in <code className="rounded bg-gray-100 px-1 font-mono text-[10px]">lib/program-pdf/configs/</code>{" "}
                  or set <code className="rounded bg-gray-100 px-1 font-mono text-[10px]">program_pdf_url</code> on the campus row.
                </p>
              </div>
            )}
          </section>

          {/* Recipients section */}
          <section className="rounded-md border border-gray-200 bg-white">
            <header className="border-b border-gray-100 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Recipients ({recipientRows.length})
              </p>
            </header>
            {recipientRows.length === 0 ? (
              <p className="px-3 py-3 text-xs text-amber-700">
                ⚠ No active contacts with email or phone. Cancel and add one
                via the Outreach Contacts list before launching.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recipientRows.map((r) => {
                  const key = recipientKeyOf(r);
                  const included = includedIds.has(key);
                  return (
                    <li key={key} className="px-3 py-2">
                      <label className="flex cursor-pointer items-start gap-2">
                        <input
                          type="checkbox"
                          checked={included}
                          onChange={() => toggleIncluded(key)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {r.name}
                            </span>
                            {r.role && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                  r.is_general
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {r.role}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-medium uppercase tracking-wide ${
                                r.is_general ? "text-blue-700" : "text-primary-700"
                              }`}
                            >
                              {r.is_general ? "general variant" : "named variant"}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-gray-500">
                            {r.hasEmail ? (
                              <>✉ {r.email}</>
                            ) : (
                              <span className="text-gray-400">No email</span>
                            )}
                            {" · "}
                            {r.hasPhone ? (
                              <>☎ {r.phone}</>
                            ) : (
                              <span className="text-gray-400">No phone</span>
                            )}
                          </p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <footer className="border-t border-gray-100 bg-gray-50 px-3 py-2 text-[11px] text-gray-600">
              Will queue:{" "}
              <strong className="tabular-nums">{queuedEmails}</strong> email
              {queuedEmails === 1 ? "" : "s"} (
              {emailRows.length} recipient{emailRows.length === 1 ? "" : "s"} ×{" "}
              {emailDayCount} day{emailDayCount === 1 ? "" : "s"}) ·{" "}
              <strong className="tabular-nums">{queuedCalls}</strong> call
              {queuedCalls === 1 ? "" : "s"} (
              {callRows.length} callable × {phoneDayCount} call day
              {phoneDayCount === 1 ? "" : "s"}). Day 0 fires inline.
            </footer>
          </section>

          {/* Per-day editors */}
          {cadenceDays.map((d) => {
            const isOpen = openDay === d.day;
            const general = generalSnaps.find((s) => s.day === d.day);
            const named = namedSnaps.find((s) => s.day === d.day);
            const script = callScripts.find((s) => s.day === d.day);
            const hasEmailStep = d.steps.some((s) => s.channel === "email");
            const hasPhoneStep = d.steps.some((s) => s.channel === "phone");
            return (
              <div
                key={d.day}
                className="rounded-md border border-gray-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenDay(isOpen ? null : d.day)}
                  className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {d.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {hasEmailStep &&
                        `${generalRows.length} general + ${namedRows.length} named email${
                          generalRows.length + namedRows.length === 1 ? "" : "s"
                        }`}
                      {hasEmailStep && hasPhoneStep && " · "}
                      {hasPhoneStep && `${callRows.length} call${callRows.length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{isOpen ? "▾" : "▸"}</span>
                </button>
                {isOpen && (
                  <div className="space-y-3 border-t border-gray-100 px-3 pb-3 pt-2">
                    {hasEmailStep && generalRows.length > 0 && general && (
                      <VariantEditor
                        label={`General variant · ${generalRows.length} recipient${generalRows.length === 1 ? "" : "s"}`}
                        tone="blue"
                        snapshot={general}
                        onChange={(p) => updateGeneral(d.day, p)}
                        previewVars={{
                          first_name:
                            namedRows[0]?.first_name ||
                            namedRows[0]?.name?.split(/\s+/)[0] ||
                            "there",
                          organization_name: organizationName,
                          campus_name: campusName,
                          admin_first_name: "Graize",
                        }}
                      />
                    )}
                    {hasEmailStep && namedRows.length > 0 && named && (
                      <VariantEditor
                        label={`Named variant · ${namedRows.length} recipient${namedRows.length === 1 ? "" : "s"}`}
                        tone="emerald"
                        snapshot={named}
                        onChange={(p) => updateNamed(d.day, p)}
                        previewVars={{
                          first_name:
                            namedRows[0]?.first_name ||
                            namedRows[0]?.name?.split(/\s+/)[0] ||
                            "there",
                          organization_name: organizationName,
                          campus_name: campusName,
                          admin_first_name: "Graize",
                        }}
                      />
                    )}
                    {hasPhoneStep && callRows.length > 0 && script && (
                      <CallScriptEditor
                        label={`Call script · ${callRows.length} callable`}
                        script={script.script}
                        onChange={(s) => updateScript(d.day, s)}
                        tips={defaultCallTipsForDay("provider", d.day)}
                      />
                    )}
                    {hasEmailStep && generalRows.length === 0 && namedRows.length === 0 && (
                      <p className="text-xs italic text-gray-400">
                        No email recipients selected for this day.
                      </p>
                    )}
                    {hasPhoneStep && callRows.length === 0 && (
                      <p className="text-xs italic text-gray-400">
                        No callable recipients selected for this day.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
          <p className="text-xs text-gray-500">
            <strong className="tabular-nums">{queuedEmails}</strong> email +{" "}
            <strong className="tabular-nums">{queuedCalls}</strong> call ready
          </p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={submitting}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={
                submitting || (queuedEmails === 0 && queuedCalls === 0)
              }
              className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? "Starting…" : "Start outreach"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── Editors ─────────────────────────────────────────────────────────────

function VariantEditor({
  label,
  tone,
  snapshot,
  onChange,
  previewVars,
}: {
  label: string;
  tone: "blue" | "emerald";
  snapshot: EmailSnapshot;
  onChange: (patch: Partial<EmailSnapshot>) => void;
  /** v9: vars used by the preview pane so admin can screen the
   *  rendered output (substitutions filled in) before launch. */
  previewVars: {
    first_name: string;
    organization_name: string;
    campus_name: string;
    admin_first_name: string;
  };
}) {
  const [showPreview, setShowPreview] = useState(false);
  const borderClass = tone === "blue" ? "border-blue-200" : "border-primary-200";
  const tagBg = tone === "blue" ? "bg-blue-50 text-blue-800" : "bg-primary-50 text-primary-800";
  const previewSubject = substitutePreviewVars(snapshot.subject, previewVars);
  const previewBody = substitutePreviewVars(snapshot.body, previewVars);
  return (
    <div className={`rounded-md border ${borderClass} bg-white`}>
      <header className={`px-3 py-1.5 ${tagBg} text-[11px] font-semibold uppercase tracking-wide`}>
        {label}
      </header>
      <div className="space-y-2 px-3 py-2">
        <Input
          label="Subject"
          value={snapshot.subject}
          onChange={(e) => onChange({ subject: e.target.value })}
          size="sm"
        />
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[13px] font-semibold text-gray-700">
            <span>Body</span>
            <span className="text-[11px] font-normal text-gray-500">
              Variables: <code>{"{first_name}"}</code>{" "}
              <code>{"{organization_name}"}</code>{" "}
              <code>{"{campus_name}"}</code>
            </span>
          </div>
          <Input
            as="textarea"
            value={snapshot.body}
            onChange={(e) => onChange({ body: e.target.value })}
            rows={8}
            size="sm"
            className="font-mono"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowPreview((s) => !s)}
          className="text-[11px] font-medium text-primary-700 hover:underline"
        >
          {showPreview ? "Hide preview" : "Preview substitution"}
        </button>
        {showPreview && (
          <div className="space-y-1 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Preview (sample first_name: {previewVars.first_name})
            </p>
            <p className="font-medium text-gray-700">Subject:</p>
            <p className="text-gray-800">{previewSubject}</p>
            <p className="mt-2 font-medium text-gray-700">Body:</p>
            <pre className="whitespace-pre-wrap text-gray-800 font-sans">
              {previewBody}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * v9.1 Graize 05.13 audit (Item 8): tips render as a read-only
 * block underneath the editable script body, not merged into the
 * script text itself. Admin edits only the script; tips stay
 * constant per day (defaultCallTipsForDay) and serve as quick
 * operational reminders for receptionist / voicemail / redirect
 * handling.
 */
function CallScriptEditor({
  label,
  script,
  onChange,
  tips,
}: {
  label: string;
  script: string;
  onChange: (s: string) => void;
  tips?: string[];
}) {
  return (
    <div className="rounded-md border border-amber-200 bg-white">
      <header className="bg-amber-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
        {label}
      </header>
      <div className="space-y-2 px-3 py-2">
        <Input
          as="textarea"
          value={script}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder="What to say on this call: tone, key references, target ask."
          size="sm"
        />
        {tips && tips.length > 0 && (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Tips
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] leading-relaxed text-gray-600">
              {tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-[11px] text-gray-500">
          Shown to admin in the Log call modal as reference. Admin can edit
          later if cadence strategy evolves.
        </p>
      </div>
    </div>
  );
}
