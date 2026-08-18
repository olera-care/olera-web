import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/find-contact-form
 *
 * Automatically find a contact form URL from a provider's website.
 * Crawls the website looking for common contact page patterns.
 *
 * Request body:
 *   - provider_id: string (required)
 *   - website: string (required) - the provider's website URL
 *
 * Returns:
 *   - found: boolean
 *   - url?: string - the contact form URL if found
 *   - checked_urls?: string[] - URLs that were checked (for debugging)
 */

// Common contact page path patterns to check
const CONTACT_PAGE_PATTERNS = [
  "/contact",
  "/contact-us",
  "/contactus",
  "/contact-us/",
  "/contact/",
  "/get-in-touch",
  "/reach-us",
  "/reach-out",
  "/connect",
  "/connect-with-us",
  "/about/contact",
  "/about-us/contact",
  "/info/contact",
  "/support/contact",
  "/help/contact",
];

// Patterns in href or link text that suggest a contact page
const CONTACT_LINK_PATTERNS = [
  /contact/i,
  /get.?in.?touch/i,
  /reach.?(us|out)/i,
  /connect.?with/i,
];

// Timeout for fetch requests (ms)
const FETCH_TIMEOUT = 8000;

/**
 * Fetch a URL with timeout
 */
async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OleraBot/1.0; +https://olera.care)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Normalize a website URL to ensure it has a protocol
 */
function normalizeUrl(website: string): string {
  let url = website.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  // Remove trailing slash for consistency
  return url.replace(/\/$/, "");
}

/**
 * Check if a URL exists and returns HTML content
 */
async function urlExists(url: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(url, FETCH_TIMEOUT);
    const contentType = response.headers.get("content-type") || "";
    return response.ok && contentType.includes("text/html");
  } catch {
    return false;
  }
}

/**
 * Check if HTML content contains a form element
 */
function containsForm(html: string): boolean {
  // Simple check for form elements
  return /<form[\s>]/i.test(html);
}

/**
 * Extract contact page links from HTML
 */
function extractContactLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];

  // Match href attributes
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];

    // Check if href matches contact patterns
    const isContactLink = CONTACT_LINK_PATTERNS.some(pattern => pattern.test(href));

    if (isContactLink) {
      // Convert relative URLs to absolute
      let absoluteUrl = href;
      if (href.startsWith("/")) {
        absoluteUrl = `${baseUrl}${href}`;
      } else if (!href.startsWith("http")) {
        absoluteUrl = `${baseUrl}/${href}`;
      }

      // Only add if it's on the same domain
      try {
        const linkUrl = new URL(absoluteUrl);
        const baseUrlObj = new URL(baseUrl);
        if (linkUrl.hostname === baseUrlObj.hostname || linkUrl.hostname.endsWith(`.${baseUrlObj.hostname}`)) {
          links.push(absoluteUrl);
        }
      } catch {
        // Invalid URL, skip
      }
    }
  }

  return [...new Set(links)]; // Dedupe
}

/**
 * Find contact form URL from a website
 */
async function findContactForm(website: string): Promise<{ found: boolean; url?: string; checkedUrls: string[] }> {
  const baseUrl = normalizeUrl(website);
  const checkedUrls: string[] = [];

  // First, check common contact page patterns
  for (const pattern of CONTACT_PAGE_PATTERNS) {
    const url = `${baseUrl}${pattern}`;
    checkedUrls.push(url);

    try {
      const response = await fetchWithTimeout(url, FETCH_TIMEOUT);
      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("text/html")) {
          const html = await response.text();
          // Check if page has a form (likely a contact form)
          if (containsForm(html)) {
            return { found: true, url, checkedUrls };
          }
          // Even without a form, a contact page is useful (might have email/phone)
          // But prefer pages with forms
        }
      }
    } catch {
      // URL doesn't exist or timed out, continue
    }
  }

  // If no common patterns found, try to find contact links on the homepage
  try {
    const homepageResponse = await fetchWithTimeout(baseUrl, FETCH_TIMEOUT);
    if (homepageResponse.ok) {
      const homepageHtml = await homepageResponse.text();
      const contactLinks = extractContactLinks(homepageHtml, baseUrl);

      // Check each contact link for a form
      for (const link of contactLinks.slice(0, 5)) { // Limit to 5 links
        if (checkedUrls.includes(link)) continue;
        checkedUrls.push(link);

        try {
          const response = await fetchWithTimeout(link, FETCH_TIMEOUT);
          if (response.ok) {
            const html = await response.text();
            if (containsForm(html)) {
              return { found: true, url: link, checkedUrls };
            }
          }
        } catch {
          // Continue to next link
        }
      }

      // If we found contact links but none had forms, return the first one
      // (it's still likely a contact page with email/phone info)
      if (contactLinks.length > 0) {
        return { found: true, url: contactLinks[0], checkedUrls };
      }
    }
  } catch {
    // Homepage fetch failed
  }

  // Last resort: check if any of the common URLs exist (even without forms)
  for (const pattern of CONTACT_PAGE_PATTERNS.slice(0, 3)) {
    const url = `${baseUrl}${pattern}`;
    if (!checkedUrls.includes(url)) {
      checkedUrls.push(url);
    }
    if (await urlExists(url)) {
      return { found: true, url, checkedUrls };
    }
  }

  return { found: false, checkedUrls };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { provider_id, website } = body;

    if (!provider_id || typeof provider_id !== "string") {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    if (!website || typeof website !== "string") {
      return NextResponse.json({ error: "website is required" }, { status: 400 });
    }

    // Find contact form
    const result = await findContactForm(website);
    const nowIso = new Date().toISOString();

    // Update tracking record with result
    const db = getServiceClient();

    if (result.found && result.url) {
      // Save the found URL
      const { error: updateError } = await db
        .from("provider_outreach_tracking")
        .update({
          contact_form_url: result.url,
          contact_form_status: "found",
          updated_at: nowIso,
        })
        .eq("provider_id", provider_id);

      if (updateError) {
        console.error("[find-contact-form] Update error:", updateError);
        // Non-fatal, continue
      }
    } else {
      // Mark as not found
      const { error: updateError } = await db
        .from("provider_outreach_tracking")
        .update({
          contact_form_status: "not_found",
          updated_at: nowIso,
        })
        .eq("provider_id", provider_id);

      if (updateError) {
        console.error("[find-contact-form] Update error:", updateError);
        // Non-fatal, continue
      }
    }

    return NextResponse.json({
      found: result.found,
      url: result.url,
      checked_urls: result.checkedUrls,
    });
  } catch (err) {
    console.error("[find-contact-form] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
