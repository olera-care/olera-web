import type { SupabaseClient } from "@supabase/supabase-js";
import {
  claimedIdsAmong,
  countClaimedProviders,
  countListedProviders,
  listedProviderIdsInCity,
  PROVIDER_ID_CHUNK,
} from "@/lib/providers";

/**
 * CP1 and CP2 — the care provider lane.
 *
 * A note on what "city" means here, because it is NOT what it means further
 * left on the map. CR2 and CR4 scope by the *visitor's* city. CP1 and CP2
 * scope by the *provider's* city, which is the only reading that makes sense
 * for them: filtering to Houston should show Houston's providers, not the
 * providers Houston residents happened to look at. Both tooltips say which
 * they mean.
 */

const PAGE_SIZE = 1000;

/** Ceiling on rows scanned per channel, so one busy window cannot run away. */
const MAX_ROWS = 150_000;

export interface ProvidersListed {
  /** Every provider in the directory. */
  total: number;
  claimed: number;
  unclaimed: number;
}

/**
 * CP1 — providers listed, split by whether anyone has claimed them.
 *
 * "Listed" is any provider row that has not been deleted, the same rule as
 * the Directory's Published tab and this page's city picker. "Claimed" is a
 * business profile with an account behind it, the same test the Directory's
 * Unclaimed tab uses. Reusing both means the map cannot quietly disagree with
 * the pages people already work from.
 */
export async function getProvidersListed(
  db: SupabaseClient,
  citySlug: string | null = null,
): Promise<ProvidersListed> {
  if (!citySlug) {
    const [total, claimed] = await Promise.all([
      countListedProviders(db, null),
      countClaimedProviders(db),
    ]);
    return { total, claimed, unclaimed: Math.max(0, total - claimed) };
  }

  const ids = await listedProviderIdsInCity(db, citySlug);
  const claimedSet = await claimedIdsAmong(db, ids);
  return {
    total: ids.length,
    claimed: claimedSet.size,
    unclaimed: ids.length - claimedSet.size,
  };
}

/**
 * Every provider we sent something to, from every system that talks to them.
 *
 * Enumerating workflows would go stale the moment a new one is added, so this
 * reads the records of contact itself:
 *
 *   email_log                     every email, whichever system sent it —
 *                                 question and connection notifications,
 *                                 outreach sequences, digests
 *   provider_outreach_touchpoints the non-email touches: calls, fax, forms
 *   staffing_touchpoints          MedJobs, which reaches providers through
 *                                 its own sequence and links to them one hop
 *                                 away via staffing_outreach
 */
const CONTACT_CHANNELS = [
  "email_log",
  "provider_outreach_touchpoints",
  "staffing_touchpoints",
] as const;

type Range = { from: string | null; to: string | null };

/** Provider ids contacted through email or the provider-outreach log. */
async function collectDirect(
  db: SupabaseClient,
  table: "email_log" | "provider_outreach_touchpoints",
  range: Range,
  into: Set<string>,
): Promise<boolean> {
  let scanned = 0;
  for (;;) {
    if (scanned >= MAX_ROWS) return true;
    let query = db.from(table).select("provider_id").not("provider_id", "is", null);
    // email_log also carries messages to families; only provider mail counts.
    if (table === "email_log") query = query.eq("recipient_type", "provider");
    if (range.from) query = query.gte("created_at", range.from);
    if (range.to) query = query.lt("created_at", range.to);

    const { data, error } = await query.range(scanned, scanned + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = (data ?? []) as { provider_id: string | null }[];
    if (rows.length === 0) return false;
    for (const r of rows) if (r.provider_id) into.add(r.provider_id);
    scanned += rows.length;
    if (rows.length < PAGE_SIZE) return false;
  }
}

/** MedJobs: touchpoints carry an outreach id, which carries the provider. */
async function collectStaffing(
  db: SupabaseClient,
  range: Range,
  into: Set<string>,
): Promise<boolean> {
  const outreachIds = new Set<string>();
  let scanned = 0;
  let truncated = false;

  for (;;) {
    if (scanned >= MAX_ROWS) {
      truncated = true;
      break;
    }
    let query = db
      .from("staffing_touchpoints")
      .select("outreach_id")
      .not("outreach_id", "is", null);
    if (range.from) query = query.gte("created_at", range.from);
    if (range.to) query = query.lt("created_at", range.to);

    const { data, error } = await query.range(scanned, scanned + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = (data ?? []) as { outreach_id: string | null }[];
    if (rows.length === 0) break;
    for (const r of rows) if (r.outreach_id) outreachIds.add(r.outreach_id);
    scanned += rows.length;
    if (rows.length < PAGE_SIZE) break;
  }

  const ids = [...outreachIds];
  for (let i = 0; i < ids.length; i += PROVIDER_ID_CHUNK) {
    const { data, error } = await db
      .from("staffing_outreach")
      .select("provider_id")
      .not("provider_id", "is", null)
      .in("id", ids.slice(i, i + PROVIDER_ID_CHUNK));
    if (error) throw error;
    for (const r of (data ?? []) as { provider_id: string | null }[]) {
      if (r.provider_id) into.add(r.provider_id);
    }
  }

  return truncated;
}

export interface ProvidersInOutreach {
  value: number;
  truncated: boolean;
}

/**
 * CP2 — unclaimed providers who heard from us inside the window.
 *
 * Unlike CP1 this is a flow, not a standing state: being contacted is
 * something that happens on a date, so the range applies. A provider already
 * claimed is excluded no matter how much mail they got — the node is about
 * providers still to be won.
 */
export async function getProvidersInOutreach(
  db: SupabaseClient,
  range: Range,
  citySlug: string | null = null,
): Promise<ProvidersInOutreach> {
  const contacted = new Set<string>();

  const truncations = await Promise.all([
    collectDirect(db, "email_log", range, contacted),
    collectDirect(db, "provider_outreach_touchpoints", range, contacted),
    collectStaffing(db, range, contacted),
  ]);

  let ids = [...contacted];

  if (citySlug) {
    const inCity = new Set(await listedProviderIdsInCity(db, citySlug));
    ids = ids.filter((id) => inCity.has(id));
  }

  if (ids.length === 0) {
    return { value: 0, truncated: truncations.some(Boolean) };
  }

  const claimed = await claimedIdsAmong(db, ids);
  return {
    value: ids.filter((id) => !claimed.has(id)).length,
    truncated: truncations.some(Boolean),
  };
}

/** The channels CP2 reads, for the inspector to describe without restating. */
export const CP2_CHANNELS = CONTACT_CHANNELS;
