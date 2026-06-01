/**
 * The one place "how alive is this connection, and whose turn is it?" is
 * decided — so the connections tracker, the nudge crons, and the analytics
 * funnels all agree on what "the provider responded" and "a successful
 * connection" mean.
 *
 * A connection is a `connections` row linking a family (from_profile_id) and a
 * provider (to_profile_id). Conversation lives in `metadata.thread` — an array
 * of messages, each tagged with its author (`from_profile_id`) and whether it
 * was an automated system reply (`is_auto_reply`). Auto-replies don't count as
 * a human reaching out.
 *
 * Canonical definitions (approved 2026-06-01):
 *   - provider responded  = the provider posted a non-auto thread message
 *   - successful connection = provider responded OR status === "accepted"
 *   - temperature           = whose turn it is + how stale that turn has gone
 *
 * Pure logic — no I/O. `now` is injectable so the states can be unit-tested.
 */

export interface ThreadMessage {
  from_profile_id?: string;
  text?: string;
  created_at?: string;
  is_auto_reply?: boolean;
}

/**
 * The minimal connection shape this module needs. Admin routes pass partial,
 * join-shaped row objects rather than a full `Connection`, so we accept any
 * object carrying these fields.
 */
export interface ConnectionLike {
  from_profile_id: string;
  to_profile_id: string;
  status?: string | null;
  created_at?: string;
  metadata?: Record<string, unknown> | null;
}

export type ConnectionTemperatureState =
  | "awaiting_provider"
  | "awaiting_family"
  | "live"
  | "going_cold"
  | "closed";

export type WaitingOn = "provider" | "family" | null;

export interface ConnectionTemperature {
  state: ConnectionTemperatureState;
  /** Who the ball is with (null for `live` / `closed`). */
  waitingOn: WaitingOn;
  /** ms since the last meaningful event (last human message, else created_at). */
  stalenessMs: number;
  /** ISO timestamp of that last meaningful event. */
  lastEventAt: string | null;
  /** Author of the last human message: profile id, or null if only the inquiry exists. */
  lastActorId: string | null;
  /** True once the provider has replied OR the connection was accepted. */
  isSuccessful: boolean;
  isClosed: boolean;
  /** Short human label, e.g. "Awaiting provider", "Going cold". */
  label: string;
}

// ── Thresholds (named so they're easy to tune in one place) ──

const DAY_MS = 24 * 60 * 60 * 1000;

/** An awaiting_* connection past this age is "going cold". */
export const GOING_COLD_MS = 3 * DAY_MS;

// ── Core predicates ──

/**
 * Predicates accept a deliberately permissive shape so existing admin routes
 * can pass their partial, join-shaped row objects — where `metadata` may be
 * typed as `Json`/`unknown` and `to_profile_id` may be nullable/optional —
 * without casts. `ConnectionLike` satisfies all of these.
 */
type ThreadCarrier = { metadata?: unknown };

export function getThread(conn: ThreadCarrier): ThreadMessage[] {
  const meta = (conn.metadata ?? {}) as Record<string, unknown>;
  return (meta.thread as ThreadMessage[]) || [];
}

/** Did the provider (to_profile_id) post a non-auto message? */
export function providerResponded(
  conn: ThreadCarrier & { to_profile_id?: string | null }
): boolean {
  return getThread(conn).some(
    (m) => m.from_profile_id === conn.to_profile_id && m.is_auto_reply !== true
  );
}

/** Did the family (from_profile_id) post a non-auto message with text? */
export function familyResponded(
  conn: ThreadCarrier & { from_profile_id?: string | null }
): boolean {
  return getThread(conn).some(
    (m) =>
      m.from_profile_id === conn.from_profile_id &&
      !!m.text &&
      m.is_auto_reply !== true
  );
}

/**
 * The canonical KPI predicate: a successful connection is one where the
 * provider actually engaged (replied) or the connection was accepted.
 */
export function isSuccessfulConnection(
  conn: ThreadCarrier & { to_profile_id?: string | null; status?: string | null }
): boolean {
  return conn.status === "accepted" || providerResponded(conn);
}

function isClosedConnection(conn: ConnectionLike): boolean {
  if (conn.status === "declined" || conn.status === "expired") return true;
  const meta = (conn.metadata ?? {}) as Record<string, unknown>;
  return !!meta.ended || !!meta.withdrawn || !!meta.archived;
}

/** Last non-auto message (any author), used to find who acted last + when. */
function lastHumanMessage(conn: ConnectionLike): ThreadMessage | null {
  const human = getThread(conn).filter(
    (m) => m.is_auto_reply !== true && !!m.from_profile_id
  );
  if (human.length === 0) return null;
  // Thread is append-ordered, but sort defensively on created_at when present.
  return human.reduce((latest, m) => {
    if (!latest) return m;
    const lt = latest.created_at ? new Date(latest.created_at).getTime() : 0;
    const mt = m.created_at ? new Date(m.created_at).getTime() : 0;
    return mt >= lt ? m : latest;
  }, null as ThreadMessage | null);
}

const LABELS: Record<ConnectionTemperatureState, string> = {
  awaiting_provider: "Awaiting provider",
  awaiting_family: "Awaiting family",
  live: "Live",
  going_cold: "Going cold",
  closed: "Closed",
};

/**
 * Compute the full temperature of a connection.
 *
 * State logic:
 *   - closed             → declined/expired/ended/withdrawn/archived
 *   - awaiting_provider  → provider has not replied (ball with provider)
 *   - awaiting_family    → provider replied last; family hasn't answered since
 *   - live               → both have replied and the family spoke last
 *   - going_cold         → any awaiting_* state older than GOING_COLD_MS
 */
export function getConnectionTemperature(
  conn: ConnectionLike,
  now: number = Date.now()
): ConnectionTemperature {
  const last = lastHumanMessage(conn);
  const lastEventAt = last?.created_at ?? conn.created_at ?? null;
  const stalenessMs = lastEventAt
    ? Math.max(0, now - new Date(lastEventAt).getTime())
    : 0;
  const lastActorId = last?.from_profile_id ?? null;
  const isSuccessful = isSuccessfulConnection(conn);

  const base = (): { state: ConnectionTemperatureState; waitingOn: WaitingOn } => {
    if (isClosedConnection(conn)) return { state: "closed", waitingOn: null };
    if (!providerResponded(conn))
      return { state: "awaiting_provider", waitingOn: "provider" };
    // Provider has replied — whose turn now depends on who spoke last.
    if (lastActorId === conn.to_profile_id)
      return { state: "awaiting_family", waitingOn: "family" };
    return { state: "live", waitingOn: null };
  };

  let { state, waitingOn } = base();

  // An awaiting_* turn that has gone stale escalates to "going cold".
  if (
    (state === "awaiting_provider" || state === "awaiting_family") &&
    stalenessMs > GOING_COLD_MS
  ) {
    state = "going_cold";
  }

  return {
    state,
    waitingOn,
    stalenessMs,
    lastEventAt,
    lastActorId,
    isSuccessful,
    isClosed: state === "closed",
    label: LABELS[state],
  };
}

// ── Display config + sort order (consumed by the tracker UI) ──

/**
 * Sort priority for the intervention queue — lower = needs attention sooner.
 * going_cold first, then the side we're waiting on, then live, then closed.
 */
export const INTERVENTION_PRIORITY: Record<ConnectionTemperatureState, number> = {
  going_cold: 0,
  awaiting_provider: 1,
  awaiting_family: 2,
  live: 3,
  closed: 4,
};

/**
 * Calm, warm palette — one base hue per state. The dot fades as the
 * connection cools (see `dotOpacityForStaleness`); deliberately NOT a
 * red/amber/green heatmap.
 */
export const TEMPERATURE_CONFIG: Record<
  ConnectionTemperatureState,
  { label: string; dot: string; text: string }
> = {
  awaiting_provider: {
    label: "Awaiting provider",
    dot: "bg-amber-400",
    text: "text-amber-700",
  },
  awaiting_family: {
    label: "Awaiting family",
    dot: "bg-teal-400",
    text: "text-teal-700",
  },
  live: { label: "Live", dot: "bg-emerald-400", text: "text-emerald-700" },
  going_cold: {
    label: "Going cold",
    dot: "bg-stone-400",
    text: "text-stone-500",
  },
  closed: { label: "Closed", dot: "bg-gray-300", text: "text-gray-400" },
};

/**
 * Opacity for the temperature dot — fully lit when fresh, fading toward
 * GOING_COLD_MS. Clamped to [0.35, 1] so a cold dot is still visible.
 */
export function dotOpacityForStaleness(stalenessMs: number): number {
  const ratio = Math.min(1, Math.max(0, stalenessMs / GOING_COLD_MS));
  return Math.round((1 - ratio * 0.65) * 100) / 100;
}

// ── Next-step recommendation (what the operator should DO) ──

export type NextStepAction =
  | "nudge_provider"
  | "add_provider_email"
  | "nudge_family"
  | "none";

export interface NextStep {
  action: NextStepAction;
  /** One-line advice shown in the row's detail panel. */
  label: string;
}

/**
 * Turn a connection's temperature into a concrete next step for the operator.
 * The queue is only useful if it tells you what to do — this is that.
 */
export function recommendNextStep(
  t: ConnectionTemperature,
  opts: { providerHasEmail: boolean; nudgeCount: number }
): NextStep {
  if (t.state === "closed") {
    return { action: "none", label: "Closed — no action needed." };
  }
  if (t.state === "live") {
    return { action: "none", label: "Healthy — both sides are talking." };
  }
  // Provider replied, family went quiet.
  if (t.waitingOn === "family") {
    return {
      action: "nudge_family",
      label: `Provider replied; the family went quiet (${formatAge(t.stalenessMs)}). Nudge the family to reply.`,
    };
  }
  // Ball is with the provider (awaiting_provider, or going_cold on the provider side).
  if (!opts.providerHasEmail) {
    return {
      action: "add_provider_email",
      label: "No provider email on file — add one so this lead can be delivered.",
    };
  }
  const age = formatAge(t.stalenessMs);
  if (opts.nudgeCount > 0) {
    return {
      action: "nudge_provider",
      label: `Provider nudged ${opts.nudgeCount}× and still hasn't replied (${age}). Nudge again.`,
    };
  }
  return {
    action: "nudge_provider",
    label: `Provider hasn't replied (${age}). Send a nudge.`,
  };
}

/** Compact relative age, e.g. "3h", "6d", "2w". */
export function formatAge(stalenessMs: number): string {
  const mins = Math.floor(stalenessMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}
