/**
 * MedJobs client helpers — trial / pilot status derivation for providers.
 *
 * v9.0: a "Client" is a provider that has either:
 *   1. Accepted T&C at first interview scheduling (entered the 90-day pilot)
 *   2. An active Stripe subscription (medjobs_subscription_active = true)
 *
 * The pilot signal is `metadata.interview_terms_accepted_at` — written
 * by /api/medjobs/interviews when a provider schedules with `termsAcceptedAt`.
 * No new schema field is needed; we derive pilot windows from that
 * timestamp + a 90-day window.
 */

const PILOT_DAYS = 90;

export interface ProviderMetadata {
  medjobs_subscription_active?: boolean;
  medjobs_stripe_customer_id?: string;
  medjobs_subscription_id?: string;
  medjobs_credits_used?: number;
  interview_terms_accepted_at?: string; // ISO 8601
}

export type ClientStatus =
  | "in_pilot"      // T&C accepted, within 90-day window
  | "pilot_expired" // T&C accepted, past 90 days, no paid subscription
  | "subscribed"    // medjobs_subscription_active === true (overrides pilot status)
  | "not_client";   // neither

export interface ClientStatusInfo {
  status: ClientStatus;
  pilotStartedAt: Date | null;
  pilotEndsAt: Date | null;
  daysRemainingInPilot: number | null;
  isClient: boolean; // shorthand for in_pilot or subscribed
}

export function pilotEndsAt(pilotStartedAt: Date): Date {
  const ends = new Date(pilotStartedAt);
  ends.setDate(ends.getDate() + PILOT_DAYS);
  return ends;
}

export function getClientStatus(metadata: ProviderMetadata | null | undefined): ClientStatusInfo {
  const meta = metadata ?? {};
  const subscribed = meta.medjobs_subscription_active === true;
  const acceptedAt = meta.interview_terms_accepted_at;

  if (!acceptedAt && !subscribed) {
    return {
      status: "not_client",
      pilotStartedAt: null,
      pilotEndsAt: null,
      daysRemainingInPilot: null,
      isClient: false,
    };
  }

  if (subscribed) {
    // Paid subscription overrides any pilot state. Show pilot window
    // anyway if T&C was accepted (admin context).
    const startedAt = acceptedAt ? new Date(acceptedAt) : null;
    return {
      status: "subscribed",
      pilotStartedAt: startedAt,
      pilotEndsAt: startedAt ? pilotEndsAt(startedAt) : null,
      daysRemainingInPilot: null,
      isClient: true,
    };
  }

  // Pilot path: T&C accepted, no subscription yet.
  const startedAt = new Date(acceptedAt!);
  const endsAt = pilotEndsAt(startedAt);
  const msRemaining = endsAt.getTime() - Date.now();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

  return {
    status: daysRemaining > 0 ? "in_pilot" : "pilot_expired",
    pilotStartedAt: startedAt,
    pilotEndsAt: endsAt,
    daysRemainingInPilot: daysRemaining,
    isClient: daysRemaining > 0, // pilot_expired without subscription = no longer a client
  };
}

/**
 * For Stripe dashboard deep-links. Admin viewing a client clicks through
 * to the live Stripe customer view in their dashboard.
 */
export function stripeDashboardUrl(customerId: string | null | undefined): string | null {
  if (!customerId) return null;
  return `https://dashboard.stripe.com/customers/${customerId}`;
}

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  in_pilot: "In pilot",
  pilot_expired: "Pilot ended",
  subscribed: "Subscribed",
  not_client: "—",
};
