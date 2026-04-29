import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isBotRequest, incrementBotReject } from "@/lib/analytics/bot-filter";

const PROVIDER_EVENT_TYPES = [
  "email_click",
  "page_view",
  "lead_opened",
  "question_received",
  "question_responded",
  "review_viewed",
  "one_click_access",
  "contact_revealed",
  "reviews_cta_clicked",
  "analytics_teaser_impression",
  "analytics_teaser_cta_clicked",
  "provider_profile_edited",
  "provider_picker_impression",
  "provider_picker_clicked",
] as const;

const FAMILY_EVENT_TYPES = [
  "connection_sent",
  "profile_enriched",
  "email_click",
  "question_asked",
  "matches_activated",
] as const;

// Anonymous events are care-seeker-driven but lack a known profile_id.
// They write to provider_activity (not seeker_activity) keyed on the
// related provider's slug; session_id (in metadata) enables nightly dedup.
const ANONYMOUS_EVENT_TYPES = [
  "page_view",
  "search_click",
  "cta_click_public",
  "benefits_started",
] as const;

const OLERA_HOSTS = new Set([
  "olera.care",
  "www.olera.care",
  "olera2-web.vercel.app",
  "staging-olera2-web.vercel.app",
  "localhost",
]);

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

function classifyUserAgent(ua: string | null): "mobile" | "tablet" | "desktop" | "other" {
  if (!ua) return "other";
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobile|iPhone|Android/i.test(ua)) return "mobile";
  if (/Mozilla|Chrome|Safari|Firefox|Edg/i.test(ua)) return "desktop";
  return "other";
}

/**
 * Reduce a raw referrer URL to either an Olera-internal path or just the
 * external domain. Never store query strings on external referrers — they
 * can leak search terms (PII risk per Phase 0 privacy review).
 */
function sanitizeReferrer(rawReferrer: string | null | undefined): string | null {
  if (!rawReferrer) return null;
  try {
    const u = new URL(rawReferrer);
    if (OLERA_HOSTS.has(u.hostname)) {
      return `internal:${u.pathname}`;
    }
    return u.hostname;
  } catch {
    return null;
  }
}

/**
 * POST /api/activity/track
 *
 * Log an engagement event. Supports three actor types:
 *
 * actor_type="provider" (default): provider email clicks → provider_activity
 *   Required: provider_id, event_type
 *
 * actor_type="family": care seeker engagement (authenticated) → seeker_activity
 *   Required: profile_id, event_type
 *   Optional: related_provider_id, email_log_id, email_type, metadata
 *
 * actor_type="anonymous": unauthenticated care-seeker engagement → provider_activity
 *   Required: related_provider_id (slug), event_type, session_id
 *   Bot-filtered server-side; rejected requests return 204 (no leak of filter).
 *   Referrer is sanitized to domain-only for non-Olera referrers.
 *   No raw User-Agent stored — only ua_class.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      actor_type = "provider",
      provider_id,
      profile_id,
      event_type,
      email_log_id,
      email_type,
      related_provider_id,
      session_id,
      metadata,
    } = body;

    const db = getServiceDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // --- Anonymous events → provider_activity (no profile_id) ---
    if (actor_type === "anonymous") {
      const userAgent = request.headers.get("user-agent");

      if (isBotRequest(userAgent)) {
        incrementBotReject();
        // Silent — don't reveal the filter to bots.
        return new NextResponse(null, { status: 204 });
      }

      if (!related_provider_id || !event_type || !session_id) {
        return NextResponse.json(
          { error: "related_provider_id, event_type, and session_id are required for anonymous events" },
          { status: 400 }
        );
      }

      if (!(ANONYMOUS_EVENT_TYPES as readonly string[]).includes(event_type)) {
        return NextResponse.json(
          { error: `Invalid event_type for anonymous. Must be one of: ${ANONYMOUS_EVENT_TYPES.join(", ")}` },
          { status: 400 }
        );
      }

      const enrichedMetadata = {
        ...(metadata || {}),
        session_id,
        ua_class: classifyUserAgent(userAgent),
        referrer: sanitizeReferrer(metadata?.referrer),
      };

      const { error } = await db.from("provider_activity").insert({
        provider_id: related_provider_id,
        profile_id: null,
        event_type,
        metadata: enrichedMetadata,
      });

      if (error) {
        console.error("[activity/track] Anonymous insert failed:", error);
        return NextResponse.json(
          { error: "Failed to log activity" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // --- Family events → seeker_activity ---
    if (actor_type === "family") {
      if (!profile_id || !event_type) {
        return NextResponse.json(
          { error: "profile_id and event_type are required for family events" },
          { status: 400 }
        );
      }

      if (!(FAMILY_EVENT_TYPES as readonly string[]).includes(event_type)) {
        return NextResponse.json(
          { error: `Invalid event_type for family. Must be one of: ${FAMILY_EVENT_TYPES.join(", ")}` },
          { status: 400 }
        );
      }

      const { error } = await db.from("seeker_activity").insert({
        profile_id,
        event_type,
        email_log_id: email_log_id || null,
        email_type: email_type || null,
        related_provider_id: related_provider_id || null,
        metadata: metadata || {},
      });

      if (error) {
        console.error("[activity/track] Family insert failed:", error);
        return NextResponse.json(
          { error: "Failed to log activity" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // --- Provider events → provider_activity (existing behavior) ---
    if (!provider_id || !event_type) {
      return NextResponse.json(
        { error: "provider_id and event_type are required" },
        { status: 400 }
      );
    }

    if (!(PROVIDER_EVENT_TYPES as readonly string[]).includes(event_type)) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${PROVIDER_EVENT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const { error } = await db.from("provider_activity").insert({
      provider_id,
      profile_id: profile_id || null,
      event_type,
      email_log_id: email_log_id || null,
      email_type: email_type || null,
      metadata: metadata || {},
    });

    if (error) {
      console.error("[activity/track] Insert failed:", error);
      return NextResponse.json(
        { error: "Failed to log activity" },
        { status: 500 }
      );
    }

    // Send Slack alert for one-click token access (observability for PII exposure)
    if (event_type === "one_click_access") {
      try {
        const { sendSlackAlert, slackOneClickAccess } = await import("@/lib/slack");
        const meta = (metadata as Record<string, string>) || {};
        const trustLevel = ["high", "medium", "low"].includes(meta.trust_level)
          ? (meta.trust_level as "high" | "medium" | "low")
          : null;
        const alert = slackOneClickAccess({
          providerName: meta.provider_name || provider_id,
          providerEmail: meta.email || "unknown",
          providerSlug: provider_id,
          action: meta.action || "unknown",
          actionId: meta.action_id,
          trustLevel,
          trustReason: meta.trust_reason || null,
        });
        sendSlackAlert(alert.text, alert.blocks).catch(() => {});
      } catch {
        // Non-critical — activity already logged
      }
    }

    // Send Slack alert when a provider clicks the reviews CTA
    if (event_type === "reviews_cta_clicked") {
      try {
        const { sendSlackAlert, slackReviewsCtaClicked } = await import("@/lib/slack");
        const meta = metadata as Record<string, string> || {};
        const alert = slackReviewsCtaClicked({
          providerName: meta.provider_name || provider_id,
          providerSlug: provider_id,
          source: meta.source || "onboard",
        });
        sendSlackAlert(alert.text, alert.blocks).catch(() => {});
      } catch {
        // Non-critical — activity already logged
      }
    }

    // Send Slack alert when a provider clicks the analytics teaser CTA —
    // this is the Phase 2 conversion signal: provider saw the teaser on the
    // onboard page and chose to go to the dashboard. Impressions stay in DB
    // only (too noisy for Slack); clicks get the alert.
    if (event_type === "analytics_teaser_cta_clicked") {
      try {
        const { sendSlackAlert, slackAnalyticsTeaserCtaClicked } = await import("@/lib/slack");
        const meta = (metadata as Record<string, unknown>) || {};
        const alert = slackAnalyticsTeaserCtaClicked({
          providerName: (meta.provider_name as string) || provider_id,
          providerSlug: provider_id,
          teaserCase: (meta.case as string) || "unknown",
          viewsThisPeriod: typeof meta.views_this_period === "number" ? meta.views_this_period : 0,
          cohortSize: typeof meta.cohort_size === "number" ? meta.cohort_size : null,
          tier: (meta.tier as string) || "unknown",
        });
        sendSlackAlert(alert.text, alert.blocks).catch(() => {});
      } catch {
        // Non-critical — activity already logged
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[activity/track] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
