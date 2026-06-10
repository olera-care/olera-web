/**
 * Provider outreach enrichment — shared finder library.
 *
 * Auto-fetches the two outreach channels we don't capture today for MedJobs
 * provider rows (`student_outreach`, kind='provider'):
 *   - a contactable EMAIL  → research_data.general_contact.email
 *   - a CONTACT-FORM URL   → research_data.general_contact.contact_form_url
 *
 * One library, two consumers (this is the point of building #2+#3 together):
 *   1. the batch enrichers (scripts/enrich-outreach-*.ts, run via `npx tsx`)
 *   2. the per-row "Find X" drawer-button endpoint
 *      (app/api/admin/medjobs/enrich-contact/route.ts)
 *
 * House pattern mirrors scripts/enrich-city.js: scrape-first, Perplexity Sonar
 * only for stragglers (Sonar really costs ~$8/1000 with search fees, NOT the
 * $1/1000 in old comments), env-gated, cost-tracked, fail-closed on missing
 * keys. No network call EVER throws out of a finder — misses return null.
 */

// ---------------------------------------------------------------------------
// Config — keys from .env.local; fail closed (skip the source) when unset.
// ---------------------------------------------------------------------------

// Read keys lazily (per call), NOT at module load — a tsx batch script loads
// .env.local in its body, which runs AFTER ESM imports are hoisted. Capturing
// at import time would freeze them as undefined for scripts. (Next.js loads env
// before modules evaluate, so the API route is unaffected either way.)
function googleKey(): string | undefined {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
}
function perplexityKey(): string | undefined {
  return process.env.PERPLEXITY_API_KEY;
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 1_500_000; // cap; senior-care sites are small, bail on bloat

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal provider context a finder needs. Both consumers can build this. */
export interface ProviderContext {
  name?: string | null;
  website?: string | null;
  place_id?: string | null;
  city?: string | null;
  state?: string | null;
}

export type FinderSource = "scrape" | "perplexity" | null;

export interface EmailResult {
  email: string | null;
  source: FinderSource;
  /** All scrape candidates (ranked), for debugging / spot-checks. */
  candidates: string[];
}

export interface ContactFormResult {
  url: string | null;
  source: FinderSource;
}

export interface PhoneResult {
  phone: string | null;
  source: FinderSource;
}

export interface FaxResult {
  fax: string | null;
  source: FinderSource;
}

/** Address pulled from the site or Perplexity. Fields land in the same
 *  research_data.general_contact.{street,city,state,zip} slots the inline
 *  editor writes to, so the consumer can apply each part to its input. */
export interface AddressResult {
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  source: FinderSource;
}

// ---------------------------------------------------------------------------
// Low-level helpers (TS port of enrich-city.js scaffolding)
// ---------------------------------------------------------------------------

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Cost meter shared across a batch run. Google details ≈ $0.017/call; Sonar ≈ $0.008/call. */
export class CostTracker {
  google = 0;
  perplexity = 0;
  private startTime = Date.now();
  addGoogle(n = 1) {
    this.google += n;
  }
  addPerplexity(n = 1) {
    this.perplexity += n;
  }
  get cost(): number {
    return this.google * 0.017 + this.perplexity * 0.008;
  }
  get elapsed(): number {
    return (Date.now() - this.startTime) / 1000;
  }
  summary(): string {
    const s = this.elapsed;
    const t =
      s < 60
        ? `${Math.round(s)}s`
        : s < 3600
          ? `${(s / 60).toFixed(1)}m`
          : `${Math.floor(s / 3600)}h${Math.floor((s % 3600) / 60)}m`;
    return `$${this.cost.toFixed(2)} (${this.google} Google, ${this.perplexity} Perplexity, ${t})`;
  }
}

/** fetch with a timeout + browser UA + bounded retries. Returns null on total failure (never throws). */
async function fetchWithRetry(
  url: string,
  opts: RequestInit = {},
  retries = 2,
): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        redirect: "follow",
        signal: ctrl.signal,
        ...opts,
        headers: { "User-Agent": UA, ...(opts.headers || {}) },
      });
      return res;
    } catch {
      if (i === retries - 1) return null;
      await sleep(1500 * (i + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

/** GET a page and return its HTML (capped), or null. Only follows http(s). */
async function fetchHtml(url: string): Promise<string | null> {
  if (!/^https?:\/\//i.test(url)) return null;
  const res = await fetchWithRetry(url);
  if (!res || !res.ok) return null;
  const ctype = res.headers.get("content-type") || "";
  if (ctype && !/text\/html|application\/xhtml/i.test(ctype)) return null;
  const raw = await res.text();
  return raw.length > MAX_HTML_BYTES ? raw.slice(0, MAX_HTML_BYTES) : raw;
}

/** Normalize a possibly-bare website into an absolute https origin URL, or null. */
export function normalizeWebsite(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.trim();
  if (!s || /^(n\/?a|none|unknown)$/i.test(s)) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Website resolution — existing website, else Google Places websiteUri.
// ---------------------------------------------------------------------------

export async function resolveWebsite(
  ctx: ProviderContext,
  cost?: CostTracker,
): Promise<string | null> {
  const direct = normalizeWebsite(ctx.website);
  if (direct) return direct;
  const gKey = googleKey();
  if (!ctx.place_id || !gKey) return null;
  const res = await fetchWithRetry(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(
      ctx.place_id,
    )}?fields=websiteUri&key=${gKey}`,
  );
  cost?.addGoogle();
  if (!res || !res.ok) return null;
  try {
    const data = (await res.json()) as { websiteUri?: string };
    return normalizeWebsite(data.websiteUri);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// EMAIL finder
// ---------------------------------------------------------------------------

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Role mailboxes a human actually reads — preferred over personal/random ones.
const ROLE_LOCALPARTS = [
  "info",
  "contact",
  "admin",
  "office",
  "hello",
  "inquiries",
  "enquiries",
  "careers",
  "jobs",
  "hr",
  "recruiting",
  "hiring",
  "staffing",
  "frontdesk",
  "reception",
];

// Junk that the email regex picks up from analytics/CDN/image assets.
const JUNK_DOMAINS = [
  "example.com",
  "example.org",
  "sentry.io",
  "wix.com",
  "wixpress.com",
  "wordpress.com",
  "squarespace.com",
  "godaddy.com",
  "schema.org",
  "googleapis.com",
  "gstatic.com",
  "cloudflare.com",
  "w3.org",
  "sentry-next.wixpress.com",
];
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg|ico|bmp)$/i;

function cleanEmailCandidate(raw: string): string | null {
  const e = raw.trim().toLowerCase().replace(/^mailto:/, "").replace(/[.,;:)]+$/, "");
  if (!e.includes("@")) return null;
  if (IMAGE_EXT_RE.test(e)) return null; // e.g. logo@2x captured oddly, or asset paths
  const domain = e.split("@")[1] || "";
  if (JUNK_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) return null;
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(domain)) return null;
  if (/^(test|example|email|name|user|your|sample)@/.test(e)) return null;
  if (domain.length < 4 || !domain.includes(".")) return null;
  return e;
}

/** Rank: role mailboxes first, then non-no-reply, then everything else. */
function rankEmails(emails: string[]): string[] {
  const uniq = Array.from(new Set(emails));
  const score = (e: string): number => {
    const local = e.split("@")[0] || "";
    if (/^(no-?reply|do-?not-?reply|donotreply)/.test(local)) return 0;
    if (ROLE_LOCALPARTS.includes(local)) return 3;
    if (ROLE_LOCALPARTS.some((r) => local.startsWith(r))) return 2;
    return 1;
  };
  return uniq.sort((a, b) => score(b) - score(a));
}

function extractEmailsFromHtml(html: string): string[] {
  const found: string[] = [];
  // mailto: links are the highest-signal source
  const mailtoRe = /href\s*=\s*["']mailto:([^"'?]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = mailtoRe.exec(html)) !== null) {
    const c = cleanEmailCandidate(m[1]);
    if (c) found.push(c);
  }
  // then any bare address in the page text
  const bare = html.match(EMAIL_RE) || [];
  for (const b of bare) {
    const c = cleanEmailCandidate(b);
    if (c) found.push(c);
  }
  return rankEmails(found);
}

/**
 * Find a contactable email for a provider.
 * Waterfall: scrape homepage → /contact → /about, then Perplexity for stragglers.
 */
export async function findEmail(
  ctx: ProviderContext,
  cost?: CostTracker,
): Promise<EmailResult> {
  const website = await resolveWebsite(ctx, cost);
  if (website) {
    const origin = new URL(website).origin;
    const pages = [website, `${origin}/contact`, `${origin}/contact-us`, `${origin}/about`];
    const seen = new Set<string>();
    const candidates: string[] = [];
    for (const page of pages) {
      const html = await fetchHtml(page);
      if (!html) continue;
      for (const e of extractEmailsFromHtml(html)) {
        if (!seen.has(e)) {
          seen.add(e);
          candidates.push(e);
        }
      }
      // A role address on the homepage/contact page is good enough — stop early.
      if (candidates.length && ROLE_LOCALPARTS.includes(candidates[0].split("@")[0])) break;
    }
    const ranked = rankEmails(candidates);
    if (ranked.length) return { email: ranked[0], source: "scrape", candidates: ranked };
  }

  const fromPplx = await perplexityEmail(ctx, cost);
  if (fromPplx) return { email: fromPplx, source: "perplexity", candidates: [fromPplx] };

  return { email: null, source: null, candidates: [] };
}

async function perplexityEmail(
  ctx: ProviderContext,
  cost?: CostTracker,
): Promise<string | null> {
  if (!perplexityKey() || !ctx.name) return null;
  const loc = [ctx.city, ctx.state].filter(Boolean).join(", ");
  const prompt = `What is the public contact email address for "${ctx.name}"${
    loc ? ` in ${loc}` : ""
  }${ctx.website ? ` (website ${ctx.website})` : ""}? Return ONLY JSON: {"email": "address or null"}. Use a real, currently-published address from their website. Do not guess.`;
  const out = await perplexityJson(prompt, cost);
  const email = out && typeof out.email === "string" ? cleanEmailCandidate(out.email) : null;
  return email;
}

// ---------------------------------------------------------------------------
// CONTACT-FORM URL finder
// ---------------------------------------------------------------------------

// High-signal: the URL *path* itself is a contact page.
const CONTACT_PATH_RE =
  /\/(contact|contact-us|contactus|get-in-touch|request-info(?:rmation)?|inquir(?:y|e|ies)|schedule-a-tour|book-a-tour|website-inquiry|reach-us)\b/i;
// Lower-signal: only the link *text* looked contact-ish (e.g. "Schedule a Tour"
// pointing at a marketing page). Kept as a fallback, ranked last.
const CONTACT_TEXT_RE =
  /contact|get in touch|request info|inquir|schedule a tour|book a tour|reach us|email us/i;

// Known embedded form providers — presence is itself proof of a real form.
const FORM_EMBED_MARKERS = [
  /hbspt|hsforms|hubspot/i, // HubSpot
  /wufoo\.com/i,
  /jotform\.com/i,
  /typeform\.com/i,
  /gravity[-_]?forms|gform_wrapper/i, // Gravity Forms
  /formstack\.com/i,
  /docs\.google\.com\/forms|forms\.gle/i,
  /cognitoforms\.com/i,
];

/**
 * Does the page hold a *contact* form (not a header search box or a one-field
 * newsletter signup)? Require a known embed, OR a <form> that carries a message
 * <textarea>, OR a <form> with an email input plus at least two other inputs.
 * This is what rejects the "any <form> counts" false positives.
 */
function pageHasContactForm(html: string): boolean {
  if (FORM_EMBED_MARKERS.some((re) => re.test(html))) return true;
  const forms = html.match(/<form\b[\s\S]*?<\/form>/gi) || [];
  for (const form of forms) {
    if (/<textarea\b/i.test(form)) return true;
    const hasEmailInput = /<input[^>]*type\s*=\s*["']?email["']?/i.test(form);
    const inputCount = (form.match(/<input\b/gi) || []).length;
    if (hasEmailInput && inputCount >= 3) return true;
  }
  return false;
}

/**
 * Pull candidate contact-page URLs from anchors. Path matches (high signal)
 * are returned before text-only matches (low signal) so we validate the real
 * contact page before any marketing page a "tour" link happened to point at.
 */
function extractContactLinks(html: string, baseUrl: string): string[] {
  const pathMatches: string[] = [];
  const textMatches: string[] = [];
  // [\s\S] instead of . + the `s` flag so link text spanning newlines is
  // captured without depending on an es2018 regex target.
  const anchorRe = /<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(html)) !== null) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, " ").trim();
    if (/^(mailto:|tel:|javascript:)/i.test(href)) continue;
    let abs: string;
    try {
      abs = new URL(href, baseUrl).toString();
    } catch {
      continue;
    }
    if (!/^https?:\/\//i.test(abs)) continue;
    if (CONTACT_PATH_RE.test(new URL(abs).pathname)) pathMatches.push(abs);
    else if (CONTACT_TEXT_RE.test(text)) textMatches.push(abs);
  }
  return Array.from(new Set([...pathMatches, ...textMatches]));
}

/**
 * Find a submittable contact-form URL for a provider.
 * Scrape homepage → collect contact-ish links → validate one has a <form>/embed.
 * Falls back to the homepage itself if it embeds a form, then Perplexity.
 */
export async function findContactFormUrl(
  ctx: ProviderContext,
  cost?: CostTracker,
): Promise<ContactFormResult> {
  const website = await resolveWebsite(ctx, cost);
  if (website) {
    const homeHtml = await fetchHtml(website);
    if (homeHtml) {
      // Prefer dedicated contact pages over the homepage.
      const candidates = [
        ...extractContactLinks(homeHtml, website),
        `${new URL(website).origin}/contact`,
        `${new URL(website).origin}/contact-us`,
      ];
      const seen = new Set<string>();
      for (const url of candidates) {
        if (seen.has(url)) continue;
        seen.add(url);
        const html = await fetchHtml(url);
        if (html && pageHasContactForm(html)) return { url, source: "scrape" };
      }
      // Homepage itself embeds a contact form (common on one-pagers).
      if (pageHasContactForm(homeHtml)) return { url: website, source: "scrape" };
    }
  }

  const fromPplx = await perplexityContactForm(ctx, cost);
  if (fromPplx) {
    // Trust only if it actually resolves to a real contact-form page.
    const html = await fetchHtml(fromPplx);
    if (html && pageHasContactForm(html)) return { url: fromPplx, source: "perplexity" };
  }

  return { url: null, source: null };
}

async function perplexityContactForm(
  ctx: ProviderContext,
  cost?: CostTracker,
): Promise<string | null> {
  if (!perplexityKey() || !ctx.name) return null;
  const loc = [ctx.city, ctx.state].filter(Boolean).join(", ");
  const prompt = `What is the URL of the online contact form or "request information" page for "${ctx.name}"${
    loc ? ` in ${loc}` : ""
  }${ctx.website ? ` (website ${ctx.website})` : ""}? It must be a page with a fillable web form, not a phone number or email. Return ONLY JSON: {"url": "https://... or null"}. Do not guess.`;
  const out = await perplexityJson(prompt, cost);
  const url = out && typeof out.url === "string" ? normalizeWebsite(out.url) : null;
  return url;
}

// ---------------------------------------------------------------------------
// Phone / fax / address finders. Same scrape-first → Perplexity-fallback
// pattern as findEmail / findContactFormUrl.
// ---------------------------------------------------------------------------

/** US phone-number regex. Matches:
 *   (555) 123-4567 · 555-123-4567 · 555.123.4567 · 555 123 4567 · 5551234567
 *   +1 prefix optional. Excludes most 1-800 numbers we'd want to skip if
 *   bracketed by toll-free context.
 */
const PHONE_RE =
  /(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/g;

function normalizePhone(match: RegExpExecArray): string {
  return `(${match[1]}) ${match[2]}-${match[3]}`;
}

/** Pull all phone numbers from HTML. Returns ordered list — `tel:` links
 *  first (they're authoritative), then visible matches in document order.
 *  Each entry comes with a small BEFORE-context (the 40 characters
 *  preceding the match) so the caller can tell fax from phone — "fax"
 *  labels in human-written copy appear BEFORE the number, not after. A
 *  wider any-direction window false-positives in tight markup where
 *  the next phone is "Fax: …". */
function extractPhonesFromHtml(html: string): Array<{ phone: string; context: string }> {
  const out: Array<{ phone: string; context: string }> = [];
  const seen = new Set<string>();
  // 1. tel: links — most authoritative
  const telRe = /([^>]{0,40})href=["']tel:([+\d().\s-]+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = telRe.exec(html))) {
    const digits = m[2].replace(/\D/g, "");
    if (digits.length !== 10 && !(digits.length === 11 && digits.startsWith("1"))) continue;
    const d = digits.length === 11 ? digits.slice(1) : digits;
    const formatted = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    if (seen.has(formatted)) continue;
    seen.add(formatted);
    out.push({ phone: formatted, context: m[1] });
  }
  // 2. visible regex matches — context is the 40 chars BEFORE the number.
  PHONE_RE.lastIndex = 0;
  while ((m = PHONE_RE.exec(html))) {
    const formatted = normalizePhone(m);
    if (seen.has(formatted)) continue;
    seen.add(formatted);
    const start = Math.max(0, m.index - 40);
    out.push({ phone: formatted, context: html.slice(start, m.index) });
  }
  return out;
}

/** True when "fax" appears in the BEFORE-context of a phone match. */
function looksLikeFax(context: string): boolean {
  return /\bfax\b/i.test(context);
}

/** Scrape-then-Perplexity finder for the General Contact phone. Skips
 *  numbers that look like a fax line. */
export async function findPhone(
  ctx: ProviderContext,
  cost?: CostTracker,
): Promise<PhoneResult> {
  const website = await resolveWebsite(ctx, cost);
  if (website) {
    const origin = new URL(website).origin;
    const pages = [website, `${origin}/contact`, `${origin}/contact-us`];
    for (const page of pages) {
      const html = await fetchHtml(page);
      if (!html) continue;
      const phones = extractPhonesFromHtml(html);
      // Prefer the first non-fax phone.
      const phone = phones.find((p) => !looksLikeFax(p.context));
      if (phone) return { phone: phone.phone, source: "scrape" };
    }
  }
  const fromPplx = await perplexityPhone(ctx, cost);
  if (fromPplx) return { phone: fromPplx, source: "perplexity" };
  return { phone: null, source: null };
}

/** Same as findPhone but looks for fax-tagged numbers. Hit rate is low in
 *  practice — most agencies don't publish fax lines anymore. */
export async function findFax(
  ctx: ProviderContext,
  cost?: CostTracker,
): Promise<FaxResult> {
  const website = await resolveWebsite(ctx, cost);
  if (website) {
    const origin = new URL(website).origin;
    const pages = [`${origin}/contact`, `${origin}/contact-us`, website];
    for (const page of pages) {
      const html = await fetchHtml(page);
      if (!html) continue;
      const phones = extractPhonesFromHtml(html);
      const fax = phones.find((p) => looksLikeFax(p.context));
      if (fax) return { fax: fax.phone, source: "scrape" };
    }
  }
  // Perplexity for fax is usually noise; only ask if the prompt is cheap +
  // the call is gated by env key.
  const fromPplx = await perplexityFax(ctx, cost);
  if (fromPplx) return { fax: fromPplx, source: "perplexity" };
  return { fax: null, source: null };
}

async function perplexityPhone(
  ctx: ProviderContext,
  cost?: CostTracker,
): Promise<string | null> {
  if (!perplexityKey() || !ctx.name) return null;
  const loc = [ctx.city, ctx.state].filter(Boolean).join(", ");
  const prompt = `What is the publicly listed phone number for "${ctx.name}"${
    loc ? ` in ${loc}` : ""
  }${ctx.website ? ` (website ${ctx.website})` : ""}? Return ONLY JSON: {"phone": "(555) 123-4567 or null"}. Use US format. Do not guess.`;
  const out = await perplexityJson(prompt, cost);
  if (!out || typeof out.phone !== "string") return null;
  const digits = out.phone.replace(/\D/g, "");
  const d = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (d.length !== 10) return null;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

async function perplexityFax(
  ctx: ProviderContext,
  cost?: CostTracker,
): Promise<string | null> {
  if (!perplexityKey() || !ctx.name) return null;
  const loc = [ctx.city, ctx.state].filter(Boolean).join(", ");
  const prompt = `What is the publicly listed FAX number for "${ctx.name}"${
    loc ? ` in ${loc}` : ""
  }${ctx.website ? ` (website ${ctx.website})` : ""}? Many small agencies don't have one — return null if none. Return ONLY JSON: {"fax": "(555) 123-4567 or null"}.`;
  const out = await perplexityJson(prompt, cost);
  if (!out || typeof out.fax !== "string") return null;
  const digits = out.fax.replace(/\D/g, "");
  const d = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (d.length !== 10) return null;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Find + parse a US address into structured parts. Lets Perplexity do the
 *  parsing because scraped addresses arrive in many shapes (single line,
 *  multi-line, with country, with "Suite" variations) and the four-part
 *  structured form is what `research_data.general_contact` stores. */
export async function findAddress(
  ctx: ProviderContext,
  cost?: CostTracker,
): Promise<AddressResult> {
  // Perplexity-first here: structured JSON output beats heuristic parsing
  // of arbitrarily-shaped scraped addresses. Admins can still edit the
  // parts manually if any field is off.
  const fromPplx = await perplexityAddress(ctx, cost);
  if (fromPplx) return { ...fromPplx, source: "perplexity" };
  return { street: null, city: null, state: null, zip: null, source: null };
}

async function perplexityAddress(
  ctx: ProviderContext,
  cost?: CostTracker,
): Promise<{ street: string | null; city: string | null; state: string | null; zip: string | null } | null> {
  if (!perplexityKey() || !ctx.name) return null;
  const loc = [ctx.city, ctx.state].filter(Boolean).join(", ");
  const prompt = `What is the publicly listed US street address for "${ctx.name}"${
    loc ? ` in ${loc}` : ""
  }${ctx.website ? ` (website ${ctx.website})` : ""}? Return ONLY JSON: {"street": "1234 Main St, Suite 200 or null", "city": "City or null", "state": "TX or null", "zip": "12345 or null"}. Use 2-letter state, 5-digit ZIP. Do not guess if not findable.`;
  const out = await perplexityJson(prompt, cost);
  if (!out) return null;
  const street = typeof out.street === "string" && out.street.trim() ? out.street.trim() : null;
  const city = typeof out.city === "string" && out.city.trim() ? out.city.trim() : null;
  const state =
    typeof out.state === "string" && /^[A-Z]{2}$/i.test(out.state.trim())
      ? out.state.trim().toUpperCase()
      : null;
  const zip =
    typeof out.zip === "string" && /^\d{5}(?:-\d{4})?$/.test(out.zip.trim())
      ? out.zip.trim()
      : null;
  if (!street && !city && !state && !zip) return null;
  return { street, city, state, zip };
}

// ---------------------------------------------------------------------------
// Perplexity Sonar — shared JSON helper (mirrors enrich-city.js call shape).
// ---------------------------------------------------------------------------

export async function perplexityJson(
  prompt: string,
  cost?: CostTracker,
): Promise<Record<string, unknown> | null> {
  const pKey = perplexityKey();
  if (!pKey) return null;
  const res = await fetchWithRetry("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    }),
  });
  cost?.addPerplexity();
  if (!res || !res.ok) return null;
  try {
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content || "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}
