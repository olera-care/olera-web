const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: { type: string; text: string }[];
  elements?: { type: string; text: string }[];
}

/**
 * Send an alert to Slack via incoming webhook.
 * Fire-and-forget safe — logs errors but never throws.
 */
export async function sendSlackAlert(
  text: string,
  blocks?: SlackBlock[]
): Promise<{ success: boolean; error?: string }> {
  if (!WEBHOOK_URL) {
    console.warn("[slack] SLACK_WEBHOOK_URL not configured, skipping alert");
    return { success: false, error: "Slack not configured" };
  }

  try {
    const body: Record<string, unknown> = { text };
    if (blocks) body.blocks = blocks;

    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const msg = await res.text();
      console.error("[slack] Webhook error:", res.status, msg);
      return { success: false, error: msg };
    }

    return { success: true };
  } catch (err) {
    console.error("[slack] Send failed:", err);
    return { success: false, error: String(err) };
  }
}

// ── Pre-built alert helpers ─────────────────────────────────────

export function slackNewLead(opts: {
  familyName: string;
  providerName: string;
  careType: string | null;
}): { text: string; blocks: SlackBlock[] } {
  return {
    text: `New lead: ${opts.familyName} → ${opts.providerName}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🔔 New Care Inquiry", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Family:*\n${opts.familyName}` },
          { type: "mrkdwn", text: `*Provider:*\n${opts.providerName}` },
          ...(opts.careType
            ? [{ type: "mrkdwn", text: `*Care Type:*\n${opts.careType}` }]
            : []),
        ],
      },
    ],
  };
}

export function slackProviderClaimed(opts: {
  providerName: string;
  claimedByEmail: string;
  providerSlug: string;
}): { text: string; blocks: SlackBlock[] } {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
  return {
    text: `Provider claimed: ${opts.providerName} by ${opts.claimedByEmail}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "✅ Provider Claimed", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Provider:*\n${opts.providerName}` },
          { type: "mrkdwn", text: `*Claimed by:*\n${opts.claimedByEmail}` },
        ],
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `<${siteUrl}/provider/${opts.providerSlug}|View listing>` },
        ],
      },
    ],
  };
}

export function slackDispute(opts: {
  providerName: string;
  reportedBy: string;
  reason: string;
}): { text: string; blocks: SlackBlock[] } {
  return {
    text: `Dispute reported: ${opts.providerName}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "⚠️ Content Dispute", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Provider:*\n${opts.providerName}` },
          { type: "mrkdwn", text: `*Reported by:*\n${opts.reportedBy}` },
          { type: "mrkdwn", text: `*Reason:*\n${opts.reason}` },
        ],
      },
    ],
  };
}

export function slackRemovalRequest(opts: {
  providerName: string;
  providerSlug: string;
  fullName: string;
  email: string;
  phone: string;
  action: string;
  reason: string;
  details?: string;
}): { text: string; blocks: SlackBlock[] } {
  const detailLine = opts.details ? `\n*Details:*\n${opts.details}` : "";
  return {
    text: `🚨 Page removal request: ${opts.providerName}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🚨 Page Removal Request", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Provider:*\n${opts.providerName}` },
          { type: "mrkdwn", text: `*Action:*\n${opts.action}` },
          { type: "mrkdwn", text: `*Reason:*\n${opts.reason}` },
          { type: "mrkdwn", text: `*Submitted by:*\n${opts.fullName}` },
          { type: "mrkdwn", text: `*Email:*\n${opts.email}` },
          { type: "mrkdwn", text: `*Phone:*\n${opts.phone}` },
        ],
      },
      ...(detailLine
        ? [
            {
              type: "section" as const,
              text: { type: "mrkdwn" as const, text: detailLine },
            },
          ]
        : []),
    ],
  };
}

export function slackMissingEmail(opts: {
  familyName: string;
  providerName: string;
  providerId: string;
  careType: string | null;
}): { text: string; blocks: SlackBlock[] } {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
  return {
    text: `Missing email: ${opts.providerName} — new lead from ${opts.familyName}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "📧 Missing Provider Email", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Provider:*\n${opts.providerName}` },
          { type: "mrkdwn", text: `*Family:*\n${opts.familyName}` },
          ...(opts.careType
            ? [{ type: "mrkdwn", text: `*Care Type:*\n${opts.careType}` }]
            : []),
          { type: "mrkdwn", text: `*Action:*\nAdd email to send lead notification` },
        ],
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `<${siteUrl}/admin/directory/${opts.providerId}|Add email in admin>` },
        ],
      },
    ],
  };
}

export function slackQuestionAsked(opts: {
  askerName: string;
  providerName: string;
  question: string;
  providerSlug: string;
}): { text: string; blocks: SlackBlock[] } {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
  const truncated = opts.question.length > 150 ? opts.question.slice(0, 147) + "..." : opts.question;
  return {
    text: `New question on ${opts.providerName} from ${opts.askerName}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "❓ New Question Asked", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Provider:*\n${opts.providerName}` },
          { type: "mrkdwn", text: `*Asked by:*\n${opts.askerName}` },
        ],
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Question:*\n${truncated}` },
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `<${siteUrl}/provider/${opts.providerSlug}|View provider page>` },
        ],
      },
    ],
  };
}

export function slackQuestionMissingEmail(opts: {
  askerName: string;
  providerName: string;
  providerId: string;
  question: string;
}): { text: string; blocks: SlackBlock[] } {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
  const truncated = opts.question.length > 150 ? opts.question.slice(0, 147) + "..." : opts.question;
  return {
    text: `Question asked on ${opts.providerName} but provider has no email`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "📧 Question Asked — No Provider Email", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Provider:*\n${opts.providerName}` },
          { type: "mrkdwn", text: `*Asked by:*\n${opts.askerName}` },
        ],
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Question:*\n${truncated}` },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Action:*\nAdd email so provider can be notified` },
        ],
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `<${siteUrl}/admin/directory/${opts.providerId}|Add email in admin>` },
        ],
      },
    ],
  };
}

export function slackQuestionAnswered(opts: {
  providerName: string;
  providerSlug: string;
  askerName: string;
  question: string;
  answer: string;
}): { text: string; blocks: SlackBlock[] } {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
  const truncQ = opts.question.length > 100 ? opts.question.slice(0, 97) + "..." : opts.question;
  const truncA = opts.answer.length > 150 ? opts.answer.slice(0, 147) + "..." : opts.answer;
  return {
    text: `${opts.providerName} answered a question from ${opts.askerName}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "💬 Provider Answered a Question", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Provider:*\n${opts.providerName}` },
          { type: "mrkdwn", text: `*Asked by:*\n${opts.askerName}` },
        ],
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Q:* ${truncQ}\n*A:* ${truncA}` },
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `<${siteUrl}/provider/${opts.providerSlug}|View provider page>` },
        ],
      },
    ],
  };
}

// ── One-click access alerts ───────────────────────────────────

export function slackOneClickAccess(opts: {
  providerName: string;
  providerEmail: string;
  providerSlug: string;
  action: string;
  actionId?: string;
}): { text: string; blocks: SlackBlock[] } {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
  const actionLabels: Record<string, string> = {
    lead: "Viewed lead",
    question: "Viewed question",
    review: "Viewed review",
    campaign: "Campaign click",
  };
  return {
    text: `One-click access: ${opts.providerName} (${opts.action})`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🔓 One-Click Provider Access", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Provider:*\n${opts.providerName}` },
          { type: "mrkdwn", text: `*Email:*\n${opts.providerEmail}` },
          { type: "mrkdwn", text: `*Action:*\n${actionLabels[opts.action] || opts.action}` },
          { type: "mrkdwn", text: `*Listing:*\n<${siteUrl}/provider/${opts.providerSlug}|View>` },
        ],
      },
    ],
  };
}

// ── MedJobs alerts ────────────────────────────────────────────

export function slackMedJobsNewStudent(opts: {
  studentName: string;
  university: string;
  programTrack: string;
  location: string;
}): { text: string; blocks: SlackBlock[] } {
  return {
    text: `MedJobs: New student ${opts.studentName} (${opts.university})`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🎓 New MedJobs Student", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Student:*\n${opts.studentName}` },
          { type: "mrkdwn", text: `*University:*\n${opts.university}` },
          { type: "mrkdwn", text: `*Track:*\n${opts.programTrack}` },
          { type: "mrkdwn", text: `*Location:*\n${opts.location}` },
        ],
      },
    ],
  };
}

export function slackMedJobsApplication(opts: {
  studentName: string;
  providerName: string;
  university: string;
}): { text: string; blocks: SlackBlock[] } {
  return {
    text: `MedJobs Application: ${opts.studentName} → ${opts.providerName}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "📋 MedJobs Application", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Student:*\n${opts.studentName}` },
          { type: "mrkdwn", text: `*Provider:*\n${opts.providerName}` },
          { type: "mrkdwn", text: `*University:*\n${opts.university}` },
        ],
      },
    ],
  };
}

export function slackProviderAction(opts: {
  providerName: string;
  action: "approved" | "rejected";
  adminEmail: string;
}): { text: string; blocks: SlackBlock[] } {
  const emoji = opts.action === "approved" ? "👍" : "👎";
  return {
    text: `Provider ${opts.action}: ${opts.providerName}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} Provider ${opts.action.charAt(0).toUpperCase() + opts.action.slice(1)}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Provider:*\n${opts.providerName}` },
          { type: "mrkdwn", text: `*By:*\n${opts.adminEmail}` },
        ],
      },
    ],
  };
}
