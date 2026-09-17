/**
 * Meta campaign delivery — the numbers upstream of a lead.
 *
 * Why this exists: the Instant Forms panel showed five tiles that all live
 * DOWNSTREAM of a submitted lead (leads, offered, accepted, reached, clients).
 * When every one of them reads zero you cannot tell which of three very
 * different things happened: nobody saw the ad, nobody tapped it, or nobody
 * finished the form. Those need opposite responses and the panel could not
 * distinguish them, so the question kept getting answered by hand in Ads
 * Manager.
 *
 * On 17 September 2026 that hand-read found the Dallas native pilot buying
 * impressions at $78.48 CPM against its own sibling website arm's $36.69 — at
 * an essentially identical click-through rate. That is a delivery price
 * problem, not a form problem, and nothing on the panel could have shown it.
 * Hence: spend, impressions, link clicks, CPM and cost per link click, with
 * the other Meta arms alongside for comparison.
 *
 * CAREFUL — "link clicks" is not "form opens". Meta's standard insights expose
 * no form-view metric. A link click is counted when someone taps the call to
 * action; whether the form then rendered, and whether they read any of it, is
 * not something Meta will tell us. Treat it as an UPPER BOUND on form opens and
 * label it that way in the UI. Calling it "form opens" would overstate what we
 * know, which is the specific error this module exists to stop repeating.
 *
 * This is supplementary data. It must never take the panel down: every failure
 * path returns a reason, not a throw, so the lead outcomes keep rendering when
 * a token expires.
 */

/** Pinned default; overridden by META_LEADS_GRAPH_VERSION when that is set. */
const DEFAULT_GRAPH_VERSION = "v21.0";

function graphVersion(): string {
  const v = process.env.META_LEADS_GRAPH_VERSION ?? "";
  return /^v\d+\.0$/.test(v) ? v : DEFAULT_GRAPH_VERSION;
}

export interface CampaignDelivery {
  campaignId: string;
  /** Our own label for the arm, e.g. "dallas-tx native" — never Meta's ad name, which lies. */
  label: string;
  spend: number;
  impressions: number;
  reach: number;
  /** Upper bound on form opens / site visits. See the note at the top of this file. */
  linkClicks: number;
  /** Meta's own count of the optimisation event, when it has ever fired. */
  results: number | null;
  cpm: number | null;
  costPerLinkClick: number | null;
  /** False when Meta returned no insights row at all — a campaign that has never served. */
  hasData: boolean;
}

export type DeliveryReport =
  | { configured: false; reason: string; campaigns: [] }
  | { configured: true; reason: null; campaigns: CampaignDelivery[] };

interface MetaAction { action_type?: string; value?: string }
interface MetaInsightRow {
  spend?: string; impressions?: string; reach?: string; cpm?: string;
  actions?: MetaAction[];
}

function num(v: string | undefined): number {
  const n = Number(v ?? "0");
  return Number.isFinite(n) ? n : 0;
}

function actionValue(actions: MetaAction[] | undefined, types: string[]): number {
  if (!Array.isArray(actions)) return 0;
  for (const type of types) {
    const hit = actions.find((a) => a.action_type === type);
    if (hit) return num(hit.value);
  }
  return 0;
}

/**
 * Sixty-second cache. The panel polls every minute and re-polls on window
 * focus, and Insights is both slow and rate limited, so an uncached read would
 * make the panel worse rather than better. Module scope, so a warm lambda
 * shares it and a cold one simply re-fetches.
 */
const cache = new Map<string, { at: number; value: CampaignDelivery | null }>();
const CACHE_MS = 60_000;

async function fetchOne(campaignId: string, label: string, token: string): Promise<CampaignDelivery | null> {
  const cached = cache.get(campaignId);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.value ? { ...cached.value, label } : null;
  }
  const url = new URL(`https://graph.facebook.com/${graphVersion()}/${campaignId}/insights`);
  // maximum, not a rolling window. A flight IS the campaign; a 30-day window
  // silently zeroes an ended one, which is the bug we already fixed once on the
  // Google side (scripts/google-ads/metrics-sync.js).
  url.searchParams.set("date_preset", "maximum");
  url.searchParams.set("fields", "spend,impressions,reach,cpm,actions");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`insights ${response.status}`);
  const body = (await response.json()) as { data?: MetaInsightRow[] };
  const row = Array.isArray(body.data) ? body.data[0] : undefined;
  if (!row) {
    // A campaign that has never served returns an empty array rather than zeros.
    const empty: CampaignDelivery = {
      campaignId, label, spend: 0, impressions: 0, reach: 0, linkClicks: 0,
      results: null, cpm: null, costPerLinkClick: null, hasData: false,
    };
    cache.set(campaignId, { at: Date.now(), value: empty });
    return empty;
  }
  const spend = num(row.spend);
  const linkClicks = actionValue(row.actions, ["link_click"]);
  const results = actionValue(row.actions, [
    "onsite_conversion.lead_grouped",
    "leadgen.other",
    "lead",
  ]);
  const value: CampaignDelivery = {
    campaignId,
    label,
    spend,
    impressions: num(row.impressions),
    reach: num(row.reach),
    linkClicks,
    // Distinguish "the optimisation event has never fired" from "it fired zero
    // times in a window". Meta shows a dash for the former and so should we.
    results: results > 0 ? results : null,
    cpm: row.cpm !== undefined ? num(row.cpm) : null,
    costPerLinkClick: linkClicks > 0 ? spend / linkClicks : null,
    hasData: true,
  };
  cache.set(campaignId, { at: Date.now(), value });
  return value;
}

/**
 * Reads delivery for the named campaigns. `campaigns` is ordered; the first is
 * the subject and the rest are context, so put the native arm first.
 */
export async function getMetaDelivery(
  campaigns: { campaignId: string; label: string }[],
): Promise<DeliveryReport> {
  const token = process.env.META_ADS_ACCESS_TOKEN;
  if (!token) {
    return {
      configured: false,
      reason: "Ads reporting is not connected. Set META_ADS_ACCESS_TOKEN (a token with ads_read on the Olera ad account) to show spend, impressions and link clicks here.",
      campaigns: [],
    };
  }
  const unique = [...new Map(campaigns.filter((c) => /^\d{1,40}$/.test(c.campaignId)).map((c) => [c.campaignId, c])).values()];
  if (!unique.length) {
    return {
      configured: false,
      reason: "No Meta campaign IDs are configured. Add campaignId to each form in META_LEADS_FORMS_JSON to connect delivery.",
      campaigns: [],
    };
  }
  const settled = await Promise.allSettled(unique.map((c) => fetchOne(c.campaignId, c.label, token)));
  const rows = settled.flatMap((r) => (r.status === "fulfilled" && r.value ? [r.value] : []));
  if (!rows.length) {
    // Every call failed — almost always an expired or under-scoped token. Say so
    // rather than rendering a row of zeros that reads as "nothing delivered".
    return {
      configured: false,
      reason: "Meta ads reporting could not be read. Check that META_ADS_ACCESS_TOKEN is valid and has ads_read on this ad account.",
      campaigns: [],
    };
  }
  const order = new Map(unique.map((c, i) => [c.campaignId, i]));
  rows.sort((a, b) => (order.get(a.campaignId) ?? 0) - (order.get(b.campaignId) ?? 0));
  return { configured: true, reason: null, campaigns: rows };
}
