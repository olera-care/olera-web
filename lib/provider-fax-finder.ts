/**
 * Provider fax finder - scrapes provider websites to find fax numbers.
 *
 * Used by:
 *   - /api/admin/provider-outreach/find-fax (manual trigger)
 *   - /api/cron/provider-outreach-sequence-check (auto-enrich on stage change)
 */

import {
  resolveWebsite,
  sleep,
  type ProviderContext,
} from "@/lib/medjobs/outreach-enrichment";
import { SupabaseClient } from "@supabase/supabase-js";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 500_000;

const PHONE_RE = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

async function fetchHtml(url: string): Promise<string | null> {
  if (!/^https?:\/\//i.test(url)) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": UA },
    });
    if (!res.ok) return null;
    const ctype = res.headers.get("content-type") || "";
    if (ctype && !/text\/html|application\/xhtml/i.test(ctype)) return null;
    const raw = await res.text();
    return raw.length > MAX_HTML_BYTES ? raw.slice(0, MAX_HTML_BYTES) : raw;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

interface PhoneMatch {
  phone: string;
  context: string;
}

function extractPhonesWithContext(html: string): PhoneMatch[] {
  const out: PhoneMatch[] = [];
  const seen = new Set<string>();

  // 1. tel: links (most authoritative)
  const telRe = /([^>]{0,80})href=["']tel:([+\d().\s-]+)["']([^<]{0,80})/gi;
  let m: RegExpExecArray | null;
  while ((m = telRe.exec(html))) {
    const digits = m[2].replace(/\D/g, "");
    if (digits.length !== 10 && !(digits.length === 11 && digits.startsWith("1"))) continue;
    const d = digits.length === 11 ? digits.slice(1) : digits;
    const formatted = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    if (seen.has(formatted)) continue;
    seen.add(formatted);
    out.push({ phone: formatted, context: (m[1] + m[3]).toLowerCase() });
  }

  // 2. Visible regex matches
  PHONE_RE.lastIndex = 0;
  while ((m = PHONE_RE.exec(html))) {
    const raw = m[0];
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 10 && !(digits.length === 11 && digits.startsWith("1"))) continue;
    const d = digits.length === 11 ? digits.slice(1) : digits;
    const formatted = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    if (seen.has(formatted)) continue;
    seen.add(formatted);
    const start = Math.max(0, m.index - 80);
    const end = Math.min(html.length, m.index + raw.length + 80);
    out.push({ phone: formatted, context: html.slice(start, end).toLowerCase() });
  }

  return out;
}

type Confidence = "high" | "unsure";

function classifyFax(match: PhoneMatch): Confidence | null {
  const ctx = match.context;
  const digits = match.phone.replace(/\D/g, "");
  const digitPattern = digits.split("").join("[^\\d]{0,3}");
  const ctxParts = ctx.split(new RegExp(digitPattern));
  const beforeCtx = (ctxParts[0] || "").trim();
  const afterCtx = (ctxParts[1] || "").trim();

  // Reject if labeled as phone
  if (/\b(phone|telephone|tel|call|mobile|cell|main|office line)\s*[:.\s#)]*$/i.test(beforeCtx.slice(-40))) {
    return null;
  }
  if (/^\s*[\s(]*(phone|telephone|tel|main|office)\b/i.test(afterCtx.slice(0, 30))) {
    return null;
  }

  const nearBefore = beforeCtx.slice(-40);

  // High confidence: fax label directly precedes
  if (/\bfax\s*[:.]?\s*$/i.test(nearBefore)) return "high";
  if (/\bfacsimile\s*[:.]?\s*$/i.test(nearBefore)) return "high";
  if (/\bf\s*:\s*$/i.test(nearBefore)) return "high";

  // Check after the number
  const nearAfter = afterCtx.slice(0, 30);
  if (/^\s*[\s(]*fax[).\s]/i.test(nearAfter) || /^\s*\(fax\)/i.test(nearAfter)) return "high";

  // Unsure: fax mentioned nearby but not as direct label
  if (/\bfax\b/i.test(ctx)) {
    const isLabeledAsPhone = /\b(phone|telephone|tel|call)\b/i.test(nearBefore);
    if (!isLabeledAsPhone) return "unsure";
  }

  return null;
}

export interface FaxFinderResult {
  fax: string | null;
  source_url: string | null;
  confidence: Confidence | null;
  website: string | null;
}

export interface FaxFinderProvider {
  provider_id: string;
  provider_name: string | null;
  website: string | null;
  place_id: string | null;
  city: string | null;
  state: string | null;
}

/**
 * Find fax number for a provider by scraping their website.
 * Does NOT save to database - caller handles persistence.
 */
export async function findFaxForProvider(
  provider: FaxFinderProvider
): Promise<FaxFinderResult> {
  const ctx: ProviderContext = {
    name: provider.provider_name || null,
    website: provider.website || null,
    place_id: provider.place_id || null,
    city: provider.city || null,
    state: provider.state || null,
  };

  const website = await resolveWebsite(ctx);
  if (!website) {
    return { fax: null, source_url: null, confidence: null, website: null };
  }

  const origin = new URL(website).origin;
  const pagesToCheck = [
    `${origin}/contact`,
    `${origin}/contact-us`,
    website,
    `${origin}/about`,
    `${origin}/about-us`,
  ];

  const seen = new Set<string>();
  const uniquePages = pagesToCheck.filter((url) => {
    const key = url.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let bestFax: { phone: string; confidence: Confidence; sourceUrl: string } | null = null;

  for (const pageUrl of uniquePages) {
    if (pageUrl !== uniquePages[0]) {
      await sleep(800);
    }

    const html = await fetchHtml(pageUrl);
    if (!html) continue;

    const phones = extractPhonesWithContext(html);
    for (const match of phones) {
      const confidence = classifyFax(match);
      if (!confidence) continue;

      if (confidence === "high") {
        bestFax = { phone: match.phone, confidence, sourceUrl: pageUrl };
        break;
      }
      if (!bestFax) {
        bestFax = { phone: match.phone, confidence, sourceUrl: pageUrl };
      }
    }

    if (bestFax?.confidence === "high") break;
  }

  return {
    fax: bestFax?.phone ?? null,
    source_url: bestFax?.sourceUrl ?? website,
    confidence: bestFax?.confidence ?? null,
    website,
  };
}

/**
 * Save fax finder result to provider_outreach_tracking.
 */
export async function saveFaxResult(
  db: SupabaseClient,
  providerId: string,
  result: FaxFinderResult
): Promise<void> {
  try {
    const { error } = await db
      .from("provider_outreach_tracking")
      .update({
        fax_number: result.fax,
        fax_source_url: result.source_url,
        fax_confidence: result.confidence,
        fax_found_at: new Date().toISOString(),
      })
      .eq("provider_id", providerId);

    if (error) {
      console.error("[provider-fax-finder] Failed to save result:", error);
    }
  } catch (err) {
    console.error("[provider-fax-finder] Save error:", err);
  }
}
