"use client";

/**
 * MedJobs row card primitives — the visual chassis used across every
 * In Basket tab and dedicated MedJobs page.
 *
 * Exports:
 *   RowCard               — pulls slots from buildRowSlots(tab, row, cb) and
 *                           renders them in StakeholderCard.
 *   StakeholderCard       — generic row shell (white bg, gray-200 border,
 *                           rounded-lg) with three regions: descriptive
 *                           content (left), overflow menu (top-right),
 *                           primary CTA (bottom-right).
 *   Pill, ExpandableNote, PrimaryAction, OverflowMenu, MenuItem, FilterPill
 *
 * Slot builders (researchSlots, callsSlots, ...) live here because they
 * consume the same primitives. Per-tab slot dispatch via buildRowSlots.
 *
 * Extracted from app/admin/student-outreach/page.tsx as part of the
 * v9.0 MedJobs reorg (Phase 0). Behavior is unchanged from v8.10.X.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  STAKEHOLDER_TYPE_LABELS,
  STATUS_LABELS,
  type RepliesState,
  type TabRow,
} from "@/lib/student-outreach/types";
import {
  formatDueDate,
  formatLongDate,
  formatRelative,
  formatShortRelative,
} from "@/lib/student-outreach/formatters";
import type {
  OverflowItem,
  RowCardCallbacks,
  RowSlots,
  StopOutreachReason,
  TabKey,
} from "@/lib/student-outreach/tab-config";

// ── RowCard ──────────────────────────────────────────────────────────────

export function RowCard({
  tab,
  row,
  ...cb
}: { tab: TabKey; row: TabRow } & RowCardCallbacks) {
  const slots = buildRowSlots(tab, row, cb);
  return (
    <StakeholderCard
      row={row}
      pill={slots.pill}
      footnote={slots.footnote}
      headlineAccessory={slots.headlineAccessory}
      cta={slots.cta}
      overflowMenu={slots.overflowMenu}
      onOpenDrawer={cb.onOpenDrawer}
    />
  );
}

/**
 * Unified row shell — v8.10.12 layout.
 *
 *   [Contact name + headlineAccessory]                     [⋯ overflow]
 *   [org · campus · type · role]
 *   [footnote — last activity, overdue, etc.]
 *   [status pill]
 *   [notes (optional)]
 *                                                         [Primary CTA]
 *
 * Three regions: descriptive content (left column, top-down), overflow
 * menu (top-right), primary CTA (bottom-right). Each per-tab slots
 * function returns whichever pieces apply; missing pieces don't render.
 */
export function StakeholderCard({
  row,
  pill,
  footnote,
  headlineAccessory,
  cta,
  overflowMenu,
  onOpenDrawer,
}: {
  row: TabRow;
  pill?: ReactNode;
  footnote?: ReactNode;
  headlineAccessory?: ReactNode;
  cta?: ReactNode;
  overflowMenu?: ReactNode;
  onOpenDrawer: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDrawer}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDrawer();
        }
      }}
      title="Open the drawer for full context and history."
      className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div className="flex items-stretch justify-between gap-3">
        {/* LEFT: descriptive content stacked top-down */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-gray-900">
              {row.primary_contact_name || row.organization_name}
            </p>
            {headlineAccessory}
          </div>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {row.primary_contact_name &&
              row.primary_contact_name !== row.organization_name && (
              <>
                {row.organization_name}
                {row.department && row.department !== row.organization_name && ` · ${row.department}`}
                {" · "}
              </>
            )}
            {row.campus_name} · {STAKEHOLDER_TYPE_LABELS[row.stakeholder_type]}
            {row.primary_contact_role && ` · ${row.primary_contact_role}`}
          </p>
          {footnote}
          {pill && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {pill}
            </div>
          )}
        </div>

        {/* RIGHT: ellipsis at top, CTA at bottom. */}
        {(cta || overflowMenu) && (
          <div className="flex shrink-0 flex-col items-end justify-between gap-2">
            <div className="flex items-center">{overflowMenu}</div>
            <div className="flex items-center">{cta}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pills (single tone — soft slate, easy on the eyes) ──────────────────

export function Pill({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <span
      title={title}
      className="shrink-0 rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700"
    >
      {children}
    </span>
  );
}

/**
 * v8.10.23: long notes on cards truncate to a character limit and
 * expose a "See more" toggle — clicking inline-expands the full text
 * without opening the drawer. Keeps card heights consistent and
 * scannable while preserving access to the full quote.
 */
export function ExpandableNote({ text, limit = 100 }: { text: string; limit?: number }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > limit;
  const display = expanded || !needsTruncation ? text : text.slice(0, limit).trimEnd();
  return (
    <p className="mt-0.5 text-[11px] italic text-gray-700">
      &quot;{display}
      {!expanded && needsTruncation && "…"}&quot;
      {needsTruncation && (
        <>
          {" "}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((s) => !s);
            }}
            className="not-italic text-emerald-700 underline hover:no-underline"
          >
            {expanded ? "See less" : "See more"}
          </button>
        </>
      )}
    </p>
  );
}

// ── Buttons (single tone — emerald primary) ──────────────────────────────

export function PrimaryAction({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title}
      className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
    >
      {children}
    </button>
  );
}

// ── Overflow ⋯ menu (with two-step Stop outreach picker) ─────────────────

export function OverflowMenu({
  items,
  onStopOutreach,
}: {
  items: OverflowItem[];
  onStopOutreach: (reason: StopOutreachReason) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [showReasons, setShowReasons] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowReasons(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setShowReasons(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const close = () => { setOpen(false); setShowReasons(false); };
  const stop = (reason: StopOutreachReason) => {
    void onStopOutreach(reason);
    close();
  };

  return (
    <div ref={ref} className="relative self-end">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((s) => !s); setShowReasons(false); }}
        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        title="More actions"
        aria-label="More actions"
      >
        <span aria-hidden>⋯</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {showReasons ? (
            <>
              <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Stop outreach — why?
              </p>
              <MenuItem onClick={() => stop("no_response_closed")}>No response</MenuItem>
              <MenuItem onClick={() => stop("not_interested")}>Not interested</MenuItem>
              <MenuItem onClick={() => stop("wrong_contact")}>Wrong contact</MenuItem>
              <MenuItem onClick={() => stop("do_not_contact")} danger>Do not contact</MenuItem>
              <div className="my-1 border-t border-gray-100" />
              <MenuItem onClick={() => setShowReasons(false)}>← Back</MenuItem>
            </>
          ) : (
            <>
              {items.map((item, i) => (
                <MenuItem
                  key={i}
                  onClick={() => { item.onClick(); close(); }}
                  celebration={item.tone === "celebration"}
                >
                  {item.label}
                </MenuItem>
              ))}
              {items.length > 0 && <div className="my-1 border-t border-gray-100" />}
              <MenuItem onClick={() => setShowReasons(true)} danger>
                Stop outreach…
              </MenuItem>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  danger,
  celebration,
}: {
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
  celebration?: boolean;
}) {
  const colorClass = danger
    ? "text-red-700 hover:bg-red-50"
    : celebration
    ? "text-emerald-700 hover:bg-emerald-50"
    : "text-gray-700 hover:bg-gray-50";
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`block w-full px-3 py-1.5 text-left text-xs font-medium ${colorClass}`}
    >
      {children}
    </button>
  );
}

/**
 * v8.10.34: FilterPill — segmented-control chip used by the Prospects
 * tab filter row. Same border-radius (rounded-md) as buttons elsewhere,
 * no chunky bordered chrome when inactive (just hover bg) so the pill
 * row sits quietly above the cards instead of competing with them.
 */
export function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-gray-900 text-white"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      }`}
    >
      <span>{label}</span>
      <span
        className={`text-xs tabular-nums ${
          active ? "text-white/70" : "text-gray-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// ── Per-tab slot builders ────────────────────────────────────────────────

/**
 * v8.10.15: every card across every tab gets the same overflow menu —
 * Make Partner + Stop Outreach are universally accessible from the ⋯
 * top-right of any card. Per-tab additions go via `extraItems`; per-row
 * exclusions (e.g. Make Partner on already-active partners) via
 * `excludeMakePartner`.
 */
export function buildUniversalOverflow(
  cb: RowCardCallbacks,
  options: {
    excludeMakePartner?: boolean;
    extraItems?: OverflowItem[];
  } = {},
): ReactNode {
  const items: OverflowItem[] = [];
  if (!options.excludeMakePartner) {
    items.push({ label: "Make Partner ★", onClick: cb.onMarkPartner, tone: "celebration" });
  }
  if (options.extraItems) items.push(...options.extraItems);
  return <OverflowMenu items={items} onStopOutreach={cb.onStopOutreach} />;
}

export function buildRowSlots(tab: TabKey, row: TabRow, cb: RowCardCallbacks): RowSlots {
  if (tab === "prospects") return researchSlots(row, cb);
  if (tab === "calls") return callsSlots(row, cb);
  if (tab === "replies") return repliesSlots(row, cb);
  if (tab === "meetings") return meetingsSlots(row, cb);
  if (tab === "partners") return partnersSlots(row, cb);
  if (tab === "archive") return archiveSlots(row, cb);
  return allSlots(row, cb);
}

function researchSlots(row: TabRow, cb: RowCardCallbacks): RowSlots {
  const pill =
    row.status === "researched"
      ? <Pill title="Has contact + programs — ready to start the email sequence.">Ready to email</Pill>
      : <Pill title="Add a contact and programs in the drawer, then start outreach.">Needs contact</Pill>;
  return {
    pill,
    cta: (
      <PrimaryAction
        onClick={cb.onOpenDrawer}
        title="Open the drawer to review research + email cadence, then start outreach."
      >
        Start Outreach
      </PrimaryAction>
    ),
    overflowMenu: buildUniversalOverflow(cb),
  };
}

function callsSlots(row: TabRow, cb: RowCardCallbacks): RowSlots {
  return {
    footnote: row.due_call_task ? (
      <p className="mt-0.5 text-[11px] text-gray-400">
        {formatDueDate(row.due_call_task.due_at)}
      </p>
    ) : null,
    headlineAccessory: row.primary_contact_phone ? (
      <a
        href={`tel:${row.primary_contact_phone}`}
        onClick={(e) => e.stopPropagation()}
        title="Tap to dial (mobile) — opens the default phone app."
        className="shrink-0 text-xs text-emerald-700 underline hover:no-underline"
      >
        📞 {row.primary_contact_phone}
      </a>
    ) : null,
    cta: <PrimaryAction onClick={cb.onLogCallOutcome}>Log call</PrimaryAction>,
    overflowMenu: buildUniversalOverflow(cb),
  };
}

function repliesSlots(row: TabRow, cb: RowCardCallbacks): RowSlots {
  // v8.10.12: standardized layout. Pill stacks under the footnote (last
  // activity / followup-notes quote). CTA is bottom-right. Overflow is
  // top-right.
  const lastActivityFootnote = row.last_activity_at ? (
    <p className="mt-0.5 text-[11px] text-gray-400">
      Last activity {formatRelative(row.last_activity_at)}
    </p>
  ) : null;
  const state: RepliesState = row.replies_state ?? "mid_cadence";
  switch (state) {
    case "mid_cadence":
      return {
        footnote: lastActivityFootnote,
        cta: (
          <PrimaryAction
            onClick={() => cb.onClassifyReply("email_reply")}
            title="Saw a reply in Gmail? Click to record what they said."
          >
            Log reply
          </PrimaryAction>
        ),
        overflowMenu: buildUniversalOverflow(cb),
      };
    case "engaged":
      return {
        footnote: lastActivityFootnote,
        pill: <Pill>Replied</Pill>,
        cta: <PrimaryAction onClick={() => cb.onClassifyReply("email_reply")}>Log reply</PrimaryAction>,
        overflowMenu: buildUniversalOverflow(cb),
      };
    case "wants_meeting":
      return {
        footnote: lastActivityFootnote,
        pill: <Pill>Wants to meet</Pill>,
        cta: <PrimaryAction onClick={() => cb.onClassifyReply("email_reply")}>Log reply</PrimaryAction>,
        overflowMenu: buildUniversalOverflow(cb),
      };
    case "booked":
      return {
        pill: <Pill>{row.meeting_at ? `Booked · ${formatLongDate(row.meeting_at)}` : "Booked"}</Pill>,
        overflowMenu: buildUniversalOverflow(cb),
      };
    case "needs_followup":
      return {
        footnote: row.followup_notes ? (
          <ExpandableNote text={row.followup_notes} />
        ) : lastActivityFootnote,
        pill: <Pill>Met — needs follow-up</Pill>,
        cta: <PrimaryAction onClick={() => cb.onClassifyReply("email_reply")}>Log reply</PrimaryAction>,
        overflowMenu: buildUniversalOverflow(cb),
      };
    case "awaiting_callback":
      return {
        footnote: lastActivityFootnote,
        pill: (
          <Pill>
            {row.awaiting_callback_kind === "promised" ? "Promised callback" : "Voicemail"}
            {row.awaiting_callback_at ? ` · ${formatShortRelative(row.awaiting_callback_at)}` : ""}
          </Pill>
        ),
        cta: <PrimaryAction onClick={() => cb.onClassifyReply("callback")}>Log reply</PrimaryAction>,
        overflowMenu: buildUniversalOverflow(cb),
      };
    case "stale":
      return {
        pill: <Pill>Stale{row.stale_days != null ? ` · ${row.stale_days}d` : ""}</Pill>,
        overflowMenu: buildUniversalOverflow(cb),
      };
  }
}

function meetingsSlots(row: TabRow, cb: RowCardCallbacks): RowSlots {
  const lastActivityFootnote = row.last_activity_at ? (
    <p className="mt-0.5 text-[11px] text-gray-400">
      Last activity {formatRelative(row.last_activity_at)}
    </p>
  ) : null;
  const pill =
    row.meeting_state === "scheduled" ? (
      <Pill title="Meeting is on the calendar.">
        {row.meeting_at ? `Booked · ${formatLongDate(row.meeting_at)}` : "Booked"}
      </Pill>
    ) : (
      <Pill>Finding a time</Pill>
    );
  const ctaLabel = row.meeting_state === "scheduled" ? "Complete" : "Log Meeting";
  return {
    footnote: lastActivityFootnote,
    pill,
    cta: <PrimaryAction onClick={cb.onLogMeeting}>{ctaLabel}</PrimaryAction>,
    overflowMenu: buildUniversalOverflow(cb),
  };
}

function partnersSlots(row: TabRow, cb: RowCardCallbacks): RowSlots {
  return {
    footnote: row.last_activity_at ? (
      <p className="mt-0.5 text-[11px] text-gray-400">
        Last activity {formatRelative(row.last_activity_at)}
      </p>
    ) : null,
    cta: (
      <PrimaryAction
        onClick={cb.onOpenDrawer}
        title="Open the drawer to work pending partner tasks (task board posting, materials, follow-ups)."
      >
        Engage
      </PrimaryAction>
    ),
    overflowMenu: buildUniversalOverflow(cb, { excludeMakePartner: true }),
  };
}

function archiveSlots(row: TabRow, cb: RowCardCallbacks): RowSlots {
  const isClosed = row.status === "no_response_closed";
  const pillLabel = isClosed
    ? `No response${row.stale_days != null ? ` · ${row.stale_days}d cold` : ""}`
    : `Stale${row.stale_days != null ? ` · ${row.stale_days}d cold` : ""}`;
  return {
    footnote: row.last_activity_at ? (
      <p className="mt-0.5 text-[11px] text-gray-400">
        Last activity {formatRelative(row.last_activity_at)}
      </p>
    ) : null,
    pill: (
      <Pill title="Cadence ran without engagement. Logging a reply or callback re-routes them to Replies.">
        {pillLabel}
      </Pill>
    ),
    cta: (
      <PrimaryAction
        onClick={() => cb.onClassifyReply("email_reply")}
        title="They replied or called back. Log it to re-route this row to Replies."
      >
        Log reply
      </PrimaryAction>
    ),
    overflowMenu: buildUniversalOverflow(cb, {
      extraItems: [{ label: "Log reply (callback)", onClick: () => cb.onClassifyReply("callback") }],
    }),
  };
}

function allSlots(row: TabRow, cb: RowCardCallbacks): RowSlots {
  const isAlreadyPartner = row.status === "active_partner";
  return {
    footnote: row.last_activity_at ? (
      <p className="mt-0.5 text-[11px] text-gray-400">
        Last activity {formatRelative(row.last_activity_at)}
      </p>
    ) : null,
    pill: <Pill title="Stage in the funnel.">{STATUS_LABELS[row.status] ?? row.status}</Pill>,
    overflowMenu: buildUniversalOverflow(cb, { excludeMakePartner: isAlreadyPartner }),
  };
}
