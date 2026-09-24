/**
 * Benefits automation guards: the rules that decide when the cascade must stop
 * talking and let a person take over.
 *
 * Pure module, no server or DB imports, so the SMS webhook, the support-email
 * sync, the coordinator, the navigator send path and the admin queue all read
 * one definition of "paused", "deceased" and "owned help case".
 *
 * Why this exists (2026-09-24 audit):
 *  - A Texas family replied on Sep 3 that the program did not fit, and on
 *    Sep 5 still received "How is it going with STAR+PLUS?". Nothing that
 *    heard their reply could stop the next automated touch.
 *  - A family reported the person had died, and the cascade kept going.
 *  - Six families tapped "I'd like help" on /benefits-outcome, which promised
 *    a person within a day or two. One got a person. The tap paged Slack once
 *    and then depended on someone remembering.
 */

// ── Automation hold ────────────────────────────────────────────────────────

export type BenefitsHoldReason =
  /** A free-form text, or STUCK / NOT ELIGIBLE, from the family. */
  | "sms_reply"
  /** An email reply that landed in the support inbox. */
  | "email_reply"
  /** The family told us the person receiving care has died. */
  | "deceased"
  /** The family texted STOP. Texts stop by law; the benefits emails stop
   *  with them until a person decides otherwise. */
  | "sms_opt_out";

/**
 * metadata.benefits_automation_hold. Set by anything that hears the family
 * speak; cleared only by a person (the "Resume automation" button, or logging
 * a contact / resolving the case in /admin/benefits).
 */
export interface BenefitsAutomationHold {
  held_at: string;
  reason: BenefitsHoldReason;
  channel: "sms" | "email";
  /** First 200 characters of what they said, for the admin chip. */
  excerpt?: string;
  cleared_at?: string;
  cleared_by?: string;
}

export function readBenefitsHold(
  meta: Record<string, unknown> | null | undefined,
): BenefitsAutomationHold | null {
  const raw = (meta as { benefits_automation_hold?: unknown } | null | undefined)
    ?.benefits_automation_hold;
  return raw && typeof raw === "object" ? (raw as BenefitsAutomationHold) : null;
}

/** True while a family reply is waiting on a human. A newer reply after a
 *  clear re-holds, because held_at moves forward and cleared_at does not. */
export function isBenefitsAutomationHeld(meta: Record<string, unknown> | null | undefined): boolean {
  const hold = readBenefitsHold(meta);
  if (!hold?.held_at) return false;
  return !hold.cleared_at || hold.cleared_at < hold.held_at;
}

export function nextHold(
  reason: BenefitsHoldReason,
  channel: "sms" | "email",
  excerpt: string | null,
  at: string,
): BenefitsAutomationHold {
  return {
    held_at: at,
    reason,
    channel,
    ...(excerpt ? { excerpt: excerpt.replace(/\s+/g, " ").trim().slice(0, 200) } : {}),
  };
}

/**
 * Holds only the explicit "Resume automation" button lifts. A person
 * answering the family (support inbox, SMS inbox) or logging a contact is
 * not a reason to resume "How is it going?" after a death report, or to
 * resume emailing someone who just texted STOP.
 */
const EXPLICIT_RESUME_REASONS = new Set<BenefitsHoldReason>(["deceased", "sms_opt_out"]);

export function holdNeedsExplicitResume(meta: Record<string, unknown> | null | undefined): boolean {
  const hold = readBenefitsHold(meta);
  return !!hold && isBenefitsAutomationHeld(meta) && EXPLICIT_RESUME_REASONS.has(hold.reason);
}

/**
 * Metadata with a new hold, without downgrading a stronger one: a later
 * "thanks" after a death report or a STOP must not turn that hold into an
 * ordinary reply hold that the next inbox answer would lift. A death report
 * outranks everything.
 */
export function withReplyHold(
  meta: Record<string, unknown>,
  reason: BenefitsHoldReason,
  channel: "sms" | "email",
  excerpt: string | null,
  at: string,
): Record<string, unknown> {
  const current = isBenefitsAutomationHeld(meta) ? readBenefitsHold(meta) : null;
  if (current?.reason === "deceased" && reason !== "deceased") return meta;
  if (current && EXPLICIT_RESUME_REASONS.has(current.reason) && !EXPLICIT_RESUME_REASONS.has(reason)) {
    return meta;
  }
  return { ...meta, benefits_automation_hold: nextHold(reason, channel, excerpt, at) };
}

export function clearedHold(
  hold: BenefitsAutomationHold | null,
  by: string,
  at: string,
): BenefitsAutomationHold | null {
  if (!hold) return null;
  return { ...hold, cleared_at: at, cleared_by: by };
}

/** Is this a benefits-intake family at all? Same test the webhook uses. */
export function isBenefitsFamilyMeta(meta: Record<string, unknown> | null | undefined): boolean {
  const m = (meta || {}) as Record<string, unknown>;
  return Boolean(m.benefits_results || m.benefits_cascade || m.benefits_navigator);
}

/**
 * A family whose only reason for being on Olera is the benefits finder: they
 * completed the benefits intake and never reached out to a provider.
 *
 * Marketplace profile nudges ("finish your profile", "publish your care post",
 * "Providers near you") are written for someone shopping for a provider. Sent
 * to this cohort they were 973 emails between Jul 25 and Sep 24, and because
 * they share the family nudge cap they blocked the benefits check-ins these
 * families actually asked for.
 */
export function isBenefitsOnlyFamily(
  meta: Record<string, unknown> | null | undefined,
  hasProviderConnection: boolean,
): boolean {
  const results = (meta as { benefits_results?: { completed_at?: unknown } } | null | undefined)
    ?.benefits_results;
  return Boolean(results?.completed_at) && !hasProviderConnection;
}

// ── Deceased detection ─────────────────────────────────────────────────────

/**
 * Phrases that suggest someone in the family has died. Deliberately narrow,
 * and the consequence is deliberately reversible: a match pauses automation
 * and suppresses nudges, and pages a person to check. It never dismisses a
 * letter or deletes anything, because "my husband died last year and I need
 * help" comes from a live widow who is exactly who the finder is for.
 *
 * Bare "passed" is excluded ("she passed the screening"), and so are bare
 * "has passed" ("the deadline has passed") and bare "passed on" ("I passed
 * on the info"): both only count after a person ("my wife has passed", "mom
 * passed on Monday"). "died" counts unless a device died ("my phone died").
 * "death" and "funeral" alone are excluded because they name documents and
 * programs (death certificate, funeral assistance) far more often than news;
 * "funeral for" is news.
 */
const PERSON =
  "(?:he|she|they|mom|mum|mama|mother|dad|papa|father|husband|wife|spouse|partner|grandma|grandmother|grandpa|grandfather|son|daughter|brother|sister|aunt|uncle|parent|parents)";
const MONTH = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*";
const DEVICE_DIED =
  /\b(?:phone|cellphone|cell|iphone|ipad|battery|car|truck|engine|computer|laptop|tablet|charger|tv|internet|printer)\s+(?:\w+\s+)?died\b/g;
const DECEASED_PATTERNS: RegExp[] = [
  /\bpass(?:ed|ing)? away\b/,
  // "dad passed", "my wife has passed", "she passed on", ending a clause.
  new RegExp(`\\b${PERSON}\\s+(?:has\\s+|had\\s+|just\\s+|recently\\s+)?passed(?:\\s+on)?\\s*(?:[,;]|$)`),
  // "mom passed on Monday", "he passed in August", "she passed last week".
  // "she passed on the info" and "he passed this test" do not match.
  new RegExp(
    `\\b${PERSON}\\s+(?:has\\s+|had\\s+|just\\s+|recently\\s+)?passed\\s+` +
      `(?:on\\s+(?:\\w+day|the\\s+\\d|\\d|${MONTH})|in\\s+(?:${MONTH}|\\d|her sleep|his sleep|the hospital)|` +
      `yesterday|today|recently|earlier|last|this (?:morning|afternoon|evening|week|month|year|past))\\b`,
  ),
  /\bpassed last (?:week|month|year|night|spring|summer|fall|winter|\w+day)\b/,
  /\b(?:is|was|now|recently|became)\s+deceased\b/,
  new RegExp(`\\bmy (?:late|deceased) ${PERSON}\\b`),
  /\bdied\b/,
  /\bfuneral for\b/,
  /\bno longer (?:with us|living|alive)\b/,
  /\brest in peace\b/,
];

export function detectDeceased(body: string | null | undefined): boolean {
  if (!body) return false;
  const text = body
    .toLowerCase()
    .replace(/[‘’ʼ']/g, "")
    .replace(/[.!]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    // "my phone died" is not news; a person dying elsewhere in the same
    // message still matches.
    .replace(DEVICE_DIED, " ");
  return DECEASED_PATTERNS.some((re) => re.test(text));
}

// ── Owned help case ────────────────────────────────────────────────────────

/**
 * Ownership fields layered onto metadata.benefits_case (BenefitsCaseMeta in
 * benefits-cascade.server.ts keeps notes / contacted_at / resolved_at). They
 * live beside those fields so every existing case action keeps working.
 */
export interface BenefitsHelpCase {
  help_opened_at?: string;
  help_reason?: "wants_help" | "stuck";
  help_owner?: string;
  /** Two business days after opening: the promise the family was shown. */
  help_due_at?: string;
  /** Stamped when the overdue escalation fires, so it pages once. */
  help_escalated_at?: string;
  contacted_at?: string;
  resolved_at?: string;
}

/** Who a new help case is assigned to. One named owner, not "the team". */
export function defaultHelpOwner(): string {
  return process.env.BENEFITS_HELP_OWNER?.trim() || "TJ";
}

/**
 * Add N business days (Mon-Fri) in US Eastern, landing at 6pm ET. Holidays
 * are ignored: the promise is "usually within 2 business days", and a due
 * date that is a day early is the safe direction to be wrong in.
 */
export function addBusinessDays(fromIso: string, days: number): string {
  // Count on the Eastern calendar date. Shifting by 5h makes the UTC fields
  // read as the ET wall clock (within an hour across DST), so a request at
  // 9pm ET Thursday counts from Thursday, not from the UTC Friday it already
  // is. Counting on the UTC date put evening requests a day late.
  const d = new Date(new Date(fromIso).getTime() - 5 * 3600e3);
  let added = 0;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  // 22:00 UTC on that ET date = 6pm EDT / 5pm EST, end of the working day.
  d.setUTCHours(22, 0, 0, 0);
  return d.toISOString();
}

/**
 * Open a help case on the existing case record, or return null when one is
 * already open and unresolved (a re-tap must not reset the clock or re-page).
 */
export function openHelpCase(
  existing: BenefitsHelpCase,
  reason: "wants_help" | "stuck",
  at: string,
): BenefitsHelpCase | null {
  const alreadyOpen =
    !!existing.help_opened_at &&
    !(existing.resolved_at && existing.resolved_at > existing.help_opened_at);
  if (alreadyOpen) return null;
  return {
    ...existing,
    help_opened_at: at,
    help_reason: reason,
    help_owner: defaultHelpOwner(),
    help_due_at: addBusinessDays(at, 2),
    help_escalated_at: undefined,
    resolved_at: undefined,
  };
}

/** Open, owned, and nobody has logged a contact since it opened. */
export function helpCaseWaiting(c: BenefitsHelpCase): boolean {
  if (!c.help_opened_at) return false;
  if (c.resolved_at && c.resolved_at > c.help_opened_at) return false;
  if (c.contacted_at && c.contacted_at > c.help_opened_at) return false;
  return true;
}

// ── Metadata patches ───────────────────────────────────────────────────────

/** Where nudges_unsubscribed came from when WE set it on a deceased report,
 *  so a person clearing a false positive can undo exactly that and nothing
 *  the family chose themselves. */
export const DECEASED_UNSUB_SOURCE = "deceased_reported";

/**
 * Metadata after the family told us someone died: automation held, every
 * family nudge suppressed through the flag the coordinator, family-nudges and
 * the navigator send path all check. Reversible from the admin queue.
 */
export function withDeceasedReport(
  meta: Record<string, unknown>,
  channel: "sms" | "email",
  excerpt: string | null,
  at: string,
): Record<string, unknown> {
  const alreadyUnsubscribed = meta.nudges_unsubscribed === true;
  return {
    ...withReplyHold(meta, "deceased", channel, excerpt, at),
    benefits_deceased_reported_at: at,
    ...(alreadyUnsubscribed
      ? {}
      : {
          nudges_unsubscribed: true,
          nudges_unsubscribed_at: at,
          nudges_unsubscribed_source: DECEASED_UNSUB_SOURCE,
        }),
  };
}

/**
 * Metadata after a person resumes automation. Undoes a deceased-report
 * unsubscribe only when we set it; a family's own unsubscribe is never
 * touched here.
 */
export function withHoldCleared(
  meta: Record<string, unknown>,
  by: string,
  at: string,
): Record<string, unknown> {
  const hold = readBenefitsHold(meta);
  if (!hold || !isBenefitsAutomationHeld(meta)) return meta;
  const next: Record<string, unknown> = {
    ...meta,
    benefits_automation_hold: clearedHold(hold, by, at),
  };
  if (hold.reason === "deceased" && meta.nudges_unsubscribed_source === DECEASED_UNSUB_SOURCE) {
    delete next.nudges_unsubscribed;
    delete next.nudges_unsubscribed_at;
    delete next.nudges_unsubscribed_source;
  }
  return next;
}
