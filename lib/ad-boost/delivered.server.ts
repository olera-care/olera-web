import { readCampaignRows } from "@/lib/ad-boost/read-campaign-rows";
import { getServiceClient } from "@/lib/admin";
import { BLOCKING_CATEGORIES } from "@/lib/city-ads/classify.server";
import { CARE_LABEL, getCityConfig } from "@/lib/city-ads/config";

/**
 * A form lead (city_leads) is counted on the campaign that holds it NOW, read
 * from the lead's own routing state, never from the `lead_received` receipt
 * written when it moved. Receipts are append-only: a lead handed to one
 * provider and then offered to another kept counting on the first, and a lead
 * screened out after the handover kept counting at all. So every counter here
 * drops receipts that carry `city_lead_id` and asks this function instead.
 *
 * Who holds a lead:
 *   - an accepted offer (city_leads.accepted_offer_id) names the provider, and
 *     wins over a handover that came before it: an admin "Offer to…" on a
 *     handed lead is a deliberate re-route;
 *   - otherwise the handover (city_leads.handed_request_id) names the campaign;
 *   - a released offer (the re-offer rung clears accepted_offer_id) holds
 *     nothing, so the lead leaves that provider's count the moment it is freed.
 *
 * An accepted offer names a provider, not a campaign. It lands on the campaign
 * whose own ad produced the lead when that campaign is hers, otherwise on her
 * campaign that had launched by the time she took it (her earliest, if none
 * had).
 *
 * Screened-out leads (job seekers, spam) count for nobody, even once handed.
 */
interface RoutedFormLead {
  id: string;
  created_at: string;
  care_type: string | null;
  slug: string;
}

interface RequestForRouting {
  id: string;
  provider_id: string | null;
  campaign_tag: string | null;
  flight_start_date: string | null;
  requested_setup_week: string | null;
  created_at: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function launchAnchor(r: RequestForRouting): string {
  return new Date(r.flight_start_date || r.requested_setup_week || r.created_at).toISOString();
}

export async function routedFormLeadsByCampaign(
  db: ReturnType<typeof getServiceClient>,
  tags: string[],
): Promise<Record<string, RoutedFormLead[]>> {
  const result: Record<string, RoutedFormLead[]> = {};
  const wanted = [...new Set(tags.filter((t): t is string => !!t))];
  for (const t of wanted) result[t] = [];
  if (wanted.length === 0) return result;

  const REQUEST_COLS = "id, provider_id, campaign_tag, flight_start_date, requested_setup_week, created_at";
  const uuids = wanted.filter((t) => UUID_RE.test(t));
  const [byTag, byId] = await Promise.all([
    db.from("ad_campaign_requests").select(REQUEST_COLS).is("deleted_at", null).in("campaign_tag", wanted),
    uuids.length
      ? db.from("ad_campaign_requests").select(REQUEST_COLS).is("deleted_at", null).in("id", uuids)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (byTag.error || byId.error) throw new Error(`Campaign read failed: ${(byTag.error ?? byId.error)!.message}`);

  // Effective tag is `campaign_tag || id`, the same key the ad links carry.
  const tagOf = new Map<string, string>();
  for (const r of [...(byTag.data ?? []), ...(byId.data ?? [])] as RequestForRouting[]) {
    const tag = r.campaign_tag || r.id;
    if (result[tag]) tagOf.set(r.id, tag);
  }
  if (tagOf.size === 0) return result;
  const requestIds = [...tagOf.keys()];

  // Every campaign these providers run, so an accepted offer can be placed on
  // the right one even when the caller asked about only some of them.
  const providerIds = [
    ...new Set(
      [...(byTag.data ?? []), ...(byId.data ?? [])]
        .map((r) => (r as RequestForRouting).provider_id)
        .filter((p): p is string => !!p),
    ),
  ];
  const { data: allRequests, error: reqErr } = providerIds.length
    ? await db.from("ad_campaign_requests").select(REQUEST_COLS).is("deleted_at", null).in("provider_id", providerIds)
    : { data: [], error: null };
  if (reqErr) throw new Error(`Campaign read failed: ${reqErr.message}`);
  const requestsByProvider = new Map<string, RequestForRouting[]>();
  for (const r of (allRequests ?? []) as RequestForRouting[]) {
    if (!r.provider_id) continue;
    const list = requestsByProvider.get(String(r.provider_id)) ?? [];
    list.push(r);
    requestsByProvider.set(String(r.provider_id), list);
  }

  // Candidate leads: handed to one of these campaigns, or accepted by one of
  // these providers. Owner is resolved below; a candidate may belong to nobody.
  const { data: accepted, error: offErr } = providerIds.length
    ? await db.from("city_lead_offers").select("id").in("provider_id", providerIds).not("accepted_at", "is", null)
    : { data: [], error: null };
  if (offErr) throw new Error(`Offer read failed: ${offErr.message}`);
  const acceptedIds = (accepted ?? []).map((o) => o.id as string);

  const LEAD_COLS =
    "id, created_at, care_type, slug, is_test, archive_reason, qualification_verdict, handed_at, handed_request_id, accepted_offer_id, meta_campaign_id";
  const [handedRes, acceptedRes] = await Promise.all([
    db.from("city_leads").select(LEAD_COLS).in("handed_request_id", requestIds),
    acceptedIds.length
      ? db.from("city_leads").select(LEAD_COLS).in("accepted_offer_id", acceptedIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (handedRes.error || acceptedRes.error) {
    throw new Error(`Lead read failed: ${(handedRes.error ?? acceptedRes.error)!.message}`);
  }
  type LeadRow = RoutedFormLead & {
    is_test: boolean | null;
    archive_reason: string | null;
    qualification_verdict: string | null;
    handed_at: string | null;
    handed_request_id: string | null;
    accepted_offer_id: string | null;
    meta_campaign_id: string | null;
  };
  const leads = new Map<string, LeadRow>();
  for (const l of [...(handedRes.data ?? []), ...(acceptedRes.data ?? [])] as LeadRow[]) leads.set(l.id, l);

  const blocking = new Set<string>(BLOCKING_CATEGORIES as unknown as string[]);
  const live = [...leads.values()].filter(
    (l) =>
      !l.is_test &&
      l.qualification_verdict !== "not_care_seeker" &&
      !(l.archive_reason && blocking.has(l.archive_reason)),
  );

  // The accepted offer behind each lead, and which campaign each lead's own ad
  // belongs to.
  const offerIds = [...new Set(live.map((l) => l.accepted_offer_id).filter((v): v is string => !!v))];
  const adIds = [...new Set(live.map((l) => l.meta_campaign_id).filter((v): v is string => !!v))];
  const [offersRes, adsRes] = await Promise.all([
    offerIds.length
      ? db.from("city_lead_offers").select("id, provider_id, accepted_at").in("id", offerIds)
      : Promise.resolve({ data: [], error: null }),
    adIds.length
      ? db.from("city_campaigns").select("platform_campaign_id, request_id").in("platform_campaign_id", adIds).not("request_id", "is", null)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (offersRes.error || adsRes.error) throw new Error(`Routing read failed: ${(offersRes.error ?? adsRes.error)!.message}`);
  const offerById = new Map(
    ((offersRes.data ?? []) as Array<{ id: string; provider_id: string; accepted_at: string | null }>).map((o) => [o.id, o]),
  );
  const adRequests = new Map<string, Set<string>>();
  for (const a of (adsRes.data ?? []) as Array<{ platform_campaign_id: string; request_id: string }>) {
    const set = adRequests.get(a.platform_campaign_id) ?? new Set<string>();
    set.add(String(a.request_id));
    adRequests.set(a.platform_campaign_id, set);
  }

  for (const l of live) {
    let owner: string | null = null;
    const offer = l.accepted_offer_id ? offerById.get(l.accepted_offer_id) : undefined;
    const offerWins =
      !!offer?.accepted_at && (!l.handed_at || offer.accepted_at >= l.handed_at);
    if (offer && offerWins) {
      const theirs = requestsByProvider.get(String(offer.provider_id)) ?? [];
      const fromOwnAd = theirs.find((r) => l.meta_campaign_id && adRequests.get(l.meta_campaign_id)?.has(r.id));
      const launched = theirs
        .filter((r) => launchAnchor(r) <= new Date(offer.accepted_at!).toISOString())
        .sort((a, b) => launchAnchor(b).localeCompare(launchAnchor(a)))[0];
      const earliest = [...theirs].sort((a, b) => launchAnchor(a).localeCompare(launchAnchor(b)))[0];
      owner = (fromOwnAd ?? launched ?? earliest)?.id ?? null;
    } else if (l.handed_request_id) {
      owner = String(l.handed_request_id);
    }
    const tag = owner ? tagOf.get(owner) : undefined;
    if (tag) result[tag].push({ id: l.id, created_at: l.created_at, care_type: l.care_type, slug: l.slug });
  }
  return result;
}

/** A `lead_received` receipt for a form lead. Counted from routing state instead. */
function isFormLeadReceipt(metadata: { city_lead_id?: string } | null): boolean {
  return !!metadata?.city_lead_id;
}

/**
 * Referrer class the analytics pipeline (`lib/analytics/referrer`) stamps on
 * our OWN traffic: admin directory click-throughs, campaign-URL previews, QA
 * sweeps. Never a family who arrived from an ad, so it is excluded from every
 * campaign counter below.
 *
 * This is not cosmetic — it is what makes our numbers agree with the ad
 * platform's. Measured against the operator-entered Google clicks, stripping
 * internal traffic moved HomeWell (Jul) from 18 to 13 against 13 reported, and
 * Legacy Haven from 20 to 15 against 16 reported. Left in, every counter runs
 * hot by 10-30%.
 *
 * NULL-safe by design: rows written before the classifier shipped carry no
 * class and are kept (they are external by default), so only a positive
 * `olera_internal` match is dropped.
 */
const INTERNAL_REFERRER_CLASS = "olera_internal";

function isInternalTraffic(metadata: { referrer_class?: string } | null): boolean {
  return metadata?.referrer_class === INTERNAL_REFERRER_CLASS;
}

/**
 * Count families delivered by managed-ad campaigns — the Ad Boost ROI signal.
 *
 * A "delivered family" is a campaign-attributed CONVERSION: a family who arrived
 * via a managed-ads link (`utm_source=olera_managed&utm_campaign=<tag>`) and then
 * either
 *   • inquired with the provider     → a `lead_received` provider_activity event, or
 *   • finished the benefits intake    → a `benefits_completed` seeker_activity event,
 * with the campaign's `utm_campaign` on the event metadata, or
 *   • filled in an ad's form and is routed to this campaign right now
 *     → `routedFormLeadsByCampaign` (not its receipt, which never moves). Both are
 * server-confirmed conversions — not clicks — so this is the honest number to
 * show before we ever charge.
 *
 * The inquiry (`lead_received`) is the PRIMARY conversion: an ad points at a
 * provider page, whose natural action is "contact this provider," so that's the
 * funnel most ad-driven families take. `benefits_completed` is the secondary
 * side funnel. Counting only the latter (the old behaviour) systematically
 * read ~0 even when a real inquiry landed — see the Franchil pilot.
 *
 * Dedup: inquiries are deduped within-funnel by connection_id/session_id and
 * benefits completions by family profile_id. A family who did BOTH funnels for
 * the same campaign can count twice — there is no shared key across the two
 * tables (benefits_completed carries no session_id). Negligible at pilot volume;
 * revisit if cross-funnel overlap ever becomes material.
 *
 * Returns a map of campaign_tag → delivered count. Tags with no conversions are
 * present with 0. Scoped to `utm_source=olera_managed` so we only scan managed
 * traffic (cheap at pilot volume).
 */
export async function countDeliveredByCampaign(
  db: ReturnType<typeof getServiceClient>,
  tags: string[],
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  const wanted = tags.filter((t): t is string => !!t);
  if (wanted.length === 0) return result;
  const wantedSet = new Set(wanted);
  // Per-tag set of dedup keys (across both funnels); count = set size.
  const idsByTag: Record<string, Set<string>> = {};
  for (const t of wanted) idsByTag[t] = new Set();

  // Filter and paginate in the database; no funnel depends on another.
  const [leads, bens, formLeads] = await Promise.all([
    readCampaignRows(wanted, (batch, from, to, signal) => db
      .from("provider_activity").select("metadata", { count: from === 0 ? "exact" : undefined })
      .eq("event_type", "lead_received")
      .filter("metadata->>utm_source", "eq", "olera_managed")
      .in("metadata->>utm_campaign", batch)
      .order("id").range(from, to).abortSignal(signal)),
    readCampaignRows(wanted, (batch, from, to, signal) => db
      .from("seeker_activity").select("profile_id, metadata", { count: from === 0 ? "exact" : undefined })
      .eq("event_type", "benefits_completed")
      .filter("metadata->>utm_source", "eq", "olera_managed")
      .in("metadata->>utm_campaign", batch)
      .order("id").range(from, to).abortSignal(signal)),
    routedFormLeadsByCampaign(db, wanted),
  ]);
  for (const row of (leads ?? []) as Array<{
    metadata: { utm_campaign?: string; connection_id?: string; session_id?: string; city_lead_id?: string } | null;
  }>) {
    const m = row.metadata;
    if (isFormLeadReceipt(m)) continue;
    const tag = m?.utm_campaign;
    if (tag && wantedSet.has(tag)) {
      idsByTag[tag].add(`lead:${m?.connection_id || m?.session_id || JSON.stringify(m)}`);
    }
  }

  for (const row of (bens ?? []) as Array<{
    profile_id: string | null;
    metadata: { utm_campaign?: string } | null;
  }>) {
    const tag = row.metadata?.utm_campaign;
    if (tag && wantedSet.has(tag)) {
      idsByTag[tag].add(`benefits:${row.profile_id || JSON.stringify(row.metadata)}`);
    }
  }

  for (const [tag, rows] of Object.entries(formLeads)) {
    for (const l of rows) idsByTag[tag]?.add(`form:${l.id}`);
  }

  for (const t of wanted) result[t] = idsByTag[t].size;
  return result;
}

/**
 * Count managed-ad clicks that actually LANDED, per campaign: session-deduped
 * `page_view` events tagged `utm_source=olera_managed`, EXCLUDING our own
 * internal traffic. ViewTracker stamps the landing UTM onto page_view
 * metadata, so this is the delivery half of the funnel (did the ad's clicks
 * reach the page?) next to the conversion half (`countDeliveredByCampaign`).
 * A stalled campaign shows up here within a day instead of two silent weeks
 * of zero leads.
 *
 * Only counts events from after the managed-UTM instrumentation shipped
 * (first tagged landing: 2026-07-22). Campaigns that flew before that read
 * low or zero here and their operator-entered clicks are the only history
 * available — do NOT read the gap as a tracking fault.
 */
export async function countAdLandingsByCampaign(
  db: ReturnType<typeof getServiceClient>,
  tags: string[],
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  const wanted = tags.filter((t): t is string => !!t);
  if (wanted.length === 0) return result;
  const wantedSet = new Set(wanted);
  const sessionsByTag: Record<string, Set<string>> = {};
  for (const t of wanted) sessionsByTag[t] = new Set();

  const data = await readCampaignRows(wanted, (batch, from, to, signal) => db
    .from("provider_activity").select("metadata", { count: from === 0 ? "exact" : undefined })
    .eq("event_type", "page_view")
    .filter("metadata->>utm_source", "eq", "olera_managed")
    .in("metadata->>utm_campaign", batch)
    .order("id").range(from, to).abortSignal(signal));
  for (const row of (data ?? []) as Array<{
    metadata: { utm_campaign?: string; session_id?: string; referrer_class?: string } | null;
  }>) {
    if (isInternalTraffic(row.metadata)) continue;
    const tag = row.metadata?.utm_campaign;
    if (tag && wantedSet.has(tag)) {
      sessionsByTag[tag].add(row.metadata?.session_id || JSON.stringify(row.metadata));
    }
  }

  for (const t of wanted) result[t] = sessionsByTag[t].size;
  return result;
}

/**
 * Real campaign performance for the provider-facing live panel: how many people
 * visited this provider's page and how many converted into leads since the
 * campaign launched.
 *
 * This is deliberately DIFFERENT from countDeliveredByCampaign. That counts
 * `benefits_completed` conversions tagged with the campaign UTM — a side funnel
 * the live provider page mostly doesn't even surface, so for most campaigns it
 * reads ~0 while real inquiries arrive through the page's primary CTA. This
 * instead reads the page's actual traffic + conversion from provider_activity:
 *   visitors = session-deduped `page_view` events, internal traffic excluded
 *   leads    = `lead_received` events (the CTA inquiry — the true conversion)
 *
 * Single-provider attribution by approximation: a managed campaign points only
 * at this provider's page, so "external traffic on the page since launch"
 * ≈ campaign performance. This is deliberately BROADER than
 * `countAdLandingsByCampaign`, which requires the managed UTM on the landing
 * view: a family who clicks the ad, leaves, and returns the next day by
 * searching the provider's name is real campaign traffic that carries no UTM
 * on the second visit. Visitors catches them; ad landings does not. Expect
 * visitors >= landings, and show them as separate numbers rather than letting
 * one stand in for the other.
 *
 * What it must NOT include is us. The `olera_internal` referrer class covers
 * admin directory click-throughs and campaign-URL previews, and it is stripped
 * here — otherwise the count we put in front of a paying provider is inflated
 * with our own clicks. It is a provider-facing number; it has to be clean.
 *
 * `since` is an ISO timestamp (the campaign's launch anchor). provider_activity
 * keys on the URL slug, so pass the provider's slug (plus profile id as a
 * defensive fallback for legacy rows) as `providerIdVariants`.
 */
export interface CampaignStats {
  visitors: number;
  leads: number;
}

export async function getCampaignStats(
  db: ReturnType<typeof getServiceClient>,
  options: { providerIdVariants: string[]; since: string },
): Promise<CampaignStats> {
  const variants = options.providerIdVariants.filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  if (variants.length === 0) return { visitors: 0, leads: 0 };

  const { data, error } = await db
    .from("provider_activity")
    .select("event_type, metadata")
    .in("provider_id", variants)
    .in("event_type", ["page_view", "lead_received"])
    .gte("created_at", options.since)
    .limit(50000);

  if (error || !data) return { visitors: 0, leads: 0 };

  // Visitors = distinct session_id across external page_view (mirrors the
  // dedup the analytics endpoint + nightly rollup use, minus our own traffic).
  // Leads = lead_received count.
  const sessions = new Set<string>();
  let leads = 0;
  for (const row of data as Array<{
    event_type: string;
    metadata: (Record<string, unknown> & { referrer_class?: string }) | null;
  }>) {
    if (row.event_type === "lead_received") {
      // An inquiry is a real conversion whatever page it was reached from, so
      // leads are never filtered on referrer — only the traffic denominator is.
      leads += 1;
    } else if (row.event_type === "page_view") {
      if (isInternalTraffic(row.metadata)) continue;
      const sid = row.metadata?.session_id;
      if (typeof sid === "string" && sid.length > 0) sessions.add(sid);
    }
  }
  return { visitors: sessions.size, leads };
}

/** Questions a campaign drew in. The append-only ask ledger is the source of
 * truth for raw taps and campaign attribution; canonical topics supply answer
 * state. Managed UTM wins when present, with the launch window as fallback for
 * pre-attribution receipts. */
export interface CampaignQuestions {
  /** Raw submission taps, including repeats. */
  received: number;
  /** Raw taps whose canonical topic still needs an answer. */
  unanswered: number;
  uniqueReceived: number;
  uniqueUnanswered: number;
  attribution: "campaign_utm" | "time_window";
}

export async function getCampaignQuestions(
  db: ReturnType<typeof getServiceClient>,
  options: { providerIdVariants: string[]; since: string; campaignTag?: string | null },
): Promise<CampaignQuestions> {
  const variants = options.providerIdVariants.filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  const empty: CampaignQuestions = {
    received: 0,
    unanswered: 0,
    uniqueReceived: 0,
    uniqueUnanswered: 0,
    attribution: "time_window",
  };
  if (variants.length === 0) return empty;

  const { data: askData, error: askError } = await db
    .from("provider_question_asks")
    .select("question_id, utm_source, utm_campaign, created_at")
    .in("provider_id", variants)
    .gte("created_at", options.since)
    .limit(5000);
  if (askError || !askData) return empty;

  type AskRow = {
    question_id: string;
    utm_source: string | null;
    utm_campaign: string | null;
    created_at: string;
  };
  const activityRows = askData as AskRow[];
  if (activityRows.length === 0) return empty;

  const allQuestionIds = [...new Set(activityRows.map((row) => row.question_id))];
  const { data: topics, error: topicError } = await db
    .from("provider_questions")
    .select("id, answer, status")
    .in("id", allQuestionIds);
  if (topicError) return empty;
  const manageableTopics = new Map(
    (topics ?? [])
      .filter((topic) => topic.status !== "archived" && topic.status !== "rejected")
      .map((topic) => [topic.id, !!topic.answer?.trim()]),
  );
  const manageableRows = activityRows.filter((row) => manageableTopics.has(row.question_id));
  const taggedRows = options.campaignTag
    ? manageableRows.filter((row) =>
        row.utm_source === "olera_managed" && row.utm_campaign === options.campaignTag,
      )
    : [];
  const attributedRows = taggedRows.length > 0 ? taggedRows : manageableRows;
  if (attributedRows.length === 0) return empty;

  const questionIds = [...new Set(attributedRows.map((row) => row.question_id))];
  const unansweredRows = attributedRows.filter(
    (row) => !(manageableTopics.get(row.question_id) ?? false),
  );
  return {
    received: attributedRows.length,
    unanswered: unansweredRows.length,
    uniqueReceived: questionIds.length,
    uniqueUnanswered: new Set(unansweredRows.map((row) => row.question_id)).size,
    attribution: taggedRows.length > 0 ? "campaign_utm" : "time_window",
  };
}

// UI care-need bucket → human label (mirror of CARE_NEED_LABELS in
// app/api/benefits/save-results). Kept tiny + local to avoid coupling.
const CARE_NEED_LABELS: Record<string, string> = {
  stayingAtHome: "in-home care",
  payingForCare: "paying for care",
  memoryHealth: "memory & medical care",
  companionship: "caregiver & social support",
};

/** One delivered family behind an Ad Boost campaign — the rows behind the count.
 *  Deliberately NO name / PHI: just date + care need + state + where it came in.
 *  `outcome` is the provider's one-tap self-report ("did this family become a
 *  client?") from connections.metadata.provider_outcome — the receipt that
 *  closes the Franchil outcome-blindness gap. Null until they answer. */
export type ProviderLeadOutcome = "client" | "talking" | "no";

export interface CampaignLead {
  created_at: string;
  careNeed: string | null;
  state: string | null;
  entrySource: string | null;
  connectionId: string | null;
  outcome: ProviderLeadOutcome | null;
}

/** Humanize a connection `care_type`/`care_need` slug (e.g. "home_care" →
 *  "Home care"). Falls back to title-casing the raw slug. */
function humanizeCareSlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const direct = CARE_NEED_LABELS[slug];
  if (direct) return direct;
  return slug.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Pull NO-PHI care signal out of a connection's stringified message payload.
 *  The message holds seeker contact info (name/email/phone) which we must NOT
 *  surface — we read only care_type/care_need + state. */
function careFromConnectionMessage(
  message: string | null,
): { careNeed: string | null; state: string | null } {
  if (!message) return { careNeed: null, state: null };
  try {
    const p = JSON.parse(message) as Record<string, unknown>;
    const careRaw = (p.care_type as string) || (p.care_need as string) || null;
    const state =
      (p.looking_in_state as string) || (p.seeker_state as string) || null;
    return { careNeed: humanizeCareSlug(careRaw), state: state || null };
  } catch {
    return { careNeed: null, state: null };
  }
}

/**
 * List the families a campaign delivered, newest first — the receipts behind
 * `countDeliveredByCampaign`. Merges the PRIMARY funnel (campaign-attributed
 * `lead_received` inquiries, enriched with care need + state from the connection
 * record) with the secondary `benefits_completed` funnel. No PHI — care need +
 * state + entry source only.
 */
export async function listLeadsByCampaign(
  db: ReturnType<typeof getServiceClient>,
  tag: string,
): Promise<CampaignLead[]> {
  if (!tag) return [];

  const [leadRes, benefitsRes, formRes] = await Promise.all([
    db
      .from("provider_activity")
      .select("created_at, metadata")
      .eq("event_type", "lead_received")
      .filter("metadata->>utm_source", "eq", "olera_managed")
      .filter("metadata->>utm_campaign", "eq", tag)
      .order("created_at", { ascending: false })
      .limit(500),
    db
      .from("seeker_activity")
      .select("created_at, metadata")
      .eq("event_type", "benefits_completed")
      .filter("metadata->>utm_source", "eq", "olera_managed")
      .filter("metadata->>utm_campaign", "eq", tag)
      .order("created_at", { ascending: false })
      .limit(500),
    routedFormLeadsByCampaign(db, [tag]),
  ]);

  const out: CampaignLead[] = [];

  // Primary funnel — inquiries. Enrich care need + state from the connection.
  // Form-lead receipts are skipped here and listed from routing state below.
  const leadRows = ((leadRes.data ?? []) as Array<{
    created_at: string;
    metadata: { connection_id?: string; city_lead_id?: string } | null;
  }>).filter((r) => !isFormLeadReceipt(r.metadata));
  const connIds = leadRows
    .map((r) => r.metadata?.connection_id)
    .filter((v): v is string => !!v);
  const careByConn: Record<string, { careNeed: string | null; state: string | null }> = {};
  const outcomeByConn: Record<string, ProviderLeadOutcome> = {};
  if (connIds.length > 0) {
    const { data: conns } = await db
      .from("connections")
      .select("id, message, metadata")
      .in("id", connIds);
    for (const c of (conns ?? []) as Array<{
      id: string;
      message: string | null;
      metadata: { provider_outcome?: { value?: string } } | null;
    }>) {
      careByConn[c.id] = careFromConnectionMessage(c.message);
      const v = c.metadata?.provider_outcome?.value;
      if (v === "client" || v === "talking" || v === "no") outcomeByConn[c.id] = v;
    }
  }
  for (const r of leadRows) {
    const connectionId = r.metadata?.connection_id || null;
    const care = (connectionId && careByConn[connectionId]) || {
      careNeed: null,
      state: null,
    };
    out.push({
      created_at: r.created_at,
      careNeed: care.careNeed,
      state: care.state,
      entrySource: "Provider page inquiry",
      connectionId,
      outcome: (connectionId && outcomeByConn[connectionId]) || null,
    });
  }

  // Form leads routed to this campaign now. No connection row, so no outcome.
  for (const l of formRes[tag] ?? []) {
    out.push({
      created_at: l.created_at,
      careNeed: (l.care_type && CARE_LABEL[l.care_type as keyof typeof CARE_LABEL]) || null,
      state: getCityConfig(l.slug)?.state ?? null,
      entrySource: "Ad form",
      connectionId: null,
      outcome: null,
    });
  }

  // Secondary funnel — benefits completions. No connection row exists for
  // these, so there is nothing to hang a provider outcome on.
  for (const r of (benefitsRes.data ?? []) as Array<{
    created_at: string;
    metadata: { care_need?: string; state?: string; entry_source?: string } | null;
  }>) {
    out.push({
      created_at: r.created_at,
      careNeed: r.metadata?.care_need
        ? CARE_NEED_LABELS[r.metadata.care_need] ?? r.metadata.care_need
        : null,
      state: r.metadata?.state ?? null,
      entrySource: r.metadata?.entry_source ?? null,
      connectionId: null,
      outcome: null,
    });
  }

  return out.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 500);
}
