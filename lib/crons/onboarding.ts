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

// ── Local family demand ────────────────────────────────────────────────────
//
// The profile-preview email leads with "families are searching in {city}".
// That claim has to be TRUE for the provider reading it, so it is measured
// rather than assumed. There are only ~189 active seekers on the platform, and
// most cities have none, so the majority of providers correctly get the neutral
// version of this email instead.

/** Same radius the weekly digest's Find Families rung uses. */
export const SEEKER_RADIUS_MILES = 50;

export interface SeekerPoint {
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
}

const EARTH_MI = 3958.8;
const toRad = (d: number) => (d * Math.PI) / 180;

function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_MI * Math.asin(Math.sqrt(h));
}

/**
 * Families with a live, published care post. Selected here rather than through
 * the digest's helper because we also need `state`, to disambiguate the
 * city-name fallback (there is more than one Springfield).
 */
export async function loadActiveSeekers(
  db: { from: (t: string) => any },
): Promise<SeekerPoint[]> {
  // Status filtered in the QUERY, not in JS afterwards. Filtering after a fetch
  // is what let provider_incomplete_profile silently starve behind a row cap.
  const { data, error } = await db
    .from("business_profiles")
    .select("city, state, lat, lng")
    .eq("type", "family")
    .eq("is_active", true)
    .eq("metadata->care_post->>status", "active");
  if (error) {
    // Degrade to "no known demand" → every provider gets the neutral copy.
    // Never let a failed lookup manufacture a demand claim.
    console.error("[onboarding] seeker load failed:", error.message);
    return [];
  }
  return (data ?? []) as SeekerPoint[];
}

/**
 * How many seekers are genuinely near this provider. Distance when both sides
 * have coordinates, else an exact city+state match. Returns 0 when we cannot
 * tell, because the caller uses this to decide whether to assert demand.
 */
export function countSeekersNear(
  seekers: SeekerPoint[],
  provider: { lat?: number | null; lng?: number | null; city?: string | null; state?: string | null },
): number {
  const pCity = (provider.city ?? "").trim().toLowerCase();
  const pState = (provider.state ?? "").trim().toLowerCase();
  let n = 0;
  for (const s of seekers) {
    if (provider.lat != null && provider.lng != null && s.lat != null && s.lng != null) {
      if (milesBetween(provider.lat, provider.lng, s.lat, s.lng) <= SEEKER_RADIUS_MILES) n++;
      continue;
    }
    if (!pCity || !pState) continue;
    if ((s.city ?? "").trim().toLowerCase() === pCity && (s.state ?? "").trim().toLowerCase() === pState) n++;
  }
  return n;
}
