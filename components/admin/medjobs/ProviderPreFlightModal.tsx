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
  defaultCallScriptsFor,
  type RecipientPlan,
  type CallScript,
} from "@/lib/student-outreach/sequencer";
import type { Contact, SmartleadPreviewSnapshot } from "@/lib/student-outreach/types";
import Input from "@/components/ui/Input";
import { CallScriptBlock } from "@/components/admin/medjobs/CallScriptBlock";
import {
  getProgramPdfConfig,
  resolveProgramPdfConfig,
  type PdfAudience,
} from "@/lib/program-pdf/configs";
import type { SmartleadLinkage } from "@/lib/medjobs/smartlead-inbox";

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
  /** Smartlead preview snapshot — server-precomputed via
   *  buildSmartleadPreview. Always present unless the row has no usable
   *  recipient (which the pre-flight checklist prevents). */
  smartleadPreview: SmartleadPreviewSnapshot | null;
  /** Which cadence to render (provider by default). Stakeholder office launch
   *  passes the row's stakeholder_type so the advisor cadence + copy show. */
  cadenceKey?: CadenceKey;
  /** Smartlead thread linkage, when known, for the manual-reply inbox link.
   *  Omitted before a campaign exists — the link falls back to the root inbox. */
  smartleadLinkage?: SmartleadLinkage | null;
  /** Which program PDF this row's emails link — provider brochure (default) or
   *  the student flyer (partner/student-org rows). Drives the attachment preview
   *  and the hard no-PDF launch block (mirrors the server gate). */
  pdfAudience?: PdfAudience;
  onCancel: () => void;
  onSubmit: (payload: {
    recipients: RecipientPlan[];
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

export function ProviderPreFlightModal({
  organizationName,
  campusName,
  campusSlug,
  campusProgramPdfUrl,
  contacts,
  generalContact,
  smartleadPreview,
  cadenceKey = PROVIDER_CADENCE_KEY,
  smartleadLinkage,
  pdfAudience = "provider",
  onCancel,
  onSubmit,
}: Props) {
  // v9 final: surface the Program PDF that will be attached so
  // admin sees the outreach package before launching. Resolution
  // mirrors the server's loadProgramPdfAttachment order:
  //   1. campus.program_pdf_url override (custom upload)
  //   2. lib/program-pdf/configs/<slug>.ts (campus-specific config)
  //   3. the generic floor config for this audience (standard flyer)
  // There is always a PDF — the generic config is the floor, so launch is
  // never blocked on a missing per-campus flyer.
  const hasCampusConfig = Boolean(campusSlug && getProgramPdfConfig(campusSlug, pdfAudience));
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
    const config = resolveProgramPdfConfig(campusSlug, pdfAudience);
    if (!config) return null;
    // config.slug is the campus slug when configured, else "generic". The route
    // also falls back to generic, so linking the campus slug is equivalent.
    return {
      source: hasCampusConfig ? ("template" as const) : ("generic" as const),
      filename: `${config.slug}-${pdfAudience === "student" ? "student-program" : "student-caregiver-program"}.pdf`,
      previewUrl: `/api/medjobs/program-pdf?university=${config.slug}&audience=${pdfAudience}`,
    };
  })();

  // A flyer always resolves (campus upload, campus config, or the generic
  // floor), so launch is never blocked.
  const pdfConfigured = programPdfAttachment != null;
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

  // v9: substitute static vars at seed time so admin sees the script
  // with org/campus/admin filled in. {recipient_name} stays as a
  // placeholder — planSequence substitutes per-task at queue time
  // since each call task targets a specific recipient.
  const [callScripts, setCallScripts] = useState<CallScript[]>(() => {
    const seeds = defaultCallScriptsFor(cadenceKey);
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
  const emailRows = includedRows.filter((r) => r.hasEmail);
  const callRows = includedRows.filter((r) => r.hasPhone);

  const cadenceDays = OUTREACH_DAYS_BY_TYPE[cadenceKey];
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

  const submit = async () => {
    setErr(null);
    if (queuedEmails === 0 && queuedCalls === 0) {
      setErr("Select at least one recipient with email or phone to launch.");
      return;
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

          {/* Summary strip — sender pool, recipient + queue counts, PDF
              status. Replaces the standalone PDF banner + queue footer
              from the old layout, since both restate things repeated in
              the per-day cards below. */}
          <section className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Launch summary
            </p>
            <p className="mt-1 text-xs text-gray-700">
              <strong className="tabular-nums">{queuedEmails}</strong> email
              {queuedEmails === 1 ? "" : "s"} +{" "}
              <strong className="tabular-nums">{queuedCalls}</strong> call
              {queuedCalls === 1 ? "" : "s"} across the cadence below
            </p>
          </section>

          {/* Recipients — include/exclude only. Variant labels removed; the
              cadence section below shows exactly what each recipient receives. */}
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
                              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700">
                                {r.role}
                              </span>
                            )}
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
          </section>

          {/* Cadence — accordion per day. Each day expands to show every
              communication scheduled (email previews per recipient + shared
              call script + callable list). This is the source of truth for
              "what will happen on Day N" — replaces the separate Smartlead
              preview panel above. */}
          <section>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Cadence
            </p>
            <div className="space-y-2">
              {cadenceDays.map((d) => {
                const isOpen = openDay === d.day;
                const script = callScripts.find((s) => s.day === d.day);
                const hasEmailStep = d.steps.some((s) => s.channel === "email");
                const hasPhoneStep = d.steps.some((s) => s.channel === "phone");
                const previewStep = smartleadPreview?.steps.find(
                  (s) => s.cadence_day === d.day,
                );
                const dayEmailRows = hasEmailStep ? emailRows : [];
                const dayCallRows = hasPhoneStep ? callRows : [];
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
                            `${dayEmailRows.length} email${dayEmailRows.length === 1 ? "" : "s"}`}
                          {hasEmailStep && hasPhoneStep && " · "}
                          {hasPhoneStep &&
                            `${dayCallRows.length} call${dayCallRows.length === 1 ? "" : "s"}`}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {isOpen ? "▾" : "▸"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="space-y-3 border-t border-gray-100 px-3 pb-3 pt-2">
                        {hasEmailStep && previewStep &&
                          dayEmailRows.map((r) => {
                            const previewRecipient = smartleadPreview?.recipients.find(
                              (pr) =>
                                pr.contact_id === r.contact_id ||
                                (pr.recipient_kind === "general" && r.is_general),
                            );
                            if (!previewRecipient || !smartleadPreview) {
                              return null;
                            }
                            return (
                              <EmailPreviewCard
                                key={`email-${r.contact_id ?? "general"}`}
                                recipient={previewRecipient}
                                step={previewStep}
                                sample={smartleadPreview.sample_used}
                                senderPool={smartleadPreview.sender_pool}
                                pdfConfigured={programPdfAttachment != null}
                              />
                            );
                          })}
                        {hasEmailStep && dayEmailRows.length === 0 && (
                          <p className="text-xs italic text-gray-400">
                            No email recipients selected for this day.
                          </p>
                        )}

                        {hasPhoneStep && dayCallRows.length > 0 && script && (
                          <div className="space-y-2 rounded-md border border-amber-200 bg-white">
                            <header className="bg-amber-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                              Call script — {dayCallRows.length} callable
                            </header>
                            <div className="space-y-2 px-3 py-2">
                              <ul className="space-y-1 rounded-md bg-amber-50/50 px-2.5 py-1.5 text-[11px] text-amber-900">
                                {dayCallRows.map((r) => (
                                  <li key={`call-${r.contact_id ?? "general"}`}>
                                    ☎ Will call <strong>{r.name}</strong>
                                    {r.role && ` (${r.role})`}
                                    {" · "}
                                    <span className="font-mono">{r.phone}</span>
                                  </li>
                                ))}
                              </ul>
                              <CallScriptBlock
                                label={`Day ${d.day} script (shared by all callers above)`}
                                script={script.script}
                              />
                            </div>
                          </div>
                        )}
                        {hasPhoneStep && dayCallRows.length === 0 && (
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
          </section>
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
                submitting || !pdfConfigured || (queuedEmails === 0 && queuedCalls === 0)
              }
              title={!pdfConfigured ? "No program PDF configured for this campus." : undefined}
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

/**
 * v9.x Smartlead-native preview. Renders WHAT WILL BE SENT — per-recipient
 * roster (with computed salutations), Day 0/3/7 schedule, and a rendered
 * preview of each step with sample substitutions taken from this row's
 * first Named Contact (or "Hello," + "there" when no named contacts
 * exist).
 *
 * Stays a panel rather than replacing the existing variant editors so
 * admin can still cross-reference the Resend-shape body during the
 * transition. A small note clarifies that in Smartlead mode the variant
 * editors are reference-only.
 */
/**
 * Substitute Smartlead `{{...}}` merge tags client-side so admin sees the
 * exact rendering for ANY recipient (not just the server-sampled default).
 * Mirrors what Smartlead does per-lead at send time:
 *
 *   {{salutation}}    → recipient.salutation     ("Hello" / "Hi Susan" / "Dear Dr. Jones")
 *   {{first_name}}    → recipient first_name     (empty for General Contact)
 *   {{company_name}}  → preview.sample_used.company
 *   {{campus}}        → preview.sample_used.campus
 *
 * Per-recipient substitution lets admin click each recipient and see
 * "what THAT lead will receive" — fulfilling the General Contact + Specific
 * Contact preview parity requirement.
 */
function substituteSmartleadMergeTags(
  text: string,
  recipient: SmartleadPreviewSnapshot["recipients"][number],
  sample: SmartleadPreviewSnapshot["sample_used"],
): string {
  const firstName =
    recipient.recipient_kind === "named"
      ? recipient.salutation.replace(/^(Hi|Dear)\s+(Dr\.\s+|Prof\.\s+)?/, "").split(/\s+/)[0]
      : "";
  return text
    .replace(/\{\{\s*salutation\s*\}\}/g, recipient.salutation)
    .replace(/\{\{\s*first_name\s*\}\}/g, firstName)
    .replace(/\{\{\s*company_name\s*\}\}/g, sample.company)
    .replace(/\{\{\s*campus\s*\}\}/g, sample.campus);
}


/**
 * v9.x cadence-first email card. One per recipient × email day. Renders the
 * exact subject + body that Smartlead will send to THIS recipient on THIS
 * day, using per-lead `{{...}}` substitution. Replaces the standalone
 * Smartlead preview panel — the cadence accordions now ARE the preview.
 *
 * Lives next to the day's call script editor in the per-day accordion so
 * admin sees "Day N: email to X, email to Y, call to X, call to Y" as one
 * grouped block, not three separate sections of the modal.
 */
function EmailPreviewCard({
  recipient,
  step,
  sample,
  senderPool,
  pdfConfigured,
}: {
  recipient: SmartleadPreviewSnapshot["recipients"][number];
  step: SmartleadPreviewSnapshot["steps"][number];
  sample: SmartleadPreviewSnapshot["sample_used"];
  senderPool: string[];
  pdfConfigured: boolean;
}) {
  const subject = substituteSmartleadMergeTags(step.subject_template, recipient, sample);
  const bodyHtml = substituteSmartleadMergeTags(step.body_html_template, recipient, sample);
  return (
    <div className="rounded-md border border-primary-200 bg-white">
      <header className="bg-primary-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary-800">
        {recipient.recipient_kind === "general" ? "✉ Email to org" : "✉ Email to named"}
        {" — "}
        <span className="normal-case text-primary-900">{recipient.name}</span>
        {recipient.role && (
          <span className="ml-1.5 normal-case text-primary-700">
            ({recipient.role})
          </span>
        )}
      </header>
      <div className="space-y-2 px-3 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-600">
          <span>
            To:{" "}
            <span className="font-mono text-gray-800">{recipient.email}</span>
          </span>
          <span>
            From:{" "}
            <span className="text-gray-800">
              {senderPool.length > 0 ? senderPool.join(" / ") : "Smartlead mailbox pool"}
            </span>
          </span>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Subject
          </p>
          <p className="mt-0.5 text-sm font-medium text-gray-900">{subject}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Body — what {recipient.name} will see
          </p>
          <div
            className="mt-1 max-h-64 overflow-y-auto rounded border border-gray-200 bg-gray-50 p-2.5 text-[12px] leading-snug"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        </div>
        <p className="text-[10px] text-gray-500">
          Variables substituted: {"{{salutation}}"} → {recipient.salutation} ·{" "}
          {"{{company_name}}"} → {sample.company} · {"{{campus}}"} → {sample.campus}
          {recipient.recipient_kind === "named" && (
            <>
              {" · "}
              {"{{first_name}}"} → {recipient.salutation.replace(/^(Hi|Dear)\s+(Dr\.\s+|Prof\.\s+)?/, "").split(/\s+/)[0]}
            </>
          )}
        </p>
        <p className="text-[10px] text-gray-500">
          Program PDF:{" "}
          {pdfConfigured ? (
            <span className="text-gray-700">linked in the body</span>
          ) : (
            <span className="text-amber-700">
              not configured for this campus
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
