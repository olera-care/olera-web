import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  resolveWebsite,
  normalizeWebsite,
  sleep,
  type ProviderContext,
} from "@/lib/medjobs/outreach-enrichment";

/**
 * POST /api/admin/provider-outreach/find-fax
 *
 * Scrapes a provider's website for a fax number.
 * Returns the number, source URL, and confidence level.
 *
 * Body: { provider_id: string }
 *
 * Returns:
 * {
 *   fax: "(555) 123-4567" | null,
 *   source_url: "https://example.com/contact" | null,
 *   confidence: "high" | "unsure" | null,
 *   website: "https://example.com"
 * }
 *
 * Also writes result to provider_outreach_tracking (fax_number, fax_source_url,
 * fax_confidence, fax_found_at) so it persists across sessions.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

// ---- Scraping helpers (inline to avoid coupling to MedJobs module) --------

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 500_000;

const PHONE_RE =
  /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

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
  context: string; // ~80 chars surrounding the match
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

  // 2. Visible regex matches — grab 80 chars around the number
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

/**
 * Determines if a phone match is a fax number, and with what confidence.
 *
 * high   = the number is directly labeled as "fax" (label appears before the number)
 * unsure = "fax" is nearby but the labeling is ambiguous
 * null   = doesn't look like fax at all, or is explicitly labeled as phone
 */
function classifyFax(
  match: PhoneMatch,
  allMatches: PhoneMatch[],
): Confidence | null {
  const ctx = match.context;

  // If this number is explicitly labeled as phone/tel/call, it's NOT a fax
  // Check the ~30 chars immediately before the number for a phone label
  const digits = match.phone.replace(/\D/g, "");
  const digitPattern = digits.split("").join("[^\\d]{0,3}");
  const ctxParts = ctx.split(new RegExp(digitPattern));
  const beforeCtx = (ctxParts[0] || "").trim();
  const afterCtx = (ctxParts[1] || "").trim();

  // Reject if "phone" (or synonyms) appears within 40 chars before the number
  if (/\b(phone|telephone|tel|call|mobile|cell|main|office line)\s*[:.\s#)]*$/i.test(beforeCtx.slice(-40))) {
    return null;
  }
  // Reject if "(phone)" or "phone" appears right after the number
  if (/^\s*[\s(]*(phone|telephone|tel|main|office)\b/i.test(afterCtx.slice(0, 30))) {
    return null;
  }

  // For the "before" context, split on the phone number digits and check
  // what label appears closest before it. This handles:
  //   "Phone: 972-985-6050  Fax: 972-767-4587"
  // where the 80-char window around 972-985-6050 might contain "Fax" but
  // it's labeling the OTHER number.

  const before = beforeCtx;

  // Check last 40 chars before the number for a fax label
  const nearBefore = before.slice(-40);

  // Strong: "fax" label directly precedes this number
  if (/\bfax\s*[:.]?\s*$/i.test(nearBefore)) return "high";
  if (/\bfacsimile\s*[:.]?\s*$/i.test(nearBefore)) return "high";
  if (/\bf\s*:\s*$/i.test(nearBefore)) return "high";

  // Check after the number too (some sites put "fax" after: "972-767-4587 (fax)")
  const nearAfter = afterCtx.slice(0, 30);
  if (/^\s*[\s(]*fax[).\s]/i.test(nearAfter) || /^\s*\(fax\)/i.test(nearAfter)) return "high";

  // Unsure: "fax" appears in the broader context but not as a direct label
  // Only if this number is NOT labeled as phone
  if (/\bfax\b/i.test(ctx)) {
    const isLabeledAsPhone = /\b(phone|telephone|tel|call)\b/i.test(nearBefore);
    if (!isLabeledAsPhone) return "unsure";
  }

  return null;
}

// ---- Main handler ---------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = (await request.json()) as { provider_id?: string; manual_fax?: string };
    const providerId = body.provider_id?.trim();
    const manualFax = body.manual_fax?.trim();

    if (!providerId) {
      return NextResponse.json(
        { error: "provider_id is required" },
        { status: 400 },
      );
    }

    // Manual save: admin typed/pasted a fax number directly
    if (manualFax) {
      const db = getServiceClient();
      await saveFaxResult(db, providerId, manualFax, null, "high");
      return NextResponse.json({
        fax: manualFax,
        source_url: null,
        confidence: "high",
        website: null,
      });
    }

    const db = getServiceClient();

    // Fetch provider
    const { data: provider, error: provError } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, website, place_id, city, state")
      .eq("provider_id", providerId)
      .maybeSingle();

    if (provError) {
      console.error("[find-fax] Provider query error:", provError);
      return NextResponse.json({ error: "Failed to fetch provider" }, { status: 500 });
    }
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Resolve website
    const ctx: ProviderContext = {
      name: provider.provider_name || null,
      website: provider.website || null,
      place_id: provider.place_id || null,
      city: provider.city || null,
      state: provider.state || null,
    };

    const website = await resolveWebsite(ctx);
    if (!website) {
      // Still write result (no website = no fax)
      await saveFaxResult(db, providerId, null, null, null);
      return NextResponse.json({
        fax: null,
        source_url: null,
        confidence: null,
        website: null,
        error_detail: "No website found for this provider",
      });
    }

    const origin = new URL(website).origin;
    const pagesToCheck = [
      `${origin}/contact`,
      `${origin}/contact-us`,
      website, // homepage
      `${origin}/about`,
      `${origin}/about-us`,
    ];

    // Dedupe URLs
    const seen = new Set<string>();
    const uniquePages = pagesToCheck.filter((url) => {
      const key = url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let bestFax: { phone: string; confidence: Confidence; sourceUrl: string } | null = null;

    for (const pageUrl of uniquePages) {
      // Small delay between requests to be polite
      if (pageUrl !== uniquePages[0]) {
        await sleep(800);
      }

      const html = await fetchHtml(pageUrl);
      if (!html) continue;

      const phones = extractPhonesWithContext(html);
      for (const match of phones) {
        const confidence = classifyFax(match, phones);
        if (!confidence) continue;

        // Take "high" immediately, or keep first "unsure"
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

    // Write result to tracking table
    await saveFaxResult(
      db,
      providerId,
      bestFax?.phone ?? null,
      bestFax?.sourceUrl ?? website, // always give them a link to check
      bestFax?.confidence ?? null,
    );

    return NextResponse.json({
      fax: bestFax?.phone ?? null,
      source_url: bestFax?.sourceUrl ?? website,
      confidence: bestFax?.confidence ?? null,
      website,
    });
  } catch (e) {
    console.error("[find-fax] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fax lookup failed" },
      { status: 500 },
    );
  }
}

async function saveFaxResult(
  db: ReturnType<typeof getServiceClient>,
  providerId: string,
  faxNumber: string | null,
  sourceUrl: string | null,
  confidence: string | null,
) {
  try {
    const { error } = await db
      .from("provider_outreach_tracking")
      .update({
        fax_number: faxNumber,
        fax_source_url: sourceUrl,
        fax_confidence: confidence,
        fax_found_at: new Date().toISOString(),
      })
      .eq("provider_id", providerId);

    if (error) {
      console.error("[find-fax] Failed to save fax result:", error);
    }
  } catch (err) {
    console.error("[find-fax] Save error:", err);
  }
}
