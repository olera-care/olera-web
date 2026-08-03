import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  decodeClaimTokenAllowExpired,
  generateNotificationUrl,
  generateProviderPortalUrl,
} from "@/lib/claim-tokens";
import { sendEmail } from "@/lib/email";
import {
  assignQuestionVariant,
  questionReceivedEmail,
  questionReceivedInbox,
} from "@/lib/email-templates";
import { maskEmail } from "@/lib/one-click-telemetry";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

const RESEND_DAILY_LIMIT = 3;

/**
 * POST /api/claim/resend-link
 *
 * Recovery path for dead magic links. When a provider lands on the onboard
 * page with an expired/invalid otk, the link-expired card posts the failed
 * token here and we email a FRESH tokenized link — always to the provider's
 * on-file address, never to anything inside the untrusted token payload.
 *
 * Request body: { token: string, slug: string, action?: string, actionId?: string }
 * Returns: { sent: true, emailHint } or { sent: false, error }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, slug, action, actionId } = body as {
      token?: string;
      slug?: string;
      action?: string;
      actionId?: string;
    };

    // The token is proof the caller received one of our emails. Its signature
    // must verify (expiry is tolerated — that's the case we're recovering
    // from), otherwise anyone could spam arbitrary providers with refresh
    // emails. The payload email is still never used as a send target.
    if (!token || !slug) {
      return NextResponse.json(
        { sent: false, error: "Token and slug are required." },
        { status: 400 }
      );
    }

    const decoded = decodeClaimTokenAllowExpired(token);
    if (!decoded.ok) {
      return NextResponse.json(
        { sent: false, error: "This link can't be refreshed. Please sign in instead." },
        { status: 400 }
      );
    }

    const db = getAdminClient();
    if (!db) {
      return NextResponse.json(
        { sent: false, error: "Server configuration error." },
        { status: 500 }
      );
    }

    // Resolve the provider by page slug — same ladder as validate-token.
    let providerName: string | null = null;
    let providerSlug: string = slug;
    let onFileEmail: string | null = null;
    let oleraProviderId: string | null = null;

    const { data: opBySlug } = await db
      .from("olera-providers")
      .select("provider_id, slug, provider_name, email")
      .eq("slug", slug)
      .maybeSingle();

    if (opBySlug) {
      providerName = opBySlug.provider_name;
      providerSlug = opBySlug.slug || slug;
      onFileEmail = opBySlug.email;
      oleraProviderId = opBySlug.provider_id;
    } else {
      const { data: opById } = await db
        .from("olera-providers")
        .select("provider_id, slug, provider_name, email")
        .eq("provider_id", slug)
        .maybeSingle();
      if (opById) {
        providerName = opById.provider_name;
        providerSlug = opById.slug || slug;
        onFileEmail = opById.email;
        oleraProviderId = opById.provider_id;
      } else {
        const { data: bp } = await db
          .from("business_profiles")
          .select("id, slug, display_name, email")
          .eq("slug", slug)
          .in("type", ["organization", "caregiver"])
          .maybeSingle();
        if (bp) {
          providerName = bp.display_name;
          providerSlug = bp.slug || slug;
          onFileEmail = bp.email;
        }
      }
    }

    if (!providerName) {
      return NextResponse.json(
        { sent: false, error: "Provider not found." },
        { status: 404 }
      );
    }

    if (!onFileEmail) {
      return NextResponse.json(
        { sent: false, error: "No email on file for this provider. Please sign in instead." },
        { status: 404 }
      );
    }

    // The token must belong to THIS provider — stops replaying provider A's
    // valid token to trigger refresh emails for provider B.
    const identityKeys = [slug, providerSlug, oleraProviderId].filter(Boolean);
    if (!identityKeys.includes(decoded.providerId)) {
      return NextResponse.json(
        { sent: false, error: "This link can't be refreshed. Please sign in instead." },
        { status: 400 }
      );
    }

    // Rate limit: max RESEND_DAILY_LIMIT refresh emails per provider per 24h.
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const providerKeys = [providerSlug, oleraProviderId].filter(Boolean) as string[];
    const { count: recentResends } = await db
      .from("email_log")
      .select("id", { count: "exact", head: true })
      .eq("email_type", "link_refresh")
      .in("provider_id", providerKeys)
      .gte("created_at", oneDayAgo);

    if ((recentResends ?? 0) >= RESEND_DAILY_LIMIT) {
      return NextResponse.json(
        { sent: false, error: "A fresh link was already sent. Please check your inbox (and spam folder)." },
        { status: 429 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    const isNotificationAction =
      (action === "lead" || action === "question" || action === "review") && !!actionId;
    const freshUrl = isNotificationAction
      ? generateNotificationUrl(providerSlug, onFileEmail, action as "lead" | "question" | "review", actionId!, siteUrl)
      : generateProviderPortalUrl(providerSlug, onFileEmail, "manage", siteUrl);

    // For question links, resend the full question email (the surface the
    // provider already knows) with the fresh token baked into the CTA.
    let subject: string;
    let html: string;
    let question: { question: string; asker_name: string | null } | null = null;

    if (action === "question" && actionId) {
      const { data } = await db
        .from("provider_questions")
        .select("question, asker_name")
        .eq("id", actionId)
        .maybeSingle();
      question = data;
    }

    if (question) {
      const inbox = questionReceivedInbox({
        providerName,
        question: question.question,
        variant: assignQuestionVariant(),
      });
      subject = inbox.subject;
      html = questionReceivedEmail({
        providerName,
        askerName: question.asker_name || "A family",
        question: question.question,
        providerUrl: freshUrl,
        providerSlug,
        preheader: inbox.preheader,
      });
    } else {
      const safeName = providerName.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      subject = `Your secure link for ${providerName} on Olera`;
      html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
          <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 16px;">Here's a fresh link</h1>
          <p style="font-size:15px;color:#374151;margin:0 0 16px;line-height:1.5;">
            The link you clicked for ${safeName} had expired. This one is fresh and signs you straight in:
          </p>
          <p style="margin:0 0 24px;">
            <a href="${freshUrl}" style="display:inline-block;background:#111827;color:#ffffff;font-size:15px;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none;">Open your page</a>
          </p>
          <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.5;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${freshUrl}" style="color:#6b7280;word-break:break-all;">${freshUrl}</a>
          </p>
        </div>`;
    }

    const sendResult = await sendEmail({
      to: onFileEmail,
      subject,
      html,
      emailType: "link_refresh",
      recipientType: "provider",
      providerId: providerSlug,
      metadata: { action: action || null, action_id: actionId || null, trigger: "link_expired_card" },
    });

    // skipped = suppressed (prior bounce / do-not-contact) — the email did NOT
    // go out, so don't tell the provider it did.
    if (!sendResult.success || sendResult.skipped) {
      return NextResponse.json(
        { sent: false, error: "We couldn't send to the email on file. Please sign in instead." },
        { status: 502 }
      );
    }

    return NextResponse.json({ sent: true, emailHint: maskEmail(onFileEmail) });
  } catch (err) {
    console.error("[claim/resend-link] error:", err);
    return NextResponse.json(
      { sent: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
