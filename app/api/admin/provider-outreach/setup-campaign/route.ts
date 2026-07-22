import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  createCampaign,
  saveSequence,
  attachEmailAccounts,
  listEmailAccounts,
  setCampaignSchedule,
  setCampaignStatus,
  addLeads,
  createCampaignWebhook,
  isSmartleadConfigured,
  type SmartleadSequenceStep,
  type SmartleadLead,
} from "@/lib/smartlead";
import { generateClaimToken } from "@/lib/claim-tokens";

/**
 * POST /api/admin/provider-outreach/setup-campaign
 *
 * Creates a SmartLead campaign for provider outreach, saves the email
 * sequence, attaches warmed mailboxes, and enrolls eligible providers.
 *
 * Eligible = row in provider_outreach with status 'send_ready' and a
 * non-null email. Providers who have already claimed their page (status
 * 'claimed') or opted out are excluded.
 *
 * Body (optional):
 *   { dry_run?: boolean }  -- if true, returns what would happen without
 *                             actually creating the campaign
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
const BRAND_COLOR = "#198087";

// ── Email sequence templates ────────────────────────────────────────────────

function buildEmailHtml(body: string, opts: { claimUrl: string; pageUrl: string; photosUrl: string; reviewsUrl: string }): string {
  const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  // Convert plain text body to HTML with CTA buttons
  const bodyHtml = body
    .split("\n\n")
    .map((para) => {
      // CTA button lines: [Button text]
      if (para.match(/^\[.+\](\s+\[.+\])*$/)) {
        const buttons = para.match(/\[([^\]]+)\]/g)?.map((b) => b.slice(1, -1)) || [];
        return buttons
          .map((btn) => {
            const lower = btn.toLowerCase();
            const url = lower.includes("photo") || lower.includes("upload")
              ? opts.photosUrl
              : lower.includes("review") || lower.includes("reply")
                ? opts.reviewsUrl
                : lower.includes("claim") || lower.includes("secure")
                  ? opts.claimUrl
                  : opts.pageUrl;
            return `<p style="margin:0 0 8px;"><a href="${url}" style="display:inline-block;padding:12px 24px;background:${BRAND_COLOR};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">${btn} &rarr;</a></p>`;
          })
          .join("\n");
      }
      // Arrow list items
      if (para.includes("\u2192 ")) {
        const lines = para.split("\n");
        let html = "";
        for (const line of lines) {
          if (line.startsWith("\u2192 ")) {
            html += `<p style="margin:0 0 4px;font-size:14px;color:#374151;line-height:1.6;"><span style="color:${BRAND_COLOR};">&rarr;</span> ${line.slice(2)}</p>`;
          } else {
            html += `<p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 8px;">${line}</p>`;
          }
        }
        return html;
      }
      return `<p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px;">${para.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:${FONT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:480px;width:100%;">
        <tr><td style="padding:24px 32px 16px;">
          <span style="font-size:18px;font-weight:700;color:${BRAND_COLOR};letter-spacing:-0.3px;">Olera</span>
        </td></tr>
        <tr><td style="padding:0 32px 32px;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
          <p style="font-size:12px;color:#9ca3af;margin:0;">
            &copy; ${new Date().getFullYear()} Olera &middot;
            <a href="${BASE_URL}" style="color:#9ca3af;">olera.care</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * The 4-email sequence for provider outreach (email only, no call step).
 *
 * Sequence:
 *   Step 1: "What makes you special?" (day 0)
 *   Step 2: "Families want to see [Provider]" - photos (day 5)
 *   Step 3: "[X] people have reviewed [Provider]" - reviews (day 10)
 *   Step 4: "When a family calls, they call you" - no referral fees (day 15)
 *
 * SmartLead merge tags: {{first_name}}, {{company_name}}, {{city}},
 * {{state}}, {{category}}, {{page_url}}, {{claim_url}}
 */
const SEQUENCE_TEMPLATES: {
  step: number;
  delay_days: number;
  subject: string;
  body: string;
}[] = [
  {
    step: 1,
    delay_days: 0,
    subject: "What makes {{company_name}} special?",
    body: `Hi {{first_name}},

Your page has a featured section where you can add badges and highlight what makes your services and your facility unique.

[Show families what you're proud of]

It's the place for the programs you've built, the awards you've won, and the details families would only pick up on a tour.

Takes a few minutes, and it's the part families actually read.

Graize`,
  },
  {
    step: 2,
    delay_days: 5,
    subject: "Families want to see {{company_name}}",
    body: `Hi {{first_name}},

Right now your page has {{photo_count}} photos.

Families deciding where to move a parent want to see the place. The rooms, the dining, people doing something on a Tuesday afternoon. It's the closest thing to a visit before they visit.

You can upload straight from your phone, takes a minute.

[Add photos →]

Graize`,
  },
  {
    step: 3,
    delay_days: 5,
    subject: "{{review_count}} people have reviewed {{company_name}}",
    body: `Hi {{first_name}},

Your page shows {{review_count}} reviews. Families read them before they call anyone.

Right now you can't reply to a single one. Not the good ones, and not the one from three years ago you'd want to explain.

[Reply to your reviews →]

Claiming your page takes a few minutes and puts your voice next to theirs.

Graize`,
  },
  {
    step: 4,
    delay_days: 5,
    subject: "When a family calls, they call you",
    body: `Hi {{first_name}},

You know how the referral services work. A family fills out one form, their details get sold to three or four agencies, everyone calls the same afternoon, and the platform gets paid either way.

Olera doesn't do that. A family finds your page, they contact you.

No per-lead fee, no commission when someone moves in, nothing resold to the place down the road. What happens after they reach out is between you and them.

Which is why the page matters. Yours is built from public information right now, so it's a stranger's version of your business. Claim it and it's yours: your photos, your story, said your way.

[Set up your page →]

Free, and takes a few minutes.

Graize`,
  },
];

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const dryRun = body.dry_run === true;

  if (!isSmartleadConfigured()) {
    return NextResponse.json({ error: "SMARTLEAD_API_KEY not configured" }, { status: 503 });
  }

  const db = getServiceClient();

  // ── 1. Find eligible providers ──────────────────────────────────────────

  const { data: rawEligible, error: fetchErr } = await db
    .from("provider_outreach")
    .select("id, provider_id, provider_name, provider_category, city, state, email, slug, sequence_status")
    .in("status", ["send_ready", "in_sequence"])
    .eq("sequence_status", "pending")
    .not("email", "is", null);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const eligible = rawEligible as unknown as Array<{
    id: string; provider_id: string; provider_name: string;
    provider_category: string | null; city: string | null; state: string | null;
    email: string; slug: string | null; sequence_status: string;
  }> | null;

  if (!eligible || eligible.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "No eligible providers to enroll",
      enrolled: 0,
    });
  }

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      eligible_count: eligible.length,
      sample: eligible.slice(0, 5).map((p) => ({
        name: p.provider_name,
        email: p.email,
        city: p.city,
      })),
    });
  }

  // ── 2. Create SmartLead campaign ────────────────────────────────────────

  const campaignName = `Provider Outreach · ${new Date().toISOString().slice(0, 10)}`;
  const campaignResult = await createCampaign(campaignName);
  if (!campaignResult.ok || !campaignResult.data?.id) {
    return NextResponse.json(
      { error: `Failed to create campaign: ${campaignResult.error}` },
      { status: 500 },
    );
  }
  const campaignId = campaignResult.data.id;

  // ── 2b. Register webhook for engagement tracking ──────────────────────

  const webhookUrl = `${BASE_URL}/api/admin/provider-outreach/webhook`;
  await createCampaignWebhook(campaignId, {
    name: "Provider Outreach Webhook",
    webhookUrl,
    eventTypes: ["EMAIL_OPEN", "EMAIL_CLICK", "EMAIL_REPLY", "EMAIL_BOUNCE", "UNSUBSCRIBE"],
  });

  // ── 3. Save email sequence ────────────────────────────────────────────

  // Build placeholder HTML (SmartLead resolves merge tags at send time)
  const claimUrlTemplate = `${BASE_URL}/provider/{{slug}}/onboard?action=campaign`;
  const pageUrlTemplate = `${BASE_URL}/provider/{{slug}}`;

  const photosUrlTemplate = `${BASE_URL}/provider/{{slug}}/onboard?action=photos&otk={{otk}}`;
  const reviewsUrlTemplate = `${BASE_URL}/provider/{{slug}}/onboard?action=reviews&otk={{otk}}`;

  const steps: SmartleadSequenceStep[] = SEQUENCE_TEMPLATES.map((t, i) => ({
    seq_number: i + 1,
    seq_delay_details: { delay_in_days: t.delay_days },
    subject: t.subject,
    email_body: buildEmailHtml(t.body, {
      claimUrl: claimUrlTemplate,
      pageUrl: pageUrlTemplate,
      photosUrl: photosUrlTemplate,
      reviewsUrl: reviewsUrlTemplate,
    }),
  }));

  const seqResult = await saveSequence(campaignId, steps);
  if (!seqResult.ok) {
    return NextResponse.json(
      { error: `Failed to save sequence: ${seqResult.error}` },
      { status: 500 },
    );
  }

  // ── 4. Attach warmed mailboxes ────────────────────────────────────────

  const accountsResult = await listEmailAccounts();
  if (accountsResult.ok && accountsResult.data && accountsResult.data.length > 0) {
    const accountIds = accountsResult.data.map((a) => a.id);
    await attachEmailAccounts(campaignId, accountIds);
  }

  // ── 5. Set schedule (business hours ET, weekdays) ─────────────────────

  await setCampaignSchedule(campaignId, {
    timezone: "America/New_York",
    days_of_the_week: [1, 2, 3, 4, 5], // Mon-Fri
    start_hour: "09:00",
    end_hour: "17:00",
    min_time_btw_emails: 8, // minutes between sends
    max_new_leads_per_day: 50,
  });

  // ── 6. Enrich photo & review counts from olera-providers ──────────────

  const providerIds = eligible.map((p) => p.provider_id);
  const { data: enrichRows } = await db
    .from("olera-providers")
    .select("provider_id, provider_images, google_reviews_data")
    .in("provider_id", providerIds);

  const enrichMap = new Map<string, { photoCount: number; reviewCount: number }>();
  if (enrichRows) {
    for (const row of enrichRows as Array<{
      provider_id: string;
      provider_images: string | null;
      google_reviews_data: { review_count?: number } | null;
    }>) {
      const photoCount = row.provider_images
        ? row.provider_images.split(" | ").filter(Boolean).length
        : 0;
      const reviewCount =
        (row.google_reviews_data as { review_count?: number } | null)?.review_count || 0;
      enrichMap.set(row.provider_id, { photoCount, reviewCount });
    }
  }

  // ── 7. Push leads in batches of 100 ───────────────────────────────────

  let enrolled = 0;
  const errors: string[] = [];

  for (let i = 0; i < eligible.length; i += 100) {
    const batch = eligible.slice(i, i + 100);

    const leads: SmartleadLead[] = batch.map((p) => {
      const slug = p.slug || p.provider_id;
      const token = generateClaimToken(p.provider_id, p.email);
      const enrich = enrichMap.get(p.provider_id);
      return {
        email: p.email,
        first_name: p.provider_name.split(" ")[0], // Best guess for greeting
        company_name: p.provider_name,
        custom_fields: {
          provider_id: p.provider_id,
          city: p.city || "",
          state: p.state || "",
          category: p.provider_category || "",
          slug,
          page_url: `${BASE_URL}/provider/${slug}`,
          claim_url: `${BASE_URL}/provider/${slug}/onboard?action=campaign&otk=${token}`,
          photos_url: `${BASE_URL}/provider/${slug}/onboard?action=photos&otk=${token}`,
          reviews_url: `${BASE_URL}/provider/${slug}/onboard?action=reviews&otk=${token}`,
          photo_count: String(enrich?.photoCount || 0),
          review_count: String(enrich?.reviewCount || 0),
        },
      };
    });

    const pushResult = await addLeads(campaignId, leads);
    if (pushResult.ok) {
      enrolled += pushResult.data?.upload_count || batch.length;
    } else {
      errors.push(`Batch ${i}: ${pushResult.error}`);
    }

    // Update Supabase rows with campaign tracking
    const batchProviderIds = batch.map((p) => p.provider_id);
    await db
      .from("provider_outreach")
      .update({
        status: "in_sequence",
        sequence_status: "active",
        sequence_step: 1,
        smartlead_campaign_id: campaignId,
        first_email_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in("provider_id", batchProviderIds);
  }

  // ── 8. Start the campaign ─────────────────────────────────────────────

  const startResult = await setCampaignStatus(campaignId, "START");

  return NextResponse.json({
    ok: true,
    campaign_id: campaignId,
    campaign_name: campaignName,
    enrolled,
    total_eligible: eligible.length,
    started: startResult.ok,
    errors: errors.length > 0 ? errors : undefined,
  });
}
