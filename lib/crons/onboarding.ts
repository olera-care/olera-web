/**
 * Shared timing for the provider onboarding sequence.
 *
 * One place so the crons that SEND onboarding email and the digest that yields
 * to it cannot drift apart. A provider is "in onboarding" for a fixed window
 * after their welcome email, and the window is sized to the emails that are
 * actually live — not to the emails we plan to add.
 */

/** Hours after the welcome email before the profile-preview email may send. */
export const ONBOARDING_PREVIEW_DELAY_HOURS = 48;

/**
 * How long after the welcome email a provider counts as "in onboarding".
 *
 * Only the digest's profile-completion rung yields to this, and only because
 * that rung asks for the same thing the profile-preview email asks for
 * ("see what families see on X" vs "families are searching in your city").
 * The rest of the digest still sends: it runs 53% open and 36% click, the best
 * of any provider email, and there is no measured over-mailing harm to justify
 * muting it (3 spam complaints in 10,112 August sends, and no opt-out
 * difference between providers who got 1 email in week one and those who got
 * 4+). Suppressing a duplicate ASK is worth it. Suppressing volume is not.
 *
 * Widen this when a later onboarding email lands that duplicates another rung.
 * Sized today for welcome (day 0) + profile preview (day 2).
 */
export const ONBOARDING_WINDOW_DAYS = 4;

/**
 * True while a provider is inside the onboarding window.
 *
 * Fails OPEN on purpose. A missing or malformed welcome timestamp means "not in
 * onboarding", so the digest sends as normal. This gate sits in front of the
 * highest-performing email in the system; the cost of wrongly sending one
 * completion rung is a duplicate ask, and the cost of wrongly suppressing is
 * losing the best email we have.
 */
export function isInOnboarding(
  metadata: Record<string, unknown> | null | undefined,
  now: number = Date.now(),
): boolean {
  const sentAt = (metadata ?? {}).welcome_email_sent_at as string | undefined;
  if (!sentAt) return false;
  const ts = Date.parse(sentAt);
  if (!Number.isFinite(ts)) return false;
  const ageDays = (now - ts) / (24 * 60 * 60 * 1000);
  // Negative age = a clock-skewed future timestamp. Not a reason to suppress.
  if (ageDays < 0) return false;
  return ageDays < ONBOARDING_WINDOW_DAYS;
}
