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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MarkPartnerModal } from "./MarkPartnerModal";
import { AddStakeholderTaskModal } from "./AddStakeholderTaskModal";
import { OutreachStepList } from "./OutreachStepList";
import { PreFlightReviewModal } from "./PreFlightReviewModal";
import { ReplyClassifierModal } from "./ReplyClassifierModal";
import { LogMeetingModal } from "./LogMeetingModal";
import { EntityStepBoard } from "@/components/admin/medjobs/EntityStepBoard";
import { DrawerShell } from "@/components/admin/medjobs/DrawerShell";
import { StepBoardCard } from "@/components/admin/medjobs/StepBoardCard";
import { ProviderProspectDrawerBody } from "@/components/admin/medjobs/ProviderProspectDrawerBody";
import { refreshMedJobs } from "@/hooks/useMedJobsRefresh";
import {
  PARTNER_CTA_STAGES,
  KIND_LABELS,
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
  /** v9.0 Phase 2: stakeholder mode — pass outreachId to load a
   *  student_outreach row and render the existing workflow drawer. */
  outreachId?: string;
  /** v9.0 Phase 2: provider mode — pass providerId to load a
   *  business_profiles row and render the Manage panel for a Client. */
  providerId?: string;
  /** v9.0 Phase 7 Commit B: site mode — pass siteId (a campus_id) to
   *  render the Site reference + Step Board panel. */
  siteId?: string;
  /** v9.0 Phase 7 Commit B: candidate mode — pass candidateId (a
   *  student business_profile id) to render the Candidate reference +
   *  Step Board panel. */
  candidateId?: string;
  onClose: () => void;
  /** Optional in non-stakeholder modes. */
  onAction?: (refreshed: DrawerContext | null) => void;
}

type ActionFn = (action: string, payload?: Record<string, unknown>) => Promise<DrawerContext>;

// v8.10.37: terminal closed statuses — Step Board hides for these so the
// drawer doesn't invite adding workflow steps to a closed/DNC stakeholder.
// Mirrors DangerZone's terminal-suppression rule.
const TERMINAL_STATUSES: Status[] = [
  "not_interested",
  "do_not_contact",
  "wrong_contact",
  "redirected",
  "no_response_closed",
];

// v8.10.11: TabContext + TabContextBanner removed. The drawer's section
// h3s + per-state guidance already convey orientation; the banner was
// repeating it one row above. tabContext prop on DrawerProps was only
// used to drive that banner, so it's gone too.
//
// v9.0 Phase 2: Drawer is now polymorphic — `outreachId` mounts the
// existing stakeholder workflow drawer; `providerId` mounts the
// provider Manage drawer (Clients tab). One drawer file, internal
// fork on which prop is set. The two share the outer chrome (backdrop,
// aside, ESC handler, close button) via DrawerShell.
export function Drawer(props: DrawerProps) {
  if (props.providerId) {
    return <ProviderDrawer providerId={props.providerId} onClose={props.onClose} />;
  }
  if (props.siteId) {
    return <SiteDrawer siteId={props.siteId} onClose={props.onClose} />;
  }
  if (props.candidateId) {
    return <CandidateDrawer candidateId={props.candidateId} onClose={props.onClose} />;
  }
  if (!props.outreachId) {
    return null;
  }
  return (
    <StakeholderDrawer
      outreachId={props.outreachId}
      onClose={props.onClose}
      onAction={props.onAction ?? (() => {})}
    />
  );
}

/**
 * v9.0 Phase 4: tiny drawer-header overflow menu carrying admin
 * actions that aren't tied to any specific row card slot. Currently
 * just Mark as unread; future drawer-level actions land here.
 */
function DrawerHeaderOverflow({ onMarkUnread }: { onMarkUnread: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        title="More actions"
        aria-label="More actions"
      >
        <span aria-hidden>⋯</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <button
            onClick={() => {
              setOpen(false);
              void onMarkUnread();
            }}
            className="block w-full px-3 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Mark as unread
          </button>
        </div>
      )}
    </div>
  );
}

function StakeholderDrawer({
  outreachId,
  onClose,
  onAction,
}: {
  outreachId: string;
  onClose: () => void;
  onAction: (refreshed: DrawerContext | null) => void;
}) {
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

  // v9.0 Phase 4: mark the row read on drawer mount. Fire-and-forget;
  // a failed mark_read shouldn't disrupt the drawer experience. The
  // server is idempotent (only updates if viewed_at IS NULL) so this
  // is safe to call on every mount.
  //
  // v9.0 Phase 7 Commit K: after mark_read lands, fire the global
  // refresh so the In Basket hero (Queued counts) + sidebar
  // fractions reflect the new read state in real time without
  // waiting for the next user action.
  useEffect(() => {
    void (async () => {
      try {
        await fetch(`/api/admin/student-outreach/${outreachId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mark_read" }),
        });
        refreshMedJobs();
      } catch {
        /* non-critical */
      }
    })();
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

  return (
    <DrawerShell
      onClose={onClose}
      header={
        ctx ? (() => {
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
          // v8.10.37: surface a small "★ Partner since {date}" indicator
          // for active partners. NextStepPanel is suppressed for partners,
          // so without this header cue the drawer wouldn't show their
          // status anywhere prominent. Date comes from the most recent
          // distribution_confirmed touchpoint (when they were graduated).
          const isPartner = ctx.outreach.status === "active_partner";
          const partnerSince = isPartner
            ? ctx.touchpoints.find((t) => t.touchpoint_type === "distribution_confirmed")
                ?.created_at ?? null
            : null;
          return (
            <>
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
                {ctx.campus.name} · {KIND_LABELS[ctx.outreach.kind ?? ctx.outreach.stakeholder_type]}
                {primary?.role && ` · ${primary.role}`}
              </p>
              {isPartner && (
                <p className="mt-1 text-xs font-medium text-emerald-700">
                  ★ Partner
                  {partnerSince
                    ? ` since ${new Date(partnerSince).toLocaleDateString()}`
                    : ""}
                </p>
              )}
            </>
          );
        })() : (
          <h2 className="text-lg font-semibold text-gray-400">Loading…</h2>
        )
      }
      headerExtras={
        // v9.0 Phase 4: drawer-level Mark as unread. Same semantic as
        // the row card overflow item — resets attention so the row
        // appears bold again in the tab.
        <DrawerHeaderOverflow
          onMarkUnread={async () => {
            try {
              await action("mark_unread");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to mark unread");
            }
          }}
        />
      }
    >
      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : ctx ? (
        ctx.outreach.kind === "provider" ? (
          <ProviderProspectDrawerBody
            ctx={ctx}
            action={action}
            setError={setError}
          />
        ) : (
          <DrawerBody ctx={ctx} action={action} setError={setError} />
        )
      ) : null}
    </DrawerShell>
  );
}

/**
 * v9.0 Phase 2: Provider variant of the unified drawer. Mirrors the
 * stakeholder drawer's chrome (backdrop, aside, ESC-to-close, scrollable
 * body) but the body is the Manage panel — read-only summary of trial
 * status, T&C acceptance, and Stripe linkage. Acknowledgement records
 * + admin actions (extend trial, mark churned) land in subsequent v9.x.
 */
interface ProviderInterview {
  id: string;
  status: string;
  type: string;
  proposed_time: string;
  confirmed_time: string | null;
  created_at: string;
  student: { id: string; display_name: string | null } | null;
}

interface ProviderDrawerData {
  id: string;
  display_name: string;
  slug: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  created_at: string;
  stripe_customer_id: string | null;
  subscription_id: string | null;
  subscription_active: boolean;
  interview_terms_accepted_at: string | null;
  credits_used: number;
  status: "in_pilot" | "pilot_expired" | "subscribed";
  pilot_started_at: string | null;
  pilot_ends_at: string | null;
  days_remaining_in_pilot: number | null;
  // v9.0 Phase 2 Tier 3.7: interview history.
  first_interview: ProviderInterview | null;
  recent_interviews: ProviderInterview[];
  total_interviews: number;
}

function ProviderDrawer({
  providerId,
  onClose,
}: {
  providerId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<ProviderDrawerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/admin/medjobs/clients/${providerId}`);
        if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
        const body = await res.json();
        if (!cancelled) setData(body);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [providerId]);

  // v9.0 Phase 7 Commit O: mark the client read on drawer mount —
  // mirrors the StakeholderDrawer's mark_read effect. Fire the
  // global refresh so In Basket + sidebar fractions update live.
  useEffect(() => {
    void (async () => {
      try {
        await fetch("/api/admin/medjobs/mark-entity-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "client", id: providerId, action: "read" }),
        });
        refreshMedJobs();
      } catch {
        /* non-critical */
      }
    })();
  }, [providerId]);

  return (
    <DrawerShell
      onClose={onClose}
      header={
        data ? (
          <>
            <h2 className="truncate text-lg font-semibold text-gray-900">{data.display_name}</h2>
            <p className="truncate text-sm text-gray-500">
              {[data.city, data.state].filter(Boolean).join(", ") || "Provider"}
              {data.email && ` · ${data.email}`}
            </p>
            <ProviderStatusLabel data={data} />
          </>
        ) : (
          <h2 className="text-lg font-semibold text-gray-400">Loading…</h2>
        )
      }
    >
      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : data ? (
        <ProviderManagePanel data={data} />
      ) : null}
    </DrawerShell>
  );
}

function ProviderStatusLabel({ data }: { data: ProviderDrawerData }) {
  if (data.status === "subscribed") {
    return (
      <p className="mt-1 text-xs font-medium text-emerald-700">$ Subscribed via Stripe</p>
    );
  }
  if (data.status === "pilot_expired") {
    return <p className="mt-1 text-xs font-medium text-gray-500">Pilot ended</p>;
  }
  const days = data.days_remaining_in_pilot ?? 0;
  const isUrgent = days <= 14;
  return (
    <p
      className={`mt-1 text-xs font-medium ${
        isUrgent ? "text-red-700" : "text-amber-700"
      }`}
    >
      In 90-day pilot · {days === 1 ? "1 day" : `${days} days`} remaining
    </p>
  );
}

function ProviderManagePanel({ data }: { data: ProviderDrawerData }) {
  const stripeUrl = data.stripe_customer_id
    ? `https://dashboard.stripe.com/customers/${data.stripe_customer_id}`
    : null;

  return (
    <div className="space-y-6">
      {/* v9.0 Phase 7 Commit B: Step Board leads the panel — the
          operational surface for client-side follow-ups (trial
          check-ins, billing nudges, account expansion). Reference
          sections (pilot status, subscription, interviews) follow. */}
      <EntityStepBoard
        kind="client"
        entityId={data.id}
        entityName={data.display_name}
      />

      {/* Pilot / Trial */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Pilot status
        </h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
          <Row label="Pilot started" value={formatTimestamp(data.pilot_started_at)} />
          <Row label="Pilot ends" value={formatTimestamp(data.pilot_ends_at)} />
          <Row
            label="Days remaining"
            value={
              data.days_remaining_in_pilot === null
                ? "—"
                : data.days_remaining_in_pilot > 0
                  ? `${data.days_remaining_in_pilot}`
                  : "Expired"
            }
          />
          <Row label="Interviews scheduled" value={`${data.total_interviews}`} />
        </dl>
      </section>

      {/* v9.0 Phase 2 Tier 3.7: Acknowledgement record. The pilot starts
          when a provider accepts T&C at first interview scheduling —
          this section surfaces the proof. */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Acknowledgement
        </h3>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
          {data.interview_terms_accepted_at ? (
            <>
              <p className="font-medium text-gray-900">Terms &amp; conditions accepted</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {formatTimestamp(data.interview_terms_accepted_at)} · captured at first interview scheduling
              </p>
              {data.first_interview && (
                <p className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700">
                  Linked to interview with{" "}
                  <span className="font-medium">
                    {data.first_interview.student?.display_name ?? "(student profile)"}
                  </span>
                  {" — "}
                  proposed for {formatTimestamp(data.first_interview.proposed_time)} ({data.first_interview.type}).
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-500">
              No acknowledgement on file. T&amp;C is captured the first time the provider schedules
              an interview through the public scheduler.
            </p>
          )}
        </div>
      </section>

      {/* Subscription */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Subscription
        </h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
          <Row label="Status" value={data.subscription_active ? "Active" : "Not subscribed"} />
          <Row label="Customer ID" value={data.stripe_customer_id ?? "—"} mono />
          <Row label="Subscription ID" value={data.subscription_id ?? "—"} mono />
        </dl>
        {stripeUrl && (
          <a
            href={stripeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            View in Stripe Dashboard ↗
          </a>
        )}
      </section>

      {/* v9.0 Phase 2 Tier 3.7: recent interviews. Gives admin
          pilot-utilization context — are they actively scheduling? */}
      {data.recent_interviews.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Recent interviews ({data.total_interviews} total)
          </h3>
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white text-sm">
            {data.recent_interviews.map((iv) => (
              <li key={iv.id} className="px-4 py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-medium text-gray-900">
                    {iv.student?.display_name ?? "(student profile)"}
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatTimestamp(iv.proposed_time)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                  <InterviewStatusPill status={iv.status} />
                  <span>{iv.type}</span>
                  {iv.confirmed_time && (
                    <span className="text-emerald-700">
                      Confirmed {formatTimestamp(iv.confirmed_time)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Profile */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Provider profile
        </h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
          <Row label="Active" value={data.is_active ? "Yes" : "No"} />
          <Row label="Phone" value={data.phone ?? "—"} />
          <Row label="Created" value={formatTimestamp(data.created_at)} />
          <Row label="Slug" value={data.slug ?? "—"} mono />
        </dl>
        {data.slug && (
          <a
            href={`/${data.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            View public profile ↗
          </a>
        )}
      </section>
    </div>
  );
}

// ── Site + Candidate drawers (v9.0 Phase 7 Commit B) ──────────────────
//
// Lightweight non-stakeholder drawers. Each shows a small reference
// header + the EntityStepBoard for custom follow-up tasks. The full
// inventory / management surfaces (campus management at
// /admin/student-outreach/campus/[slug], candidate profile editor at
// /admin/medjobs/[studentId]) are reachable via header links.

interface SiteDrawerData {
  id: string;
  slug: string;
  name: string;
  state: string | null;
  city: string | null;
  research_complete: boolean;
  is_active: boolean;
}

function SiteDrawer({ siteId, onClose }: { siteId: string; onClose: () => void }) {
  const [data, setData] = useState<SiteDrawerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/admin/medjobs/campuses`);
        if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
        const body = await res.json();
        const all = (body.rows ?? []) as Array<{
          id: string;
          slug: string;
          name: string;
          state: string | null;
          city: string | null;
          research_complete: boolean;
        }>;
        const found = all.find((c) => c.id === siteId);
        if (!cancelled) {
          if (!found) {
            setError("Site not found");
          } else {
            setData({ ...found, is_active: true });
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [siteId]);

  // v9.0 Phase 7 Commit O: mark site read on mount.
  useEffect(() => {
    void (async () => {
      try {
        await fetch("/api/admin/medjobs/mark-entity-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "site", id: siteId, action: "read" }),
        });
        refreshMedJobs();
      } catch {
        /* non-critical */
      }
    })();
  }, [siteId]);

  return (
    <DrawerShell
      onClose={onClose}
      header={
        data ? (
          <>
            <h2 className="truncate text-lg font-semibold text-gray-900">{data.name}</h2>
            <p className="truncate text-sm text-gray-500">
              {[data.city, data.state].filter(Boolean).join(", ") || "Site"}
            </p>
            <p className="mt-1 text-xs font-medium text-gray-500">
              {data.research_complete ? "Active" : "Research in progress"}
            </p>
          </>
        ) : (
          <h2 className="text-lg font-semibold text-gray-400">Loading…</h2>
        )
      }
    >
      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : data ? (
        <div className="space-y-6">
          <EntityStepBoard kind="site" entityId={data.id} entityName={data.name} />
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Open in
            </h3>
            <a
              href={`/admin/student-outreach/campus/${data.slug}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Site management page ↗
            </a>
          </section>
        </div>
      ) : null}
    </DrawerShell>
  );
}

interface CandidateDrawerData {
  id: string;
  display_name: string;
  university: string | null;
  city: string | null;
  state: string | null;
  program_track: string | null;
  signed_up_at: string | null;
}

function CandidateDrawer({
  candidateId,
  onClose,
}: {
  candidateId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<CandidateDrawerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        // Reuse the candidates list endpoint and pick the matching row.
        // No per-candidate endpoint exists yet; the inventory list is
        // small enough (live candidates only) to scan client-side.
        const res = await fetch(`/api/admin/student-outreach/candidates`);
        if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
        const body = await res.json();
        const all = (body.rows ?? []) as Array<{
          id: string;
          display_name: string;
          university: string | null;
          city: string | null;
          state: string | null;
          program_track: string | null;
          signed_up_at: string | null;
        }>;
        const found = all.find((r) => r.id === candidateId);
        if (!cancelled) {
          if (!found) setError("Candidate not found");
          else setData(found);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [candidateId]);

  // v9.0 Phase 7 Commit O: mark candidate read on mount.
  useEffect(() => {
    void (async () => {
      try {
        await fetch("/api/admin/medjobs/mark-entity-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "candidate", id: candidateId, action: "read" }),
        });
        refreshMedJobs();
      } catch {
        /* non-critical */
      }
    })();
  }, [candidateId]);

  return (
    <DrawerShell
      onClose={onClose}
      header={
        data ? (
          <>
            <h2 className="truncate text-lg font-semibold text-gray-900">{data.display_name}</h2>
            <p className="truncate text-sm text-gray-500">
              {[data.university, [data.city, data.state].filter(Boolean).join(", "), data.program_track]
                .filter(Boolean)
                .join(" · ") || "Candidate"}
            </p>
          </>
        ) : (
          <h2 className="text-lg font-semibold text-gray-400">Loading…</h2>
        )
      }
    >
      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : data ? (
        <div className="space-y-6">
          <EntityStepBoard
            kind="candidate"
            entityId={data.id}
            entityName={data.display_name}
          />
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Open in
            </h3>
            <a
              href={`/admin/medjobs/${data.id}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Candidate profile editor ↗
            </a>
          </section>
        </div>
      ) : null}
    </DrawerShell>
  );
}

function InterviewStatusPill({ status }: { status: string }) {
  const cls =
    status === "completed"
      ? "bg-emerald-100 text-emerald-900"
      : status === "confirmed"
        ? "bg-blue-100 text-blue-900"
        : status === "proposed"
          ? "bg-amber-100 text-amber-900"
          : status === "cancelled" || status === "no_show"
            ? "bg-red-100 text-red-900"
            : "bg-gray-100 text-gray-700";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${cls}`}>
      {status}
    </span>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd
        className={`text-sm text-gray-900 ${
          mono ? "break-all font-mono text-xs" : "truncate"
        }`}
      >
        {value}
      </dd>
    </>
  );
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

      {/* v8.10.36: Step Board is the operational surface — workflow steps,
          follow-ups, relationship-progression items. Same card hierarchy
          as row cards on Meetings/Replies/Calls/Prospects so it reads as
          part of the same system. For partners (where Next Step is
          suppressed) Step Board becomes the leading section in the drawer.
          v8.10.37: hidden for terminal closed states — adding a step to
          a closed/DNC stakeholder doesn't fit the workflow. History +
          Reopen (in NextStepPanel) carry those drawers. */}
      {!TERMINAL_STATUSES.includes(ctx.outreach.status) && (
        <TaskBoardSection ctx={ctx} action={action} setError={setError} />
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
            {/* v8.10.36: More Details order matches the operational
                priority (data → history → escape hatch):
                  1. Research details   — what we know about them
                  2. Contacts           — who to talk to
                  3. Approvals          — what they've granted
                  4. History            — what's happened
                  5. Close out          — last-resort escape hatch
                Research stages render ResearchSection at the top via
                ResearchModePanel; don't duplicate it inside More Details. */}
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
            <DangerZone ctx={ctx} action={action} setError={setError} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Relationship banner ─────────────────────────────────────────────────

function RelationshipBanner({ ctx }: { ctx: DrawerContext }) {
  // v8.10.25: dropped the "Permission via <Dept> (Outreach Sent)" line.
  // It was verbose and not operationally useful — admins never need
  // to know the parent dept's status while researching the professor.
  // Referred-from / redirected-to / snoozed-until still surface here
  // since those affect the row's working context.
  const items: string[] = [];
  if (ctx.referred_from) items.push(`Referred from ${ctx.referred_from.organization_name}`);
  if (ctx.redirected_to) items.push(`Redirected to ${ctx.redirected_to.organization_name}`);
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
    <>
      Confirm the plan below, then start outreach. The first email goes out right away. Follow-ups send automatically; calls show up in the Calls tab on their day; replies show up in Replies.
    </>
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
  const [showLogReply, setShowLogReply] = useState(false);
  const [showLogMeeting, setShowLogMeeting] = useState(false);

  // v8.10.36: drop the entire Next Step section for active partners.
  // Step Board (rendered immediately below this panel in DrawerBody)
  // becomes the leading operational surface — no abstract status copy
  // ("Next seasonal email auto-sends X") competing with it.
  if (status === "active_partner") return null;

  const partnerCtaVisible = PARTNER_CTA_STAGES.includes(status);

  // v8.10.30: meeting modal pre-fills from the row's current state, just
  // like the page-level Meetings-tab modal does.
  const meetingInitialStatus =
    ctx.meeting_state === "scheduled" ? "booked" : "finding_time";
  const meetingInitialAt = ctx.meeting_at ? ctx.meeting_at.slice(0, 16) : undefined;

  const primaryContactDisplay = (() => {
    const c =
      ctx.contacts.find((x) => x.status === "active") ?? ctx.contacts[0] ?? null;
    if (!c) return null;
    return (
      [c.title, c.first_name, c.last_name].filter(Boolean).join(" ").trim() ||
      c.name ||
      null
    );
  })();

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
            onLogReply={() => setShowLogReply(true)}
            onLogMeeting={() => setShowLogMeeting(true)}
            action={action}
            setError={setError}
          />
        </div>

        {/* v8.10.30: Mark as Partner remains as a secondary outline button
            so the admin can graduate the row from any active stage without
            funneling through Log reply → committed. The StateCard above
            carries the unified primary CTA that matches the row's tab. */}
        {partnerCtaVisible && (
          <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50/60 px-4 py-3">
            <button
              onClick={() => setShowPartner(true)}
              title="Click when you're confident they've committed to sharing with students."
              className="rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Mark as Partner ★
            </button>
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
              await action("mark_partner", { ...payload });
              setShowPartner(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
            }
          }}
        />
      )}
      {showLogReply && (
        <ReplyClassifierModal
          organizationName={ctx.outreach.organization_name}
          source="email_reply"
          onCancel={() => setShowLogReply(false)}
          onSubmit={async (classification, payload, partner) => {
            try {
              await action("classify_reply", {
                classification,
                notes: payload.notes,
                meeting_at: payload.meeting_at,
              });
              if (partner) {
                await action("mark_partner", { ...partner });
              }
              setShowLogReply(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Save failed");
              throw e;
            }
          }}
        />
      )}
      {showLogMeeting && (
        <LogMeetingModal
          organizationName={ctx.outreach.organization_name}
          contactName={primaryContactDisplay}
          initialStatus={meetingInitialStatus}
          initialMeetingAt={meetingInitialAt}
          onCancel={() => setShowLogMeeting(false)}
          onSubmit={async (mstatus, payload, partner) => {
            try {
              if (mstatus === "booked") {
                await action("mark_meeting_scheduled", {
                  meeting_at: payload.meeting_at,
                  notes: payload.notes,
                });
              } else if (mstatus === "finding_time") {
                await action("flag_wants_meeting", { notes: payload.notes });
              } else if (mstatus === "done_followup") {
                await action("mark_meeting_followup", { notes: payload.notes });
              } else if (mstatus === "done_partner" && partner) {
                // v9.0 Phase 7 Commit G: done_partner is now a direct
                // mark_partner — no chained MarkPartnerModal here either.
                await action("mark_partner", { ...partner });
              }
              setShowLogMeeting(false);
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
  onLogReply,
  onLogMeeting,
  action,
  setError,
}: {
  ctx: DrawerContext;
  onSchedulePreFlight: () => void;
  onLogReply: () => void;
  onLogMeeting: () => void;
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

    // v8.10.30: drawer primary CTAs match the row-card vocabulary so
    // admin uses the same verb whether they click on a row or open a
    // drawer. Four labels total: Log reply, Log meeting, Start outreach,
    // Engage. CTA is computed from the same derived state the queue
    // uses to assign rows to tabs:
    //   - Meeting in flight / scheduled / wants_meeting → "Log meeting"
    //   - Reply states (engaged, needs_followup, awaiting_callback,
    //     stale) → "Log reply"
    //   - Mid-cadence with no signal → no CTA (cron is doing the work)
    const isMeetingState = m === "scheduled" || m === "in_flight" || r === "wants_meeting";
    const isReplyState =
      r === "engaged" || r === "needs_followup" || r === "awaiting_callback" || r === "stale";

    let banner: React.ReactNode = null;
    if (m === "scheduled") {
      banner = (
        <StateCard
          title="Meeting is on the calendar."
          subtext={
            ctx.meeting_at
              ? `Set for ${new Date(ctx.meeting_at).toLocaleString()}.`
              : "After it happens, log how it went."
          }
          primaryCta={{ label: "Log", onClick: onLogMeeting }}
        />
      );
    } else if (hasOverdueCall) {
      // Single source of truth: the call card. Drop competing banners.
      banner = null;
    } else if (m === "in_flight" || r === "wants_meeting") {
      banner = (
        <StateCard
          title="They want to meet."
          subtext="Send times over email, then log what was set."
          primaryCta={{ label: "Log", onClick: onLogMeeting }}
        />
      );
    } else if (r === "needs_followup") {
      banner = (
        <StateCard
          title="Met — needs follow-up."
          subtext="Send a check-in email, then log what they say."
          notes={ctx.followup_notes}
          primaryCta={{ label: "Log", onClick: onLogReply }}
        />
      );
    } else if (r === "awaiting_callback") {
      const kindText = ctx.awaiting_callback_kind === "promised"
        ? "They said they'd call back."
        : "You left a voicemail.";
      banner = (
        <StateCard
          title="Waiting on a call back."
          subtext={`${kindText} If they call or write back, log it.`}
          primaryCta={{ label: "Log", onClick: onLogReply }}
        />
      );
    } else if (r === "engaged") {
      banner = (
        <StateCard
          title="They replied."
          subtext="Read it in Gmail, then log what they said."
          primaryCta={{ label: "Log", onClick: onLogReply }}
        />
      );
    } else if (r === "stale") {
      banner = (
        <StateCard
          title="Cadence stalled."
          subtext="Send a custom re-engage email, or close the row if it's not moving."
          primaryCta={{ label: "Log", onClick: onLogReply }}
        />
      );
    }
    void isMeetingState;
    void isReplyState;

    return (
      <>
        {banner}
        <OutreachStepList ctx={ctx} action={action} setError={setError} />
      </>
    );
  }

  // v8.10.36: active_partner has no Next Step banner — NextStepPanel
  // returns null for partners and the Step Board immediately below
  // becomes the leading operational surface.

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

/**
 * Small inline overflow menu for task cards. Mirrors the universal
 * OverflowMenu pattern from page.tsx (top-right ⋯ → dropdown). Closes
 * on outside click. Items support a "danger" tone for destructive
 * actions like Delete.
 */
function TaskOverflow({
  items,
}: {
  items: Array<{ label: string; onClick: () => void; tone?: "default" | "danger" }>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        title="More actions"
        aria-label="More actions"
      >
        <span className="text-base leading-none">⋯</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[140px] overflow-hidden rounded-md border border-gray-100 bg-white shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={`block w-full px-3 py-1.5 text-left text-xs font-medium ${
                item.tone === "danger"
                  ? "text-red-700 hover:bg-red-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
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

// v8.10.26: display labels say "task board"; the approval_for matching
// key (database column) stays "Post on university job board" so we
// don't break matching against existing approval rows.
const JOB_BOARD_PERMISSION: PermissionKind = {
  key: "job_board",
  approval_for: "Post on university job board",
  approval_type: "job_board",
  title: "Post on university task board",
  blurb: "Permission to publish Olera's clinical-experience posting on the campus task board.",
  tooltip: "When granted, a 'Post to task board' task is queued (one per campus, deduped if multiple grant).",
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

// ── Step Board (v8.10.36) ──────────────────────────────────────────────
//
// Top-level drawer section listing every pending workflow step on the
// stakeholder using the same card hierarchy as row cards. Steps are the
// operational unit here: external task-board posts, custom follow-ups,
// scheduled cadence emails / calls / seasonals. Each TaskCard renders
// headline + subtitle + footnote, with ⋯ overflow top-right and the
// per-type primary CTA bottom-right. Scheduled passive items use a
// muted variant (no CTA, lighter text) so admin's operational priorities
// lead.

// v9.0 Phase 7 Commit F: TaskCard moved to StepBoardCard
// (components/admin/medjobs/StepBoardCard.tsx) so the stakeholder
// TaskBoardSection and the EntityStepBoard share one chrome. Local
// alias retained so the rest of this file's call sites don't need
// to change shape.
const TaskCard = StepBoardCard;

function TaskBoardSection({
  ctx,
  action,
  setError,
}: {
  ctx: DrawerContext;
  action: ActionFn;
  setError: (e: string | null) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState<{ id: string; text: string } | null>(null);
  const actionable = useMemo(
    () =>
      ctx.pending_tasks.filter((t) => {
        const reason = (t.payload as Record<string, unknown> | null)?.reason;
        if (t.task_type === "manual_followup" && reason === "custom") return true;
        if (t.task_type === "partner_share_update" && reason === "job_board_post") return true;
        return false;
      }),
    [ctx.pending_tasks],
  );
  const scheduled = useMemo(
    () =>
      ctx.pending_tasks
        .filter((t) => !actionable.includes(t))
        .sort((a, b) => a.due_at.localeCompare(b.due_at)),
    [ctx.pending_tasks, actionable],
  );
  const handleErr = (p: Promise<unknown>) =>
    p.catch((e) => setError(e instanceof Error ? e.message : "Action failed"));

  const primary = ctx.contacts.find((c) => c.status === "active") ?? ctx.contacts[0] ?? null;
  const contactDisplay = primary
    ? [primary.title, primary.first_name, primary.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || primary.name || null
    : null;

  const overdueTone = (
    <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
      Overdue
    </span>
  );

  const renderActionable = (t: Task) => {
    const reason = (t.payload as Record<string, unknown> | null)?.reason;
    const overdue = new Date(t.due_at).getTime() < Date.now();
    const cta = (
      <button
        onClick={() =>
          handleErr(
            t.task_type === "partner_share_update"
              ? action("mark_job_board_posted")
              : action("complete_task", { task_id: t.id }),
          )
        }
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        {t.task_type === "partner_share_update" ? "Mark posted" : "Done"}
      </button>
    );

    if (t.task_type === "partner_share_update" && reason === "job_board_post") {
      return (
        <TaskCard
          key={t.id}
          headline={`Post to ${ctx.campus.name} task board`}
          subtitle="Olera's clinical-experience listing"
          footnote={`Permission granted ${relativeTime(t.created_at)}`}
          pill={overdue ? overdueTone : undefined}
          overflow={
            <TaskOverflow
              items={[
                {
                  label: "Delete step",
                  onClick: () => handleErr(action("cancel_task", { task_id: t.id })),
                  tone: "danger",
                },
              ]}
            />
          }
          cta={cta}
        />
      );
    }
    const text = String(
      (t.payload as Record<string, unknown> | null)?.notes ??
        (t.payload as Record<string, unknown> | null)?.description ??
        "(no description)",
    );
    return (
      <TaskCard
        key={t.id}
        headline={text}
        subtitle="Custom step"
        footnote={`Added ${relativeTime(t.created_at)}`}
        pill={overdue ? overdueTone : undefined}
        overflow={
          <TaskOverflow
            items={[
              { label: "Edit step", onClick: () => setEditingTask({ id: t.id, text }) },
              {
                label: "Delete step",
                onClick: () => handleErr(action("cancel_task", { task_id: t.id })),
                tone: "danger",
              },
            ]}
          />
        }
        cta={cta}
      />
    );
  };

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Step Board
      </h3>
      <div className="space-y-2">
        {actionable.length === 0 && scheduled.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs text-gray-400">
            No steps yet. Add one to remind yourself of a follow-up.
          </p>
        ) : (
          <>
            {actionable.map(renderActionable)}
            {scheduled.map((t) => (
              <TaskCard
                key={t.id}
                muted
                headline={scheduledTaskLabel(t)}
                subtitle="Auto-scheduled — runs on its own."
                footnote={`Sends ${formatDueAt(t.due_at)}`}
              />
            ))}
          </>
        )}
        <button
          onClick={() => setShowAdd(true)}
          className="w-full rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          + Add step
        </button>
      </div>

      {showAdd && (
        <AddStakeholderTaskModal
          organizationName={ctx.outreach.organization_name}
          contactName={contactDisplay}
          onCancel={() => setShowAdd(false)}
          onSubmit={async (text) => {
            await action("queue_manual_task", {
              task_type: "manual_followup",
              due_at: new Date().toISOString(),
              notes: text,
            });
            setShowAdd(false);
          }}
        />
      )}
      {editingTask && (
        <AddStakeholderTaskModal
          organizationName={ctx.outreach.organization_name}
          contactName={contactDisplay}
          initialText={editingTask.text}
          onCancel={() => setEditingTask(null)}
          onSubmit={async (text) => {
            // Cancel-then-create. New task gets a new ID; history shows
            // the cancellation + the new queue. For MVP this is fine —
            // admins typically edit shortly after creating.
            await action("cancel_task", { task_id: editingTask.id });
            await action("queue_manual_task", {
              task_type: "manual_followup",
              due_at: new Date().toISOString(),
              notes: text,
            });
            setEditingTask(null);
          }}
        />
      )}
    </section>
  );
}

/**
 * v8.10.29: Human label for a scheduled (non-actionable) pending task.
 * Renders as a passive ⏳ row inside Tasks. We intentionally don't expose
 * actions here — auto-cadence emails are managed via OutreachStepList,
 * calls via the Calls tab, seasonals via the cron.
 */
function scheduledTaskLabel(t: Task): string {
  const payload = (t.payload ?? {}) as Record<string, unknown>;
  switch (t.task_type) {
    case "outreach_email_send": {
      const day = typeof payload.day === "number" ? payload.day : null;
      if (day === -1) {
        const season = typeof payload.season === "string" ? payload.season : null;
        return season ? `Seasonal email · ${season}` : "Seasonal email";
      }
      return day !== null ? `Cadence email · Day ${day}` : "Outreach email";
    }
    case "outreach_followup_call":
      return typeof payload.day === "number"
        ? `Follow-up call · Day ${payload.day}`
        : "Follow-up call";
    case "partner_seasonal_checkin":
      return "Seasonal check-in";
    case "partner_event_coordination":
      return "Event coordination";
    case "partner_share_update":
      return "Share update";
    case "yearly_leadership_recheck":
      return "Yearly leadership re-check";
    case "approval_request_followup":
      return "Approval follow-up";
    case "manual_followup":
      return typeof payload.notes === "string" ? String(payload.notes) : "Follow-up";
    default:
      return t.task_type.replaceAll("_", " ");
  }
}

function formatDueAt(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (Math.abs(ms) < 60_000) return "now";
  const mins = Math.round(ms / 60_000);
  if (mins < 0) {
    const past = Math.abs(mins);
    if (past < 60) return `${past}m overdue`;
    const hr = Math.round(past / 60);
    if (hr < 24) return `${hr}h overdue`;
    const d = Math.round(hr / 24);
    return `${d}d overdue`;
  }
  if (mins < 60) return `in ${mins}m`;
  const hr = Math.round(mins / 60);
  if (hr < 24) return `in ${hr}h`;
  const d = Math.round(hr / 24);
  if (d < 14) return `in ${d}d`;
  return new Date(iso).toLocaleDateString();
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

// v8.10.30: FollowupNotesModal removed. The "needs follow-up" path is
// now part of LogMeetingModal's done_followup outcome — admin uses the
// unified Log meeting CTA both on the row card and inside the drawer.

// ── UI primitives ──────────────────────────────────────────────────────

function Guidance({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-700 leading-relaxed">{children}</p>;
}

/**
 * v8.10.29: state-driven contextual card. Short title + 1-line subtext +
 * (optional) prominent meeting note quote + (optional) primary CTA that
 * matches the actual next move for this state.
 */
function StateCard({
  title,
  subtext,
  notes,
  primaryCta,
}: {
  title: string;
  subtext: string;
  notes?: string | null;
  primaryCta?: { label: string; onClick: () => void };
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{subtext}</p>
      </div>
      {notes && (
        <p className="rounded-md bg-gray-50 px-3 py-2 text-xs italic text-gray-700">
          From the meeting: &ldquo;{notes}&rdquo;
        </p>
      )}
      {primaryCta && (
        <button
          onClick={primaryCta.onClick}
          className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-700"
        >
          {primaryCta.label}
        </button>
      )}
    </div>
  );
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
