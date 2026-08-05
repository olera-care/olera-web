import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  resolveWebsite,
  type ProviderContext,
} from "@/lib/medjobs/outreach-enrichment";

/**
 * POST /api/admin/provider-outreach/find-linkedin
 *
 * Scrapes a provider's website for their LinkedIn company page URL.
 * Checks footer, contact page, and about page for LinkedIn links.
 *
 * Body: { provider_id: string } or { provider_id: string, manual_url: string }
 *
 * Returns: { linkedin_url: string | null, source_url: string | null, website: string | null }
 */
export const runtime = "nodejs";
export const maxDuration = 30;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 500_000;

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

/**
 * Extract LinkedIn company/school page URLs from HTML.
 * Matches patterns like:
 *   linkedin.com/company/company-name
 *   linkedin.com/school/school-name
 * Ignores personal profiles (linkedin.com/in/...).
 */
function extractLinkedInUrls(html: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  // Match href="..." or href='...' containing linkedin.com
  const hrefRe = /href=["'](https?:\/\/(?:www\.)?linkedin\.com\/(?:company|school)\/[a-zA-Z0-9_-]+\/?)[^"']*["']/gi;
  let m: RegExpExecArray | null;
  while ((m = hrefRe.exec(html))) {
    const url = m[1].replace(/\/+$/, ""); // trim trailing slash
    const key = url.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      urls.push(url);
    }
  }

  // Also check for plain text linkedin URLs (not in href)
  const textRe = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|school)\/[a-zA-Z0-9_-]+/gi;
  while ((m = textRe.exec(html))) {
    let url = m[0];
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    url = url.replace(/\/+$/, "");
    const key = url.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      urls.push(url);
    }
  }

  return urls;
}

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

    const body = (await request.json()) as { provider_id?: string; manual_url?: string };
    const providerId = body.provider_id?.trim();
    const manualUrl = body.manual_url?.trim();

    if (!providerId) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Manual save: admin pasted a LinkedIn URL directly
    if (manualUrl) {
      await db
        .from("provider_outreach_tracking")
        .update({
          linkedin_url: manualUrl,
          linkedin_found_at: new Date().toISOString(),
        })
        .eq("provider_id", providerId);

      return NextResponse.json({
        linkedin_url: manualUrl,
        source_url: null,
        website: null,
      });
    }

    // Fetch provider
    const { data: provider, error: provError } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, website, place_id, city, state")
      .eq("provider_id", providerId)
      .maybeSingle();

    if (provError || !provider) {
      return NextResponse.json(
        { error: provError ? "Failed to fetch provider" : "Provider not found" },
        { status: provError ? 500 : 404 },
      );
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
      return NextResponse.json({
        linkedin_url: null,
        source_url: null,
        website: null,
        error_detail: "No website found for this provider",
      });
    }

    const origin = new URL(website).origin;
    const pagesToCheck = [
      website, // homepage (footer is here)
      `${origin}/contact`,
      `${origin}/contact-us`,
      `${origin}/about`,
      `${origin}/about-us`,
    ];

    // Dedupe
    const seen = new Set<string>();
    const uniquePages = pagesToCheck.filter((url) => {
      const key = url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let bestLinkedIn: { url: string; sourceUrl: string } | null = null;

    for (const pageUrl of uniquePages) {
      if (pageUrl !== uniquePages[0]) {
        await new Promise((r) => setTimeout(r, 500));
      }

      const html = await fetchHtml(pageUrl);
      if (!html) continue;

      const linkedInUrls = extractLinkedInUrls(html);
      if (linkedInUrls.length > 0) {
        bestLinkedIn = { url: linkedInUrls[0], sourceUrl: pageUrl };
        break;
      }
    }

    // Save result
    if (bestLinkedIn) {
      await db
        .from("provider_outreach_tracking")
        .update({
          linkedin_url: bestLinkedIn.url,
          linkedin_found_at: new Date().toISOString(),
        })
        .eq("provider_id", providerId);
    }

    return NextResponse.json({
      linkedin_url: bestLinkedIn?.url ?? null,
      source_url: bestLinkedIn?.sourceUrl ?? website,
      website,
    });
  } catch (e) {
    console.error("[find-linkedin] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "LinkedIn lookup failed" },
      { status: 500 },
    );
  }
}
