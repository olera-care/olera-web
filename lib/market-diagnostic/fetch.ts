import type { CareType, ResolvedCity } from "./resolve";

/**
 * Market-diagnostic data pull (server port of scripts/market-diagnostic/fetch-diagnostic.mjs).
 * Pulls REAL data for a provider's local market:
 *   1. Competitor landscape  (Google Places — same care type)
 *   2. Referral-source graph  (Google Places — discharge + care-management ecosystem)
 *   3. Demographic demand     (Census ACS5 — 65+, income across catchment ZCTAs)
 *   4. Olera captured demand  (Supabase — families/questions in this city)
 *
 * Everything that can run concurrently does: the four blocks above run in parallel, the
 * Places queries within them run through a shared rate-capped limiter, the Census ZCTAs
 * run in parallel, and the Olera counts run in parallel. This takes a cold compute from
 * ~50s of serial fetching down to ~10s, bounded — and it never bursts the Places quota.
 *
 * Lean-fetch: referral queries page once (not twice) and the two weakest roles for
 * HOME-CARE referrals (faith, retirement financial advisors) are dropped — ~40% fewer
 * Places calls with no quality loss. Competitor queries still page fully (SoV needs it).
 */

const GOOGLE_KEY = () => process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const SUPABASE_URL = () => process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CENSUS_KEY = () => process.env.CENSUS_API_KEY;

// Concurrency caps. Google Places (new) tolerates this for a single city; we've hit 429s
// only on the multi-city BATCH pipeline (feedback_api_rate_limits_first), not one market.
const PLACES_CONCURRENCY = 8;
const CENSUS_CONCURRENCY = 6;

/** Minimal promise concurrency limiter — caps how many `fn`s run at once. */
function createLimiter(max: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  const release = () => { active--; queue.shift()?.(); };
  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= max) await new Promise<void>((res) => queue.push(res));
    active++;
    try { return await fn(); } finally { release(); }
  };
}

const COMPETITOR_QUERIES: Record<CareType, string[]> = {
  homecare: ["home care agency", "in-home senior care", "home health care", "senior home care", "non-medical home care"],
  assisted_living: ["assisted living facility", "assisted living community", "memory care", "senior living community", "residential care home"],
};

// Referral graph — where home-care / AL clients actually originate (discharge + care-management).
const REFERRAL_QUERIES: { role: string; queries: string[] }[] = [
  { role: "hospital", queries: ["hospital", "medical center"] },
  { role: "skilled_nursing", queries: ["skilled nursing facility", "nursing home", "rehabilitation center"] },
  { role: "assisted_living", queries: ["assisted living facility", "memory care community"] },
  { role: "hospice", queries: ["hospice", "hospice care"] },
  { role: "home_health", queries: ["home health agency", "medicare home health"] },
  { role: "senior_resources", queries: ["senior center", "area agency on aging", "council on aging"] },
  { role: "professional", queries: ["elder law attorney", "estate planning attorney", "geriatric care manager"] },
];

const PLACES_FIELD_MASK = [
  "places.id", "places.displayName", "places.formattedAddress", "places.rating",
  "places.userRatingCount", "places.location", "places.types", "places.businessStatus",
  "places.websiteUri", "places.nationalPhoneNumber", "places.primaryType", "nextPageToken",
].join(",");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface NormPlace {
  id: string;
  name: string;
  address: string;
  rating: number | null;
  reviews: number;
  lat: number | null;
  lng: number | null;
  types: string[];
  primaryType: string | null;
  status: string | null;
  website: string | null;
  phone: string | null;
  distanceMiles?: number | null;
  role?: string;
}

export interface RawSnapshot {
  meta: {
    city: string; state: string; careType: CareType;
    center: { lat: number; lng: number }; radiusMeters: number; zctas: string[];
    generatedAt: string;
  };
  competitors: NormPlace[];
  referralGraph: NormPlace[];
  demographics: ReturnType<typeof emptyDemographics> | Awaited<ReturnType<typeof fetchCensus>>;
  oleraDemand: Record<string, unknown>;
}

interface PlaceApiResult {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  primaryType?: string;
  businessStatus?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
}

/** Mutable counter so the caller can estimate Places spend. */
export interface FetchContext {
  lat: number;
  lng: number;
  radius: number;
  placesRequests: number;
  places: ReturnType<typeof createLimiter>;
}

async function placesTextSearch(ctx: FetchContext, textQuery: string, maxPages = 2): Promise<PlaceApiResult[]> {
  const out: PlaceApiResult[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const body: Record<string, unknown> = {
      textQuery,
      pageSize: 20,
      locationBias: { circle: { center: { latitude: ctx.lat, longitude: ctx.lng }, radius: ctx.radius } },
    };
    if (pageToken) body.pageToken = pageToken;
    let json: { places?: PlaceApiResult[]; nextPageToken?: string; error?: { message?: string } } | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        ctx.placesRequests++;
        const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_KEY() || "",
            "X-Goog-FieldMask": PLACES_FIELD_MASK,
          },
          body: JSON.stringify(body),
        });
        json = await res.json();
        break;
      } catch (e) {
        if (attempt === 2) { console.error(`[market] places "${textQuery}": ${(e as Error).message}`); return out; }
        await sleep(1500 * (attempt + 1));
      }
    }
    if (json?.error) { console.error(`[market] places "${textQuery}": ${json.error.message}`); return out; }
    for (const p of json?.places || []) out.push(p);
    pageToken = json?.nextPageToken;
    if (!pageToken) break;
    await sleep(2200); // next_page_token needs a short delay to become valid
  }
  return out;
}

function normPlace(p: PlaceApiResult): NormPlace {
  return {
    id: p.id || "",
    name: p.displayName?.text || "",
    address: p.formattedAddress || "",
    rating: p.rating ?? null,
    reviews: p.userRatingCount ?? 0,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    types: p.types || [],
    primaryType: p.primaryType || null,
    status: p.businessStatus || null,
    website: p.websiteUri || null,
    phone: p.nationalPhoneNumber || null,
  };
}

function haversineMiles(lat1: number, lng1: number, lat2: number | null, lng2: number | null): number | null {
  if (lat2 == null || lng2 == null) return null;
  const R = 3958.8, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

/** Run a group of text queries concurrently (rate-capped) and dedupe the results by place id. */
async function gatherDeduped(ctx: FetchContext, queries: string[], role?: string, maxPages = 2): Promise<NormPlace[]> {
  const pages = await Promise.all(queries.map((q) => ctx.places(() => placesTextSearch(ctx, q, maxPages))));
  const byId = new Map<string, NormPlace>();
  for (const results of pages) {
    for (const p of results) {
      if (!p.id || byId.has(p.id)) continue;
      if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;
      const np = normPlace(p);
      np.distanceMiles = haversineMiles(ctx.lat, ctx.lng, np.lat, np.lng);
      if (role) np.role = role;
      byId.set(p.id, np);
    }
  }
  return [...byId.values()];
}

// ---------- Census ACS5 ----------
const ACS_65PLUS = ["B01001_020E","B01001_021E","B01001_022E","B01001_023E","B01001_024E","B01001_025E",
                    "B01001_044E","B01001_045E","B01001_046E","B01001_047E","B01001_048E","B01001_049E"];
const ACS_TOTAL = "B01001_001E";
const ACS_MEDINC = "B19013_001E";

function emptyDemographics() {
  return { year: 0, zctas: [] as unknown[], totals: { population: 0, seniors65plus: 0 }, seniorSharePct: null as number | null, medianIncomeRange: null as { min: number; max: number } | null };
}

type ZctaRow = { zcta: string; population: number; seniors65plus: number; medianIncome: number | null };

/** Fetch one ZCTA with a couple of retries — a transient 429/5xx must NOT silently zero out
 *  demographics (that's the "0 seniors in Naples" bug). Returns null for a real non-ZCTA ZIP. */
async function fetchZcta(z: string, vars: string[], year: number): Promise<ZctaRow | null> {
  const url = new URL(`https://api.census.gov/data/${year}/acs/acs5`);
  url.searchParams.set("get", `NAME,${vars.join(",")}`);
  url.searchParams.set("for", `zip code tabulation area:${z}`);
  const ck = CENSUS_KEY();
  if (ck) url.searchParams.set("key", ck);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) { // 429/5xx → back off and retry; only give up after 3 tries
        if (attempt < 2) { await sleep(700 * (attempt + 1)); continue; }
        console.error(`[market] census ${z}: HTTP ${res.status} (gave up)`);
        return null;
      }
      const txt = (await res.text()).trim();
      if (!txt || txt[0] !== "[") return null; // genuine non-ZCTA ZIP (PO box / university) → empty body
      const data = JSON.parse(txt);
      if (!Array.isArray(data) || data.length < 2) return null;
      const header: string[] = data[0], row: string[] = data[1];
      const get = (code: string) => { const i = header.indexOf(code); const v = i > -1 ? parseInt(row[i], 10) : NaN; return Number.isFinite(v) && v >= 0 ? v : 0; };
      const seniors = ACS_65PLUS.reduce((s, c) => s + get(c), 0);
      return { zcta: z, population: get(ACS_TOTAL), seniors65plus: seniors, medianIncome: get(ACS_MEDINC) || null };
    } catch (e) {
      if (attempt < 2) { await sleep(700 * (attempt + 1)); continue; }
      console.error(`[market] census ${z}: ${(e as Error).message}`);
      return null;
    }
  }
  return null;
}

async function fetchCensus(zctas: string[], year = 2022) {
  const vars = [...new Set([ACS_TOTAL, ACS_MEDINC, ...ACS_65PLUS])];
  const limit = createLimiter(CENSUS_CONCURRENCY);
  const results = await Promise.all(zctas.map((z) => limit(() => fetchZcta(z, vars, year))));
  const perZcta = results.filter((r): r is ZctaRow => r !== null);
  const totals = perZcta.reduce((a, z) => ({ population: a.population + z.population, seniors65plus: a.seniors65plus + z.seniors65plus }), { population: 0, seniors65plus: 0 });
  const incomes = perZcta.map((z) => z.medianIncome).filter((x): x is number => Boolean(x));
  return {
    year, zctas: perZcta, totals,
    seniorSharePct: totals.population ? +((totals.seniors65plus / totals.population) * 100).toFixed(1) : null,
    medianIncomeRange: incomes.length ? { min: Math.min(...incomes), max: Math.max(...incomes) } : null,
  };
}

// ---------- Olera captured demand (raw Supabase REST) ----------
async function sbCount(table: string, query: string): Promise<number | null> {
  const res = await fetch(`${SUPABASE_URL()}/rest/v1/${table}?${query}`, {
    method: "HEAD",
    headers: { apikey: SUPABASE_KEY() || "", Authorization: `Bearer ${SUPABASE_KEY()}`, Prefer: "count=exact" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const cr = res.headers.get("content-range") || "";
  const total = cr.split("/")[1];
  return total ? parseInt(total, 10) : null;
}

async function sbGet(table: string, query: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${SUPABASE_URL()}/rest/v1/${table}?${query}`, {
    headers: { apikey: SUPABASE_KEY() || "", Authorization: `Bearer ${SUPABASE_KEY()}` },
  });
  return res.ok ? res.json() : [];
}

async function fetchOleraDemand(city: string, state: string): Promise<Record<string, unknown>> {
  if (!SUPABASE_URL() || !SUPABASE_KEY()) return { error: "no supabase creds" };
  const out: Record<string, unknown> = {};
  const cityIlike = `city=ilike.*${encodeURIComponent(city)}*`;
  const settle = async <T>(p: Promise<T>): Promise<T | string> => p.catch((e) => `err: ${(e as Error).message}`);

  // The three counts are independent → run them together; questions depends on the provider list.
  const [familiesInCity, familiesTotalAllCities, providersAndQuestions] = await Promise.all([
    settle(sbCount("business_profiles", `type=eq.family&${cityIlike}&select=id`)),
    settle(sbCount("business_profiles", `type=eq.family&select=id`)),
    (async () => {
      const provQuery = `${cityIlike}&state=ilike.*${encodeURIComponent(state)}*&or=(deleted.is.null,deleted.eq.false)`;
      const [providersListed, providers] = await Promise.all([
        settle(sbCount("olera-providers", `${provQuery}&select=provider_id`)),
        sbGet("olera-providers", `${provQuery}&select=provider_id&limit=300`).catch(() => [] as Record<string, unknown>[]),
      ]);
      const ids = providers.map((p) => p.provider_id).filter(Boolean) as string[];
      let questionsInCity: number | string | null = 0;
      if (ids.length) {
        const list = ids.map((id) => `"${id}"`).join(",");
        questionsInCity = await settle(sbCount("provider_questions", `provider_id=in.(${encodeURIComponent(list)})&select=id`));
      }
      return { providersListed, questionsInCity };
    })(),
  ]);
  out.familiesInCity = familiesInCity;
  out.familiesTotalAllCities = familiesTotalAllCities;
  out.providersListed = providersAndQuestions.providersListed;
  out.questionsInCity = providersAndQuestions.questionsInCity;
  return out;
}

/** Pull the full raw market snapshot for a resolved city. Returns the snapshot + Places request count. */
export async function fetchMarketSnapshot(
  resolved: ResolvedCity,
  careType: CareType,
  opts: { radiusMeters?: number } = {},
): Promise<{ snapshot: RawSnapshot; placesRequests: number }> {
  if (!GOOGLE_KEY()) throw new Error("no GOOGLE_PLACES_API_KEY");
  const radius = opts.radiusMeters ?? 32000;
  const ctx: FetchContext = { lat: resolved.lat, lng: resolved.lng, radius, placesRequests: 0, places: createLimiter(PLACES_CONCURRENCY) };

  // The four blocks are independent — run them concurrently. Within the Places blocks every
  // query goes through ctx.places (the shared cap), so total concurrent Places calls stay bounded.
  const [competitors, referralGroups, demographics, oleraDemand] = await Promise.all([
    gatherDeduped(ctx, COMPETITOR_QUERIES[careType] || COMPETITOR_QUERIES.homecare, undefined, 2),
    Promise.all(REFERRAL_QUERIES.map((grp) => gatherDeduped(ctx, grp.queries, grp.role, 1))),
    resolved.zctas.length ? fetchCensus(resolved.zctas) : emptyDemographics(),
    fetchOleraDemand(resolved.city, resolved.state),
  ]);

  competitors.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));

  const refById = new Map<string, NormPlace>();
  for (const r of referralGroups.flat()) if (!refById.has(r.id)) refById.set(r.id, r);
  const referralGraph = [...refById.values()];

  const snapshot: RawSnapshot = {
    meta: {
      city: resolved.city, state: resolved.state, careType,
      center: { lat: resolved.lat, lng: resolved.lng }, radiusMeters: radius, zctas: resolved.zctas,
      generatedAt: new Date().toISOString(),
    },
    competitors,
    referralGraph,
    demographics,
    oleraDemand,
  };
  return { snapshot, placesRequests: ctx.placesRequests };
}
