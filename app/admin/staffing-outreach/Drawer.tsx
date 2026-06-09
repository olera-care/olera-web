"use client";

/**
 * Staffing Outreach V2 drawer.
 *
 * Sections (matching the V2 5-tab workflow):
 *   1. ProviderSummary    — header with status badge, contact info, engagement signals
 *   2. ToQueueSection     — email preview + "Start Sequence" button (queued status)
 *   3. SequencingSection  — sequence timeline, engagement indicators (sequencing status)
 *   4. NeedsCallSection   — call disposition + "Update & Restart Sequence" (needs_call, consented)
 *   5. EnrolledSection    — success state (enrolled, activated)
 *   6. ClosedSection      — closed/bounced states with reopen options
 *   7. HistorySection     — chronological touchpoint timeline
 *
 * Enrollment path: Provider receives automated emails → schedules interview via MedJobs →
 * accepts T&C during interview → auto-enrolled via interview API.
 *
 * After any action, the parent page refetches the queue and auto-advances
 * to the next provider in the same tab.
 */

import { useCallback, useEffect, useState } from "react";
import {
  getServiceArea,
  type DrawerContext,
  type StaffingTouchpoint,
  type TouchpointType,
  type StaffingStatus,
} from "@/lib/staffing-outreach/types";

interface DrawerProps {
  outreachId: string;
  onClose: () => void;
  onAction: (refreshed: DrawerContext | null) => void;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────

const STATUS_LABELS: Record<StaffingStatus, string> = {
  // V2 statuses
  queued: "Not Started",
  sequencing: "Sending",
  needs_call: "Needs Follow-up",
  consented: "Needs Follow-up",
  activated: "Active Partner",
  enrolled: "Active Partner",
  bounced: "Closed",
  closed: "Closed",
  // Legacy statuses (map to V2 labels)
  pre_call_outreach: "Sending",
  calling: "Needs Follow-up",
  connected_no_consent: "Needs Follow-up",
  nurturing: "Sending",
  do_not_contact: "Closed",
  wrong_number: "Closed",
};

function StatusBadge({ status }: { status: StaffingStatus }) {
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
      {label}
    </span>
  );
}


// ── Confirmation Dialog ───────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Handle Escape key to close dialog (and stop propagation to prevent drawer close)
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
    };
    // Use capture phase to intercept before drawer's listener
    window.addEventListener("keydown", handleEscape, true);
    return () => window.removeEventListener("keydown", handleEscape, true);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              confirmVariant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-900 hover:bg-gray-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast Error ───────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[70] flex items-center gap-3 rounded-lg bg-red-600 px-4 py-3 text-white shadow-lg">
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="text-white/80 hover:text-white">
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────

export function Drawer({ outreachId, onClose, onAction }: DrawerProps) {
  const [ctx, setCtx] = useState<DrawerContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load drawer context (and claim the row for 60 min)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        // Claim first (best-effort)
        await fetch(`/api/admin/staffing-outreach/${outreachId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "claim" }),
        });
        const res = await fetch(`/api/admin/staffing-outreach/${outreachId}`);
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

  const handleAction = useCallback(
    async (action: string, payload: Record<string, unknown> = {}) => {
      const res = await fetch(`/api/admin/staffing-outreach/${outreachId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }
      return data as DrawerContext;
    },
    [outreachId],
  );

  const handleAdvance = useCallback(
    async (action: string, payload: Record<string, unknown> = {}) => {
      try {
        const refreshed = await handleAction(action, payload);
        // Release claim before advancing
        await fetch(`/api/admin/staffing-outreach/${outreachId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "release" }),
        });
        onAction(refreshed);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      }
    },
    [handleAction, onAction, outreachId],
  );

  // For actions that should refresh the drawer but NOT advance to next provider
  const handleRefresh = useCallback(
    async (action: string, payload: Record<string, unknown> = {}) => {
      try {
        const refreshed = await handleAction(action, payload);
        setCtx(refreshed); // Update local state, stay on same provider
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      }
    },
    [handleAction],
  );

  const clearError = useCallback(() => setError(null), []);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="Close drawer"
      />
      {/* Panel */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
          {ctx ? (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {ctx.provider.slug ? (
                  <a
                    href={`https://olera.care/provider/${ctx.provider.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-base font-semibold text-gray-900 hover:text-gray-600"
                  >
                    {ctx.provider.provider_name}
                  </a>
                ) : (
                  <h2 className="truncate text-base font-semibold text-gray-900">
                    {ctx.provider.provider_name}
                  </h2>
                )}
                <StatusBadge status={ctx.outreach.status} />
              </div>
              <p className="mt-0.5 truncate text-sm text-gray-500">
                {ctx.provider.provider_category}
                {ctx.provider.city && ` · ${ctx.provider.city}, ${ctx.provider.state}`}
              </p>
              {/* Show sequence email if available */}
              {(ctx.outreach.sequence_email || ctx.outreach.research_data?.general_email || ctx.provider.email) && (
                <p className="mt-0.5 truncate text-sm text-blue-600">
                  {ctx.outreach.sequence_email || ctx.outreach.research_data?.general_email || ctx.provider.email}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Loading...</p>
          )}
          <button
            onClick={onClose}
            className="-mr-2 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            </div>
          ) : error && !ctx ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Failed to load</p>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
            </div>
          ) : ctx ? (
            <div className="space-y-6">
              <ProviderSummary ctx={ctx} />
              {/* V2 Sections */}
              <ToQueueSection ctx={ctx} onAction={handleAction} onAdvance={handleAdvance} setError={setError} />
              <SequencingSection ctx={ctx} onAdvance={handleAdvance} setError={setError} />
              <NeedsCallSection ctx={ctx} onAdvance={handleAdvance} setError={setError} />
              {/* Legacy Sections - for providers still in old workflow statuses */}
              {/* NewSection removed - replaced by ToQueueSection for V2 */}
              <NurturingSection />
              <CallSection />
              {/* Terminal state sections */}
              {/* Note: ConsentedSection removed - now handled by NeedsCallSection */}
              {/* Note: ActivatedSection removed - legacy status, mapped to Enrolled tab */}
              <EnrolledSection ctx={ctx} />
              <ClosedSection ctx={ctx} onAdvance={handleAdvance} setError={setError} />
              <HistorySection touchpoints={ctx.touchpoints} />
            </div>
          ) : null}
        </div>
      </aside>

      {/* Toast error display */}
      {error && <Toast message={error} onClose={clearError} />}
    </>
  );
}

// ── Provider summary (top of drawer) ─────────────────────────────────────

function ProviderSummary({ ctx }: { ctx: DrawerContext }) {
  const [phoneCopied, setPhoneCopied] = useState(false);

  const copyPhone = async () => {
    if (!ctx.provider.phone) return;
    try {
      await navigator.clipboard.writeText(ctx.provider.phone);
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    } catch {
      // Silently fail
    }
  };

  const verifiedContact = ctx.contacts.find((c) => c.is_primary) || ctx.contacts[0];

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      {/* Contact actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        {ctx.provider.phone && (
          <div className="inline-flex items-center rounded-xl bg-gray-900 shadow-sm">
            <a
              href={`tel:${ctx.provider.phone}`}
              className="inline-flex items-center gap-2 rounded-l-xl px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              <PhoneIcon className="h-4 w-4" />
              {ctx.provider.phone}
            </a>
            <button
              onClick={copyPhone}
              className="inline-flex items-center rounded-r-xl border-l border-gray-700 px-3 py-2.5 text-white transition-colors hover:bg-gray-800"
              title="Copy phone number"
            >
              {phoneCopied ? (
                <CheckIcon className="h-4 w-4 text-emerald-400" />
              ) : (
                <CopyIcon className="h-4 w-4 opacity-80" />
              )}
            </button>
          </div>
        )}
        {ctx.provider.website && (
          <a
            href={ctx.provider.website.startsWith("http") ? ctx.provider.website : `https://${ctx.provider.website}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
            Website
          </a>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-4 flex flex-wrap items-center gap-x-2 text-sm text-gray-500">
        <span className="font-medium text-gray-700">{ctx.batch.university_name}</span>
        <span className="text-gray-300">·</span>
        <span>{ctx.outreach.attempts_count} attempts</span>
        {ctx.outreach.last_engagement_at && (
          <>
            <span className="text-gray-300">·</span>
            <span>Active {new Date(ctx.outreach.last_engagement_at).toLocaleDateString()}</span>
          </>
        )}
      </div>

      {/* Verified contact */}
      {verifiedContact && (
        <div className="mt-4 rounded-xl bg-emerald-50/70 px-4 py-3">
          <p className="text-sm font-medium text-emerald-800">
            {verifiedContact.name}
            {verifiedContact.role && (
              <span className="ml-1.5 font-normal text-emerald-600">· {verifiedContact.role}</span>
            )}
          </p>
          <p className="mt-0.5 text-sm text-emerald-700">
            {verifiedContact.email}
            {verifiedContact.phone && <span className="ml-3">{verifiedContact.phone}</span>}
          </p>
        </div>
      )}
    </section>
  );
}

// ── Section 1: Research & pre-call ───────────────────────────────────────

/**
 * Generate initial outreach email plain text.
 */
function generateInitialEmailText(universityName: string, serviceArea: string) {
  return {
    subject: `${universityName} Student Caregiver Program`,
    body: `Hello

I am hoping to reach the person who handles hiring to share more information on a pilot ${universityName} Student Caregiver Program.

My name is Dr. Logan DuBose. I am a physician-researcher funded by the National Institutes of Health (NIH) Small Business Innovation Research (SBIR) Program and Chief Research Officer at Olera. I am currently working on a pilot program to match pre-nursing and pre-medical students with care agency jobs so they can help improve community care worker turnover and shortages, while gaining critical experience for their future careers as doctors and nurses.

Would you be interested in hearing more about this program? In pilot testing in the ${serviceArea}, I have seen potential for it to be an evergreen pipeline delivering vetted pre-health ${universityName} students seeking employment in caregiver roles.

Some materials to consider:
• Pilot website here (demo profiles): https://olera.care/medjobs/providers
• Demo video I made here: https://www.youtube.com/watch?v=ParY1tGaiew (~7 minutes long)
• Recent system improvements since the last pilot include a more robust candidate vetting and scheduling system, and the price point potentially being lowered to $50/month (however, for earlier adopters, I am not charging anything for a period of time, and instead would appreciate feedback and reviews of the system)
• Goal to send 5 new candidates a week with 1-3 solid hires per month in perpetuity

Please let me know if you have any questions, would like to meet, or if there is any interest in restarting the program. If I can get your team's buy-in, then I will begin recruitment for you at ${universityName} pre-nursing and pre-medical organizations this month (and could be sending vetted candidates for summer caregiving roles ASAP)!

Take care!

Best,
Logan`,
  };
}

/**
 * Generate follow-up email plain text.
 */
function generateFollowUpEmailText(universityName: string) {
  return {
    subject: `Quick follow-up – ${universityName} Student Program`,
    body: `Hi,

Just wanted to follow up in case this got buried.

We're starting to connect agencies with pre-nursing students from ${universityName} who are actively looking for caregiving roles.

Would it make sense to share a quick overview or schedule a brief call?

Best,
Logan`,
  };
}

/**
 * Build Gmail compose URL with pre-filled fields.
 */
function buildGmailComposeUrl(opts: { to: string; subject: string; body: string }): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: opts.to,
    su: opts.subject,
    body: opts.body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

// ── V2 Sections ────────────────────────────────────────────────────────────

/**
 * ToQueueSection - V2: shown for providers in "To Queue" tab (status: queued)
 * Shows email preview and "Start Email Sequence" button to trigger Resend automation
 */
function ToQueueSection({
  ctx,
  onAction,
  onAdvance,
  setError,
}: {
  ctx: DrawerContext;
  onAction: (action: string, payload?: Record<string, unknown>) => Promise<DrawerContext>;
  onAdvance: (action: string, payload?: Record<string, unknown>) => Promise<void>;
  setError: (err: string | null) => void;
}) {
  const [recipientEmail, setRecipientEmail] = useState(
    ctx.provider.email || ctx.outreach.research_data.general_email || "",
  );
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Generate email preview content
  const universityName = ctx.batch.university_name;
  const serviceArea = getServiceArea(ctx.batch.university_slug);
  const email1 = generateInitialEmailText(universityName, serviceArea);
  const email2 = generateFollowUpEmailText(universityName);

  // Only show for queued status (To Queue tab)
  if (ctx.outreach.status !== "queued") {
    return null;
  }

  const saveResearch = async () => {
    try {
      await onAction("update_research", {
        research: { general_email: recipientEmail.trim() },
      });
    } catch {
      // Silently fail on blur save
    }
  };

  const handleStartSequence = async () => {
    if (!recipientEmail.trim()) {
      setError("Enter a recipient email first.");
      return;
    }
    setSaving(true);
    try {
      await onAdvance("start_sequence", { recipientEmail: recipientEmail.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start sequence");
    } finally {
      setSaving(false);
    }
  };

  const handleSkipToCall = async () => {
    setSaving(true);
    try {
      await onAdvance("move_to_needs_call");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to skip to call");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <SectionHeader title="Start Email Sequence" />
      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        {/* Recipient email field */}
        <Field
          label="Recipient Email"
          placeholder="info@agency.com"
          value={recipientEmail}
          onChange={setRecipientEmail}
          onBlur={saveResearch}
          type="email"
        />

        {/* Email Preview Accordion */}
        <button
          onClick={() => setShowPreview((s) => !s)}
          className="flex w-full items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100"
        >
          <span className="text-sm text-gray-600">Preview emails</span>
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showPreview ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showPreview && (
          <div className="space-y-4 rounded-xl bg-gray-50 p-4">
            {/* Email 1 */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-400">Email 1 · Immediate</p>
              <p className="text-sm font-medium text-gray-800">{email1.subject}</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600 line-clamp-4">
                {email1.body.slice(0, 250)}...
              </p>
            </div>
            <div className="border-t border-gray-200" />
            {/* Email 2 */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-400">Email 2 · After 3 days</p>
              <p className="text-sm font-medium text-gray-800">{email2.subject}</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                {email2.body.slice(0, 150)}...
              </p>
            </div>
          </div>
        )}

        {/* Start Sequence Button */}
        <button
          onClick={handleStartSequence}
          disabled={saving || !recipientEmail.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {saving ? "Starting..." : "Start Email Sequence"}
        </button>

        {/* Skip to call option */}
        <button
          onClick={handleSkipToCall}
          disabled={saving}
          className="w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50"
        >
          Skip to calling instead
        </button>
      </div>
    </section>
  );
}

/**
 * SequencingSection - V2: shown for providers in "Sequencing" tab
 * Shows sequence timeline and engagement indicators
 */
function SequencingSection({
  ctx,
  onAdvance,
  setError,
}: {
  ctx: DrawerContext;
  onAdvance: (action: string, payload?: Record<string, unknown>) => Promise<void>;
  setError: (err: string | null) => void;
}) {
  const [moving, setMoving] = useState(false);

  // Show for all statuses that appear in the Sequencing tab
  // V2: sequencing | Legacy: pre_call_outreach, nurturing
  const sequencingStatuses = new Set(["sequencing", "pre_call_outreach", "nurturing"]);
  if (!sequencingStatuses.has(ctx.outreach.status)) {
    return null;
  }

  // Determine if this is a V2 (Resend automation) or legacy (Gmail) provider
  const isV2Sequence = !!ctx.outreach.sequence_started_at;

  // V2: Use sequence tracking fields
  const sequenceStarted = ctx.outreach.sequence_started_at;
  const email1Sent = ctx.outreach.email1_sent_at;
  const email2Sent = ctx.outreach.email2_sent_at;

  // Legacy: Check touchpoints for email status
  const legacyInitialEmail = ctx.touchpoints.find((t) => t.type === "pre_call_email_sent");
  const legacyFollowUpEmail = ctx.touchpoints.find((t) => t.type === "follow_up_email_sent");

  // Check for engagement from touchpoints (works for both V2 and legacy)
  const hasOpened = ctx.touchpoints.some((t) => t.type === "email_opened");
  const hasClicked = ctx.touchpoints.some((t) => t.type === "email_clicked");
  const hasReplied = ctx.touchpoints.some((t) => t.type === "reply_received");

  // Calculate days since sequence started (V2 only)
  const daysSinceStart = sequenceStarted
    ? Math.floor((Date.now() - new Date(sequenceStarted).getTime()) / 86400_000)
    : 0;

  const handleMoveToNeedsCall = async () => {
    setMoving(true);
    try {
      await onAdvance("move_to_needs_call");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to move");
    } finally {
      setMoving(false);
    }
  };

  const handleMarkClosed = async () => {
    const confirmed = window.confirm(
      "Mark this provider as closed? This will stop the email sequence."
    );
    if (!confirmed) return;

    setMoving(true);
    try {
      await onAdvance("mark_closed", { reason: "Not interested during sequence" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to close");
    } finally {
      setMoving(false);
    }
  };

  return (
    <section>
      <SectionHeader title="Sequence Progress" />
      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        {isV2Sequence ? (
          /* V2: Resend automation sequence timeline */
          <div className="space-y-3">
            {/* Email 1 */}
            <div className="flex items-center gap-3">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                email1Sent ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {email1Sent ? "✓" : "1"}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">Initial outreach</p>
                <p className="text-xs text-gray-400">
                  {email1Sent
                    ? `Sent ${new Date(email1Sent).toLocaleDateString()}`
                    : "Pending"}
                </p>
              </div>
              {hasOpened && (
                <span className="text-xs text-gray-500">Opened</span>
              )}
            </div>

            {/* Wait indicator */}
            <p className="pl-9 text-xs text-gray-400">3 day wait</p>

            {/* Email 2 */}
            <div className="flex items-center gap-3">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                email2Sent ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {email2Sent ? "✓" : "2"}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">Follow-up</p>
                <p className="text-xs text-gray-400">
                  {email2Sent
                    ? `Sent ${new Date(email2Sent).toLocaleDateString()}`
                    : daysSinceStart >= 3
                    ? "Scheduled today"
                    : `In ${3 - daysSinceStart} days`}
                </p>
              </div>
              {hasClicked && (
                <span className="text-xs text-gray-500">Clicked</span>
              )}
            </div>
          </div>
        ) : (
          /* Legacy: Manual email flow */
          <div className="space-y-3">
            {legacyInitialEmail ? (
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">
                  ✓
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">Initial email sent</p>
                  <p className="text-xs text-gray-400">
                    {new Date(legacyInitialEmail.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No emails sent yet</p>
            )}
            {legacyFollowUpEmail && (
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">
                  ✓
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">Follow-up sent</p>
                  <p className="text-xs text-gray-400">
                    {new Date(legacyFollowUpEmail.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Engagement Summary */}
        {(hasOpened || hasClicked || hasReplied) && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3">
            <span className="text-sm font-medium text-emerald-800">Engaged:</span>
            {hasOpened && <span className="text-sm text-emerald-700">Opened</span>}
            {hasClicked && <span className="text-sm text-emerald-700">Clicked</span>}
            {hasReplied && <span className="text-sm text-emerald-700">Replied</span>}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleMoveToNeedsCall}
            disabled={moving}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            {moving && (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            Move to Follow-up
          </button>
          <button
            onClick={handleMarkClosed}
            disabled={moving}
            className="text-sm text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * NeedsCallSection - V2: shown for providers in "Needs Call" tab
 * Primary action: "Update Email & Restart Sequence" - captures correct email and auto-starts sequence (→ Sequencing)
 * Also handles consented status (legacy - shows existing contact info)
 */
function NeedsCallSection({
  ctx,
  onAdvance,
  setError,
}: {
  ctx: DrawerContext;
  onAdvance: (action: string, payload?: Record<string, unknown>) => Promise<void>;
  setError: (err: string | null) => void;
}) {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showScript, setShowScript] = useState(true);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [activeAction, setActiveAction] = useState<TouchpointType | "restart" | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ type: TouchpointType; title: string; message: string } | null>(null);

  const isBusy = activeAction !== null;

  // Show for all statuses in the Needs Call tab
  // V2: needs_call, consented | Legacy: calling, connected_no_consent
  const needsCallStatuses = new Set(["needs_call", "consented", "calling", "connected_no_consent"]);
  if (!needsCallStatuses.has(ctx.outreach.status)) {
    return null;
  }

  const disposition = async (type: TouchpointType) => {
    setActiveAction(type);
    try {
      await onAdvance("disposition", { type });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Disposition failed");
    } finally {
      setActiveAction(null);
    }
  };

  const handleDispositionWithConfirm = (type: TouchpointType) => {
    if (type === "manual_dnc") {
      setConfirmDialog({
        type,
        title: "Mark as Do Not Contact?",
        message: "This will close the provider and prevent any future outreach. This action can be undone later if needed.",
      });
    } else {
      disposition(type);
    }
  };

  // Update email and auto-start the sequence (goes directly to Sequencing)
  const submitUpdateAndRestart = async () => {
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setActiveAction("restart");
    try {
      await onAdvance("restart_sequence", { email: email.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to restart sequence");
    } finally {
      setActiveAction(null);
    }
  };

  // Check for prior engagement
  const hasOpened = ctx.touchpoints.some((t) => t.type === "email_opened");
  const hasClicked = ctx.touchpoints.some((t) => t.type === "email_clicked");

  // Check for existing contact (for legacy consented status)
  const verifiedContact = ctx.contacts.find((c) => c.is_primary) || ctx.contacts[0];
  const isConsented = ctx.outreach.status === "consented";

  return (
    <section>
      <SectionHeader title="Call Provider" />
      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        {/* Legacy consented status - show existing contact info */}
        {isConsented && verifiedContact && (
          <div className="rounded-xl bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-800">
              Legacy: Contact captured via old flow
            </p>
            <p className="text-sm text-amber-700">
              {verifiedContact.name} · {verifiedContact.email}
            </p>
            <p className="mt-1 text-xs text-amber-600">
              Provider will auto-enroll when they accept T&C via MedJobs interview.
            </p>
          </div>
        )}

        {/* Engagement hint */}
        {(hasOpened || hasClicked) && (
          <p className="text-sm text-gray-500">
            Previously engaged: {hasOpened && "opened emails"}{hasOpened && hasClicked && ", "}{hasClicked && "clicked links"}
          </p>
        )}

        {/* Call Script */}
        <div className="rounded-xl bg-gray-50">
          <button
            onClick={() => setShowScript((s) => !s)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm text-gray-600">Call script</span>
            <span className="text-xs text-gray-400">{showScript ? "Hide" : "Show"}</span>
          </button>
          {showScript && (
            <p className="border-t border-gray-200 px-4 py-3 text-sm leading-relaxed text-gray-700">
              "Hi, I'm calling on behalf of Dr. Logan DuBose. He oversees a program
              for pre-nursing students at <strong>{ctx.batch.university_name}</strong> that
              connects students with open caregiving roles at local agencies."
            </p>
          )}
        </div>

        {/* Primary action: Update Email & Restart Sequence */}
        <button
          onClick={() => setShowUpdateForm((s) => !s)}
          disabled={isBusy}
          className="flex w-full items-center justify-center rounded-xl bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
        >
          {showUpdateForm ? "Hide form" : "Update Email & Restart Sequence"}
        </button>

        {/* Update & Restart form */}
        {showUpdateForm && (
          <div className="space-y-3 rounded-xl bg-blue-50/50 p-4">
            <p className="text-sm text-gray-600">
              Got the correct email on the call? Enter it here to restart the automated email sequence.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="correct@agency.com"
                type="email"
              />
              <Field label="Phone (optional)" value={phone} onChange={setPhone} placeholder="(555) 123-4567" />
            </div>
            <button
              onClick={submitUpdateAndRestart}
              disabled={isBusy || !email.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
            >
              {activeAction === "restart" && <Spinner />}
              Update & Restart Sequence
            </button>
          </div>
        )}

        {/* Call dispositions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => disposition("call_no_answer")}
            disabled={isBusy}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {activeAction === "call_no_answer" ? <Spinner size="sm" /> : "No Answer"}
          </button>
          <button
            onClick={() => disposition("call_voicemail")}
            disabled={isBusy}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {activeAction === "call_voicemail" ? <Spinner size="sm" /> : "Voicemail"}
          </button>
          <button
            onClick={() => disposition("call_not_interested")}
            disabled={isBusy}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {activeAction === "call_not_interested" ? <Spinner size="sm" /> : "Not Interested"}
          </button>
        </div>

        {/* Close action */}
        <button
          onClick={() => handleDispositionWithConfirm("manual_dnc")}
          disabled={isBusy}
          className="w-full text-center text-sm text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
        >
          {activeAction === "manual_dnc" ? "Closing..." : "Close this provider"}
        </button>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          open={confirmDialog !== null}
          title={confirmDialog?.title ?? ""}
          message={confirmDialog?.message ?? ""}
          confirmLabel="Confirm"
          confirmVariant="danger"
          onConfirm={() => {
            if (confirmDialog) disposition(confirmDialog.type);
            setConfirmDialog(null);
          }}
          onCancel={() => setConfirmDialog(null)}
        />
      </div>
    </section>
  );
}

// ── Legacy Sections (for backwards compatibility) ──────────────────────────

/**
 * NewSection - LEGACY: shown for providers in old "Initial Contact" workflow
 * Actions: Research, send initial email → moves to Nurturing
 */
function NewSection({
  ctx,
  onAction,
  onAdvance,
  setError,
}: {
  ctx: DrawerContext;
  onAction: (action: string, payload?: Record<string, unknown>) => Promise<DrawerContext>;
  onAdvance: (action: string, payload?: Record<string, unknown>) => Promise<void>;
  setError: (err: string | null) => void;
}) {
  const [recipientEmail, setRecipientEmail] = useState(
    ctx.provider.email || ctx.outreach.research_data.general_email || "",
  );
  const [contactFormUrl, setContactFormUrl] = useState(
    ctx.outreach.research_data.contact_form_url ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate email content
  const universityName = ctx.batch.university_name;
  const serviceArea = getServiceArea(ctx.batch.university_slug);
  const initialEmail = generateInitialEmailText(universityName, serviceArea);
  const [emailBody, setEmailBody] = useState(initialEmail.body);

  // Only show for queued status (New tab)
  if (ctx.outreach.status !== "queued") {
    return null;
  }

  const saveResearch = async () => {
    setSaving(true);
    try {
      await onAction("update_research", {
        research: { general_email: recipientEmail, contact_form_url: contactFormUrl },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const openGmail = () => {
    if (!recipientEmail.trim()) {
      setError("Enter a recipient email first.");
      return;
    }
    const url = buildGmailComposeUrl({
      to: recipientEmail.trim(),
      subject: initialEmail.subject,
      body: emailBody,
    });
    window.open(url, "_blank");
  };

  const copyToClipboard = async () => {
    const fullText = `Subject: ${initialEmail.subject}\n\n${emailBody}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  };

  const markInitialSent = async () => {
    if (!recipientEmail.trim()) {
      setError("Enter a recipient email first.");
      return;
    }
    setSaving(true);
    try {
      // Save email to research_data first
      await onAction("update_research", {
        research: { general_email: recipientEmail.trim(), contact_form_url: contactFormUrl },
      });
      // Log the touchpoint and move to Nurturing tab
      await onAdvance("log_email_sent", {
        emailType: "initial",
        recipientEmail: recipientEmail.trim(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to log email");
      setSaving(false);
    }
  };

  return (
    <section>
      <SectionHeader title="Send Initial Email" />
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
        {/* Recipient email field */}
        <Field
          label="To"
          placeholder="info@agency.com"
          value={recipientEmail}
          onChange={setRecipientEmail}
          onBlur={saveResearch}
          type="email"
        />

        {/* Subject */}
        <div className="border-t border-gray-100 pt-3">
          <p className="mb-1 text-xs font-medium text-gray-600">Subject</p>
          <p className="text-sm text-gray-800">{initialEmail.subject}</p>
        </div>

        {/* Email body */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Email Body</label>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            rows={12}
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openGmail}
            disabled={!recipientEmail.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Open in Gmail
          </button>
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <CopyIcon className="h-4 w-4" />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Mark as sent (moves to Nurturing) */}
        <button
          onClick={markInitialSent}
          disabled={saving || !recipientEmail.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <CheckIcon className="h-4 w-4" />
          )}
          {saving ? "Sending..." : "Mark Initial Email as Sent"}
        </button>

        {/* Contact form (optional) */}
        <div className="space-y-2 border-t border-gray-100 pt-3">
          <Field
            label="Contact form URL (optional)"
            placeholder="https://agency.com/contact"
            value={contactFormUrl}
            onChange={setContactFormUrl}
            onBlur={saveResearch}
          />
          {contactFormUrl.trim() && (
            <a
              href={contactFormUrl.trim()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Open form
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

// NurturingSection (LEGACY - disabled)
// This section is now disabled - V2 sections handle all statuses
// - Sequencing tab: SequencingSection handles sequencing, pre_call_outreach, nurturing
// - Needs Call tab: NeedsCallSection handles needs_call, calling, connected_no_consent
function NurturingSection() {
  return null;
}

// ── Section 2: Call (LEGACY - disabled) ──────────────────────────────────
// This section is now disabled - V2 NeedsCallSection handles all calling statuses
// NeedsCallSection now handles: needs_call, calling, connected_no_consent
function CallSection() {
  return null;
}

// ── Terminal State Sections ───────────────────────────────────────────────

/**
 * EnrolledSection - shown for enrolled AND activated providers (Enrolled tab)
 * Shows success state for enrolled, pending state for activated (legacy status)
 */
function EnrolledSection({ ctx }: { ctx: DrawerContext }) {
  const status = ctx.outreach.status;
  // Show for both enrolled and activated (activated is legacy - clicked magic link)
  if (status !== "enrolled" && status !== "activated") return null;

  const isActivated = status === "activated";
  const enrollmentTouchpoint = ctx.touchpoints.find((t) => t.type === "system_enrolled");
  const activationTouchpoint = ctx.touchpoints.find((t) => t.type === "system_activated");
  const relevantDate = isActivated ? activationTouchpoint?.created_at : enrollmentTouchpoint?.created_at;
  const verifiedContact = ctx.contacts.find((c) => c.is_primary) || ctx.contacts[0];

  return (
    <section>
      <SectionHeader title={isActivated ? "Awaiting T&C" : "Enrolled"} />
      <div className={`rounded-2xl border border-gray-100 p-5 shadow-sm ${isActivated ? "bg-blue-50/50" : "bg-emerald-50/50"}`}>
        {/* Status indicator */}
        <div className="mb-4 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isActivated ? "bg-blue-500" : "bg-emerald-500"}`}>
            {isActivated ? (
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">
              {isActivated ? "Clicked enrollment link" : "Successfully enrolled"}
            </p>
            {isActivated && (
              <p className="text-xs text-gray-500">Waiting for T&C acceptance</p>
            )}
            {relevantDate && !isActivated && (
              <p className="text-xs text-gray-500">
                {new Date(relevantDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        {/* Contact details */}
        {verifiedContact && (
          <div className="rounded-xl bg-white px-4 py-3">
            <p className="text-sm font-medium text-gray-800">{verifiedContact.name}</p>
            <p className="text-sm text-gray-500">
              {verifiedContact.email}
              {verifiedContact.phone && <span className="ml-3">{verifiedContact.phone}</span>}
            </p>
            {isActivated && relevantDate && (
              <p className="mt-1 text-xs text-gray-400">
                Clicked {new Date(relevantDate).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Note for activated status */}
        {isActivated && (
          <p className="mt-3 text-xs text-gray-500">
            Provider will auto-enroll when they accept T&C via MedJobs interview.
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * ClosedSection - shown for closed, bounced, do_not_contact and wrong_number statuses
 * Shows reason for closure and options to reopen (to Queue or to Needs Call)
 */
function ClosedSection({
  ctx,
  onAdvance,
  setError,
}: {
  ctx: DrawerContext;
  onAdvance: (action: string, payload?: Record<string, unknown>) => Promise<void>;
  setError: (err: string | null) => void;
}) {
  const [reopening, setReopening] = useState<"queue" | "call" | null>(null);
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const status = ctx.outreach.status;
  // V2: Also handle 'closed' and 'bounced' statuses
  const closedStatuses = ["do_not_contact", "wrong_number", "closed", "bounced"];
  if (!closedStatuses.includes(status)) return null;

  // Determine closure type
  const isBounced = status === "bounced";
  const isWrongNumber = status === "wrong_number";

  // Find relevant touchpoint for closure details
  const closureTouchpoint = ctx.touchpoints.find(
    (t) => t.type === "manual_dnc" || t.type === "call_wrong_number" || t.type === "email_bounced"
  );
  const autoClosureTouchpoint = ctx.touchpoints.find((t) => t.type === "system_auto_dnc");
  const relevantTouchpoint = closureTouchpoint || autoClosureTouchpoint;
  const closureDate = relevantTouchpoint?.created_at;
  const closureNotes = relevantTouchpoint?.notes;
  const isAutoClosed = !!autoClosureTouchpoint && !closureTouchpoint;

  const handleReopenToQueue = async () => {
    setReopening("queue");
    try {
      // Use onAdvance to close drawer and move to next provider after reopening
      await onAdvance("reopen_to_queue", { email: newEmail.trim() || undefined });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reopen");
      setReopening(null);
    }
  };

  const handleReopenToNeedsCall = async () => {
    setReopening("call");
    try {
      // Use onAdvance to close drawer and move to next provider after reopening
      await onAdvance("reopen", {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reopen");
      setReopening(null);
    }
  };

  // Determine reason text
  const getReason = () => {
    if (isBounced) return "Email bounced";
    if (isWrongNumber) return "Wrong number";
    if (isAutoClosed) return "Auto-closed after max attempts";
    return "Manually closed";
  };

  return (
    <section>
      <SectionHeader title="Closed" />
      <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 shadow-sm">
        {/* Status indicator */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{getReason()}</p>
            {closureDate && (
              <p className="text-xs text-gray-500">
                {new Date(closureDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Notes if any */}
        {closureNotes && (
          <div className="mb-4 rounded-xl bg-white px-4 py-3">
            <p className="text-sm text-gray-600">{closureNotes}</p>
          </div>
        )}

        {/* Reopen options */}
        {!showReopenForm ? (
          <div className="space-y-2">
            <button
              onClick={() => setShowReopenForm(true)}
              disabled={reopening !== null}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              Reopen to Queue
            </button>
            <button
              onClick={handleReopenToNeedsCall}
              disabled={reopening !== null}
              className="w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50"
            >
              {reopening === "call" ? "Reopening..." : "Reopen to Needs Call"}
            </button>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl bg-white p-4">
            <p className="text-sm text-gray-600">
              Restart the email sequence from the beginning. Optionally update the email address.
            </p>
            <Field
              label="Email (optional)"
              value={newEmail}
              onChange={setNewEmail}
              placeholder={ctx.outreach.research_data.general_email || "new@email.com"}
              type="email"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReopenToQueue}
                disabled={reopening !== null}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                {reopening === "queue" && <Spinner size="sm" />}
                {reopening === "queue" ? "Reopening..." : "Reopen to Queue"}
              </button>
              <button
                onClick={() => {
                  setShowReopenForm(false);
                  setNewEmail("");
                }}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Activity History ──────────────────────────────────────────────────────

function HistorySection({ touchpoints }: { touchpoints: StaffingTouchpoint[] }) {
  // Group touchpoints by date
  const groupedByDate = touchpoints.reduce((acc, tp) => {
    const date = new Date(tp.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(tp);
    return acc;
  }, {} as Record<string, StaffingTouchpoint[]>);

  return (
    <section>
      <SectionHeader title="Activity" />
      {touchpoints.length === 0 ? (
        <p className="text-sm text-gray-400">No activity yet</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([date, tps]) => (
            <div key={date}>
              <p className="mb-2 text-xs text-gray-400">{date}</p>
              <div className="space-y-1">
                {tps.map((t) => {
                  const payload = t.payload as Record<string, unknown> | undefined;

                  return (
                    <div key={t.id} className="flex items-start gap-3 py-1.5">
                      <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-300" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-gray-700">{humanType(t.type)}</span>
                          <span className="flex-shrink-0 text-xs text-gray-400">
                            {new Date(t.created_at).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {typeof payload?.recipientEmail === "string" && (
                          <p className="text-xs text-gray-400">{payload.recipientEmail}</p>
                        )}
                        {t.notes && (
                          <p className="text-sm text-gray-500">{t.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Small UI primitives ──────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
      {title}
    </h3>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
      />
    </label>
  );
}

function DispositionButton({
  children,
  onClick,
  disabled,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "primary" | "danger";
}) {
  const base = "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
      : variant === "danger"
      ? "border-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50";
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function Spinner({ size = "default" }: { size?: "sm" | "default" }) {
  const sizeClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <div className={`${sizeClass} animate-spin rounded-full border-2 border-current/30 border-t-current`} />
  );
}

function humanType(t: string): string {
  const map: Record<string, string> = {
    // V2 sequence events
    sequence_started: "Email sequence started",
    sequence_email1_sent: "Email 1 sent (initial)",
    sequence_email2_sent: "Email 2 sent (follow-up)",
    sequence_completed: "Email sequence completed",
    // Legacy events
    research_completed: "Research updated",
    pre_call_email_sent: "Pre-call email sent",
    follow_up_email_sent: "Follow-up email sent",
    contact_form_submitted: "Contact form submitted",
    fax_sent: "Fax sent",
    mail_sent: "Mail sent",
    call_no_answer: "Call: no answer",
    call_voicemail: "Call: voicemail",
    call_wrong_number: "Call: wrong number",
    call_connected_no_consent: "Call: connected, no consent",
    call_connected_consent: "Call: connected, consent given",
    call_not_interested: "Not interested",
    manual_dnc: "Marked: closed",
    email_pre_consent_a_sent: "Email: pre-consent A",
    email_pre_consent_b_sent: "Email: pre-consent B",
    email_post_consent_step1_sent: "Email: Step 1 (enrollment)",
    email_post_consent_step2_sent: "Email: Step 2",
    email_post_consent_step3_sent: "Email: Step 3",
    email_post_consent_step4_sent: "Email: Step 4",
    email_post_consent_step5_sent: "Email: Step 5",
    email_welcome_sent: "Welcome email sent",
    email_new_student_trigger_sent: "New student email sent",
    email_opened: "Email opened",
    email_clicked: "Link clicked",
    email_bounced: "Email bounced",
    reply_received: "Reply received",
    system_activated: "Activated (link clicked)",
    system_enrolled: "Enrolled (T&C accepted)",
    system_auto_dnc: "Auto-closed (max attempts)",
    status_reverted: "Status reverted",
  };
  return map[t] ?? t;
}
