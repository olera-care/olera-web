import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { sendSlackAlert } from "@/lib/slack";

/**
 * GET /api/cron/daily-digest
 *
 * Runs daily at 13:00 UTC (8 AM CT). Sends a leadership-first 24h
 * snapshot to Slack (#notifications) and email (ADMIN_NOTIFICATION_EMAIL),
 * grouped by audience (Care seekers / Providers) with a "Needs attention"
 * block flagging anomalies that warrant team follow-up.
 *
 * Metric semantics intentionally mirror /api/admin/analytics/summary so the
 * digest never disagrees with what /admin/analytics shows.
 */

const PROVIDER_RAW_EVENT_TYPES = [
  "page_view",
  "search_click",
  "benefits_started",
  "lead_received",
  "review_received",
  "question_received",
] as const;

const PROVIDER_DISTINCT_EVENT_TYPES = [
  "one_click_access",
  "claim_completed",
  "question_responded",
  "analytics_teaser_cta_clicked",
  "dashboard_arrival",
  "provider_picker_clicked",
  "provider_profile_edited",
] as const;

const SEEKER_RAW_EVENT_TYPES = ["benefits_completed", "matches_activated"] as const;

const SAVE_FUNNEL_EVENT_TYPES = [
  "save_nudge_shown",
  "save_nudge_signup_clicked",
  "save_nudge_converted",
] as const;

type ProviderRawCounts = Record<(typeof PROVIDER_RAW_EVENT_TYPES)[number], number>;
type SeekerRawCounts = Record<(typeof SEEKER_RAW_EVENT_TYPES)[number], number>;
type ProviderDistinctCounts = {
  qa_signins: number;
  page_claims: number;
  question_answerers: number;
  lead_engagers: number;
  teaser_clickers: number;
  /** Distinct providers redirected to /provider after answering a question (?from=qa-success). */
  qa_success_arrivals: number;
  /** Distinct providers who clicked a completion-tier CTA on the dashboard hero. */
  hero_clickers: number;
  /** Distinct providers who saved an edit to any profile section. Conversion outcome. */
  profile_editors: number;
};

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getServiceClient();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

    const [
      providerActivityRes,
      providerDistinctRes,
      seekerActivityRes,
      qaEmailOpenersRes,
      disputesRes,
      needsEmailRes,
      justStaleRes,
      staleBacklogRes,
      saveFunnelRes,
      providerSavesRes,
    ] = await Promise.all([
      db
        .from("provider_activity")
        .select("event_type, metadata")
        .in("event_type", [...PROVIDER_RAW_EVENT_TYPES])
        .gte("created_at", oneDayAgo)
        .limit(50000),
      db
        .from("provider_activity")
        .select("event_type, provider_id, metadata")
        .in("event_type", [...PROVIDER_DISTINCT_EVENT_TYPES])
        .gte("created_at", oneDayAgo)
        .limit(50000),
      db
        .from("seeker_activity")
        .select("event_type")
        .in("event_type", [...SEEKER_RAW_EVENT_TYPES])
        .gte("created_at", oneDayAgo)
        .limit(50000),
      // Distinct providers whose Q&A notification was first opened in 24h.
      db
        .from("email_log")
        .select("provider_id")
        .eq("email_type", "question_received")
        .eq("recipient_type", "provider")
        .not("first_opened_at", "is", null)
        .gte("first_opened_at", oneDayAgo)
        .limit(50000),
      // New disputes in 24h (with detail for inline listing in the email body).
      db
        .from("disputes")
        .select("id, provider_name, reason, created_at", { count: "exact" })
        .gte("created_at", oneDayAgo)
        .order("created_at", { ascending: false })
        .limit(10),
      // Outstanding questions waiting on a provider email — current backlog,
      // not 24h-bounded.
      db
        .from("provider_questions")
        .select("id", { count: "exact", head: true })
        .contains("metadata", { needs_provider_email: true })
        .neq("status", "archived")
        .neq("status", "rejected"),
      // Questions that JUST hit the 48h-unanswered mark (created 24-48h
      // ago, still unanswered). Daily-actionable nudge candidates — nudge
      // these today before they age further.
      db
        .from("provider_questions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", fortyEightHoursAgo)
        .lt("created_at", oneDayAgo)
        .is("answered_at", null)
        .neq("status", "archived")
        .neq("status", "rejected"),
      // Total unanswered-48h+ backlog. Context number, not an immediate
      // action — shown alongside the daily "just hit 48h" count.
      db
        .from("provider_questions")
        .select("id", { count: "exact", head: true })
        .lt("created_at", fortyEightHoursAgo)
        .is("answered_at", null)
        .neq("status", "archived")
        .neq("status", "rejected"),
      // Save funnel metrics from seeker_activity
      db
        .from("seeker_activity")
        .select("event_type")
        .in("event_type", [...SAVE_FUNNEL_EVENT_TYPES])
        .gte("created_at", oneDayAgo)
        .limit(50000),
      // Provider saves count (from provider_activity)
      db
        .from("provider_activity")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "provider_saved")
        .gte("created_at", oneDayAgo),
    ]);

    const providerRaw: ProviderRawCounts = {
      page_view: 0,
      search_click: 0,
      benefits_started: 0,
      lead_received: 0,
      review_received: 0,
      question_received: 0,
    };
    const uniqueSessions = new Set<string>();
    for (const r of (providerActivityRes.data ?? []) as Array<{
      event_type: string;
      metadata: Record<string, unknown> | null;
    }>) {
      if ((PROVIDER_RAW_EVENT_TYPES as readonly string[]).includes(r.event_type)) {
        providerRaw[r.event_type as keyof ProviderRawCounts] += 1;
      }
      if (r.event_type === "page_view") {
        const sid = r.metadata?.session_id;
        if (typeof sid === "string" && sid.length > 0) uniqueSessions.add(sid);
      }
    }

    const seekerRaw: SeekerRawCounts = {
      benefits_completed: 0,
      matches_activated: 0,
    };
    for (const r of (seekerActivityRes.data ?? []) as Array<{ event_type: string }>) {
      if ((SEEKER_RAW_EVENT_TYPES as readonly string[]).includes(r.event_type)) {
        seekerRaw[r.event_type as keyof SeekerRawCounts] += 1;
      }
    }

    const distinctSets = {
      qa_signins: new Set<string>(),
      page_claims: new Set<string>(),
      question_answerers: new Set<string>(),
      lead_engagers: new Set<string>(),
      teaser_clickers: new Set<string>(),
      qa_success_arrivals: new Set<string>(),
      hero_clickers: new Set<string>(),
      profile_editors: new Set<string>(),
    };
    for (const r of (providerDistinctRes.data ?? []) as Array<{
      event_type: string;
      provider_id: string | null;
      metadata: Record<string, unknown> | null;
    }>) {
      const pid = r.provider_id;
      if (!pid) continue;
      if (r.event_type === "one_click_access") {
        const action = r.metadata?.action;
        if (action === "question") distinctSets.qa_signins.add(pid);
        else if (action === "lead") distinctSets.lead_engagers.add(pid);
      } else if (r.event_type === "claim_completed") {
        if (r.metadata?.source === "page") distinctSets.page_claims.add(pid);
      } else if (r.event_type === "question_responded") {
        distinctSets.question_answerers.add(pid);
      } else if (r.event_type === "analytics_teaser_cta_clicked") {
        distinctSets.teaser_clickers.add(pid);
      } else if (r.event_type === "dashboard_arrival") {
        if (r.metadata?.source === "qa-success") distinctSets.qa_success_arrivals.add(pid);
      } else if (r.event_type === "provider_picker_clicked") {
        if (r.metadata?.source === "hero") distinctSets.hero_clickers.add(pid);
      } else if (r.event_type === "provider_profile_edited") {
        distinctSets.profile_editors.add(pid);
      }
    }
    const providerDistinct: ProviderDistinctCounts = {
      qa_signins: distinctSets.qa_signins.size,
      page_claims: distinctSets.page_claims.size,
      question_answerers: distinctSets.question_answerers.size,
      lead_engagers: distinctSets.lead_engagers.size,
      teaser_clickers: distinctSets.teaser_clickers.size,
      qa_success_arrivals: distinctSets.qa_success_arrivals.size,
      hero_clickers: distinctSets.hero_clickers.size,
      profile_editors: distinctSets.profile_editors.size,
    };

    const qaEmailOpeners = new Set<string>();
    for (const r of (qaEmailOpenersRes.data ?? []) as Array<{ provider_id: string | null }>) {
      if (r.provider_id) qaEmailOpeners.add(r.provider_id);
    }
    const qaEmailOpenersCount = qaEmailOpeners.size;

    const newDisputes = disputesRes.count ?? 0;
    const disputeRows = (disputesRes.data ?? []) as Array<{
      provider_name: string | null;
      reason: string | null;
    }>;
    const needsEmailBacklog = needsEmailRes.count ?? 0;
    const justHit48hCount = justStaleRes.count ?? 0;
    const staleBacklogTotal = staleBacklogRes.count ?? 0;

    // Save funnel metrics
    const saveFunnel = {
      providers_saved: providerSavesRes.count ?? 0,
      nudges_shown: 0,
      signup_clicked: 0,
      conversions: 0,
    };
    for (const r of (saveFunnelRes.data ?? []) as Array<{ event_type: string }>) {
      if (r.event_type === "save_nudge_shown") saveFunnel.nudges_shown++;
      else if (r.event_type === "save_nudge_signup_clicked") saveFunnel.signup_clicked++;
      else if (r.event_type === "save_nudge_converted") saveFunnel.conversions++;
    }
    const saveConversionRate =
      saveFunnel.nudges_shown > 0
        ? ((saveFunnel.conversions / saveFunnel.nudges_shown) * 100).toFixed(1)
        : "0.0";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
    const adminAnalyticsUrl = `${siteUrl}/admin/analytics`;
    const adminQuestionsUrl = `${siteUrl}/admin/questions`;
    const dateLabel = formatDateLabel(now);

    const slackText = buildSlackMessage({
      providerRaw,
      uniqueSessionsCount: uniqueSessions.size,
      seekerRaw,
      providerDistinct,
      qaEmailOpenersCount,
      newDisputes,
      disputeRows,
      needsEmailBacklog,
      justHit48hCount,
      staleBacklogTotal,
      saveFunnel,
      saveConversionRate,
      adminAnalyticsUrl,
      adminQuestionsUrl,
    });

    const emailHtml = buildEmailHtml({
      dateLabel,
      providerRaw,
      uniqueSessionsCount: uniqueSessions.size,
      seekerRaw,
      providerDistinct,
      qaEmailOpenersCount,
      newDisputes,
      disputeRows,
      needsEmailBacklog,
      justHit48hCount,
      staleBacklogTotal,
      saveFunnel,
      saveConversionRate,
      adminAnalyticsUrl,
      adminQuestionsUrl,
    });

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `Olera Daily Digest — ${dateLabel}`,
        html: emailHtml,
        emailType: "daily_digest",
        recipientType: "admin",
      });
    }

    try {
      await sendSlackAlert(slackText);
    } catch {
      // Non-blocking — Slack failures shouldn't fail the cron.
    }

    return NextResponse.json({
      status: "sent",
      careSeekers: { ...providerRaw, unique_sessions: uniqueSessions.size },
      seekers: seekerRaw,
      providers: { ...providerDistinct, qa_email_openers: qaEmailOpenersCount },
      actions: {
        new_disputes: newDisputes,
        needs_email_backlog: needsEmailBacklog,
        just_hit_48h_unanswered: justHit48hCount,
        total_unanswered_backlog: staleBacklogTotal,
      },
    });
  } catch (err) {
    console.error("[cron/daily-digest] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type SaveFunnel = {
  providers_saved: number;
  nudges_shown: number;
  signup_clicked: number;
  conversions: number;
};

type DigestPayload = {
  providerRaw: ProviderRawCounts;
  uniqueSessionsCount: number;
  seekerRaw: SeekerRawCounts;
  providerDistinct: ProviderDistinctCounts;
  qaEmailOpenersCount: number;
  newDisputes: number;
  disputeRows: Array<{ provider_name: string | null; reason: string | null }>;
  needsEmailBacklog: number;
  justHit48hCount: number;
  staleBacklogTotal: number;
  saveFunnel: SaveFunnel;
  saveConversionRate: string;
  adminAnalyticsUrl: string;
  adminQuestionsUrl: string;
};

function buildSlackMessage(p: DigestPayload): string {
  const {
    providerRaw,
    uniqueSessionsCount,
    seekerRaw,
    providerDistinct,
    qaEmailOpenersCount,
    newDisputes,
    disputeRows,
    needsEmailBacklog,
    justHit48hCount,
    staleBacklogTotal,
    saveFunnel,
    saveConversionRate,
    adminAnalyticsUrl,
    adminQuestionsUrl,
  } = p;

  const lines: string[] = [];
  lines.push("📊 *Daily Digest* — last 24h");
  lines.push("");
  lines.push("*Care seekers*");
  lines.push(
    `• ${providerRaw.page_view} page views · ${uniqueSessionsCount} unique sessions · ${providerRaw.search_click} card clicks`,
  );
  lines.push(
    `• ${providerRaw.question_received} questions · ${providerRaw.review_received} reviews · ${providerRaw.lead_received} leads`,
  );
  lines.push(
    `• ${providerRaw.benefits_started} benefits started · ${seekerRaw.benefits_completed} finished · ${seekerRaw.matches_activated} profiles published`,
  );
  lines.push("");
  lines.push("*Providers*");
  lines.push(
    `• ${qaEmailOpenersCount} opened Q&A emails · ${providerDistinct.qa_signins} signed in from Q&A · ${providerDistinct.question_answerers} answered`,
  );
  lines.push(
    `• ${providerDistinct.page_claims} page-flow claims · ${providerDistinct.lead_engagers} engaged with leads · ${providerDistinct.teaser_clickers} clicked dashboard CTA`,
  );
  // Post-answer engagement chain (PR #679 + PR #685): redirect → hero → action.
  // Diagnostic for whether the new banner work is converting providers into
  // real activation (profile edits = revenue path).
  lines.push(
    `• ${providerDistinct.qa_success_arrivals} arrived from Q&A redirect · ${providerDistinct.hero_clickers} clicked hero CTA · ${providerDistinct.profile_editors} saved profile edits`,
  );

  // Save Funnel section (only show if there's any activity)
  if (saveFunnel.providers_saved > 0 || saveFunnel.nudges_shown > 0) {
    lines.push("");
    lines.push("*Save Funnel*");
    lines.push(`• ${saveFunnel.providers_saved} providers saved`);
    lines.push(
      `• ${saveFunnel.nudges_shown} nudges shown → ${saveFunnel.signup_clicked} clicked "Sign up" → ${saveFunnel.conversions} converted (${saveConversionRate}%)`,
    );
  }

  const actionLines: string[] = [];
  if (newDisputes > 0) {
    const names = disputeRows
      .map((d) => d.provider_name)
      .filter((n): n is string => Boolean(n))
      .slice(0, 3)
      .join(", ");
    const trail = names ? ` (${names}${newDisputes > 3 ? ", …" : ""})` : "";
    actionLines.push(`🚨 ${newDisputes} new dispute${newDisputes === 1 ? "" : "s"}${trail}`);
  }
  if (needsEmailBacklog > 0) {
    actionLines.push(
      `📧 ${needsEmailBacklog} question${needsEmailBacklog === 1 ? "" : "s"} need provider email · <${adminQuestionsUrl}|review>`,
    );
  }
  if (justHit48hCount > 0 || staleBacklogTotal > 0) {
    const backlogContext =
      staleBacklogTotal > 0 ? ` (${staleBacklogTotal.toLocaleString()} in backlog)` : "";
    actionLines.push(
      `⏰ ${justHit48hCount} question${justHit48hCount === 1 ? "" : "s"} just hit 48h unanswered${backlogContext} · <${adminQuestionsUrl}|review>`,
    );
  }
  if (actionLines.length > 0) {
    lines.push("");
    lines.push("*Needs attention*");
    lines.push(...actionLines);
  }

  lines.push("");
  lines.push(`<${adminAnalyticsUrl}|Open admin analytics>`);

  return lines.join("\n");
}

function buildEmailHtml(p: DigestPayload & { dateLabel: string }): string {
  const {
    dateLabel,
    providerRaw,
    uniqueSessionsCount,
    seekerRaw,
    providerDistinct,
    qaEmailOpenersCount,
    newDisputes,
    disputeRows,
    needsEmailBacklog,
    justHit48hCount,
    staleBacklogTotal,
    saveFunnel,
    saveConversionRate,
    adminAnalyticsUrl,
    adminQuestionsUrl,
  } = p;

  const careSeekerRows = [
    `${providerRaw.page_view} page views · ${uniqueSessionsCount} unique sessions · ${providerRaw.search_click} card clicks`,
    `${providerRaw.question_received} questions · ${providerRaw.review_received} reviews · ${providerRaw.lead_received} leads`,
    `${providerRaw.benefits_started} benefits started · ${seekerRaw.benefits_completed} finished · ${seekerRaw.matches_activated} profiles published`,
  ];
  const providerRows = [
    `${qaEmailOpenersCount} opened Q&A emails · ${providerDistinct.qa_signins} signed in from Q&A · ${providerDistinct.question_answerers} answered`,
    `${providerDistinct.page_claims} page-flow claims · ${providerDistinct.lead_engagers} engaged with leads · ${providerDistinct.teaser_clickers} clicked dashboard CTA`,
    // Post-answer engagement chain — see Slack message comment for context.
    `${providerDistinct.qa_success_arrivals} arrived from Q&A redirect · ${providerDistinct.hero_clickers} clicked hero CTA · ${providerDistinct.profile_editors} saved profile edits`,
  ];

  const sectionStyle = "margin:24px 0 6px;font-size:14px;color:#666;text-transform:uppercase;letter-spacing:0.04em;font-weight:600;";
  const liStyle = "margin:0 0 4px;font-size:15px;color:#222;line-height:1.5;";

  const renderRows = (rows: string[]) =>
    rows.map((r) => `<li style="${liStyle}">${escapeHtml(r)}</li>`).join("\n");

  const html: string[] = [];
  html.push(`<h2 style="margin:0 0 4px;font-size:22px;color:#111;">Daily Digest</h2>`);
  html.push(`<p style="margin:0;color:#888;font-size:14px;">${escapeHtml(dateLabel)} · last 24 hours</p>`);

  html.push(`<p style="${sectionStyle}">Care seekers</p>`);
  html.push(`<ul style="margin:0;padding-left:20px;">${renderRows(careSeekerRows)}</ul>`);

  html.push(`<p style="${sectionStyle}">Providers</p>`);
  html.push(`<ul style="margin:0;padding-left:20px;">${renderRows(providerRows)}</ul>`);

  // Save Funnel section (only show if there's any activity)
  if (saveFunnel.providers_saved > 0 || saveFunnel.nudges_shown > 0) {
    const saveFunnelRows = [
      `${saveFunnel.providers_saved} providers saved`,
      `${saveFunnel.nudges_shown} nudges → ${saveFunnel.signup_clicked} clicked → ${saveFunnel.conversions} converted (${saveConversionRate}%)`,
    ];
    html.push(`<p style="${sectionStyle}">Save Funnel</p>`);
    html.push(`<ul style="margin:0;padding-left:20px;">${renderRows(saveFunnelRows)}</ul>`);
  }

  const hasActions =
    newDisputes > 0 ||
    needsEmailBacklog > 0 ||
    justHit48hCount > 0 ||
    staleBacklogTotal > 0;
  if (hasActions) {
    html.push(`<p style="${sectionStyle}">Needs attention</p>`);
    html.push(`<ul style="margin:0;padding-left:20px;">`);
    if (newDisputes > 0) {
      html.push(
        `<li style="${liStyle}">🚨 <strong>${newDisputes} new dispute${newDisputes === 1 ? "" : "s"}</strong></li>`,
      );
      for (const d of disputeRows) {
        const name = escapeHtml(d.provider_name ?? "—");
        const reason = escapeHtml((d.reason ?? "").slice(0, 120));
        html.push(
          `<li style="${liStyle}list-style:none;padding-left:18px;color:#555;font-size:14px;">• ${name}${reason ? `: ${reason}` : ""}</li>`,
        );
      }
    }
    if (needsEmailBacklog > 0) {
      html.push(
        `<li style="${liStyle}">📧 ${needsEmailBacklog} question${needsEmailBacklog === 1 ? "" : "s"} need provider email — <a href="${adminQuestionsUrl}" style="color:#198087;">review</a></li>`,
      );
    }
    if (justHit48hCount > 0 || staleBacklogTotal > 0) {
      const backlogContext =
        staleBacklogTotal > 0
          ? ` <span style="color:#888;">(${staleBacklogTotal.toLocaleString()} in backlog)</span>`
          : "";
      html.push(
        `<li style="${liStyle}">⏰ ${justHit48hCount} question${justHit48hCount === 1 ? "" : "s"} just hit 48h unanswered${backlogContext} — <a href="${adminQuestionsUrl}" style="color:#198087;">review</a></li>`,
      );
    }
    html.push(`</ul>`);
  }

  html.push(
    `<p style="margin:32px 0 0;"><a href="${adminAnalyticsUrl}" style="color:#198087;font-size:14px;">Open admin analytics →</a></p>`,
  );

  return html.join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
