import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

/**
 * When the paying provider is next charged, read from Stripe.
 *
 * Cortex used the Ad Boost flight end (`flight_end_date`, Oct 20 for Hoop
 * Cares) as "the renewal". It is not. Stripe's subscription for the same
 * provider bills monthly from Sep 15: current period Sep 15 to Oct 15, next
 * invoice $75 on Oct 15 (checked in the dashboard on 2026-09-25). The note in
 * the scratchpad that said "Oct 15 renewal" was right, and so was the sweep
 * run that said "~20 days"; the code-computed fact was wrong.
 *
 * Supabase does not mirror the billing period for Ad Boost -- the webhook only
 * syncs `plan_status` -- so this reads Stripe directly. When Stripe cannot be
 * read, it falls back to the flight end and says so, rather than presenting
 * the flight end as a renewal again.
 */
export type PaidRenewal = {
  name: string;
  /** The next charge, YYYY-MM-DD, when Stripe could be read. */
  renewsOn: string | null;
  daysUntilRenewal: number | null;
  amount: number | null;
  /** The ad flight's end, which is a different date. */
  flightEndsOn: string | null;
  daysUntilFlightEnd: number | null;
  source: "stripe" | "flight_end";
};

const daysUntil = (iso: string | null, now: number) =>
  iso ? Math.ceil((Date.parse(iso) - now) / 86_400_000) : null;

type PaidRow = {
  display_name: string | null;
  provider_slug: string | null;
  flight_end_date: string | null;
  stripe_subscription_id: string | null;
  plan_value: number | null;
};

/** The soonest renewal among paying Ad Boost providers. Null when nobody pays. */
export async function loadPaidRenewal(db: SupabaseClient, now = Date.now()): Promise<PaidRenewal | null> {
  const { data, error } = await db.from("ad_campaign_requests")
    .select("display_name, provider_slug, flight_end_date, stripe_subscription_id, plan_value")
    .in("plan_status", ["active", "past_due"]);
  if (error || !data?.length) return null;
  const rows = data as PaidRow[];

  const renewals = await Promise.all(rows.map(async (row): Promise<PaidRenewal> => {
    const name = row.display_name ?? row.provider_slug ?? "The paying provider";
    const flightEndsOn = row.flight_end_date ? row.flight_end_date.slice(0, 10) : null;
    const base = {
      name,
      amount: row.plan_value,
      flightEndsOn,
      daysUntilFlightEnd: daysUntil(flightEndsOn, now),
    };
    if (row.stripe_subscription_id && isStripeConfigured()) {
      try {
        const subscription = await getStripe().subscriptions.retrieve(row.stripe_subscription_id);
        // The current API puts the period on the item; older ones on the subscription.
        const periodEnd = subscription.items.data[0]?.current_period_end
          ?? (subscription as unknown as { current_period_end?: number }).current_period_end;
        if (periodEnd && !subscription.cancel_at_period_end) {
          const renewsOn = new Date(periodEnd * 1000).toISOString();
          return { ...base, renewsOn: renewsOn.slice(0, 10), daysUntilRenewal: daysUntil(renewsOn, now), source: "stripe" };
        }
      } catch {
        // Fall through to the flight end, labelled as such.
      }
    }
    return { ...base, renewsOn: null, daysUntilRenewal: null, source: "flight_end" };
  }));

  const soonest = (renewal: PaidRenewal) => renewal.daysUntilRenewal ?? renewal.daysUntilFlightEnd ?? Number.POSITIVE_INFINITY;
  return renewals
    .filter((renewal) => soonest(renewal) >= 0 && Number.isFinite(soonest(renewal)))
    .sort((a, b) => soonest(a) - soonest(b))[0] ?? null;
}
