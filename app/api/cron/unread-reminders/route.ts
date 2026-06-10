import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { newMessageEmailForProvider, unreadReminderEmail, firstName } from "@/lib/email-templates";
import { withCronRun } from "@/lib/crons/run";
import { generateFamilyInboxUrl } from "@/lib/claim-tokens";

interface ThreadMessage {
  from_profile_id: string;
  text: string;
  created_at: string;
  is_auto_reply?: boolean;
}

interface UnreadConnection {
  connectionId: string;
  fromProfileId: string;
  toProfileId: string;
  metadata: Record<string, unknown>;
  lastMessage: ThreadMessage;
  lastMessageTime: number;
  senderProfileId: string;
}

/**
 * GET /api/cron/unread-reminders
 *
 * Runs every 6 hours. Finds connections with unread messages older than 24h
 * and sends a reminder email to the recipient.
 *
 * RECIPIENT-LEVEL INTELLIGENCE (as of 2025):
 * - Groups by recipient to prevent spam
 * - If recipient has multiple eligible unread messages, sends ONE consolidated reminder
 * - Mentions the most recent eligible unread message
 * - Only marks ELIGIBLE connections (those under the 2-reminder limit)
 * - Skips if ANY reminder was sent to this recipient in the last 6 hours
 *
 * CONNECTION-LEVEL LIMITS:
 * - Maximum 2 reminders per connection (Email #2 at Day 1, Email #3 at Day 3)
 * - 48-hour cooldown between reminders for the same connection
 * - This ensures families get gentle nudges at Day 1 and Day 3, then no more spam
 *
 * "Unread" heuristic: the last message in the thread was NOT sent by the
 * recipient, and no message from the recipient exists after it.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const dryRun = searchParams.get("dry_run") === "true"; // BUG FIX: Add dry_run support
  const isAuthed =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    querySecret === process.env.CRON_SECRET;

  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("unread-reminders", async () => {
  try {
    const db = getServiceClient();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const MAX_REMINDERS_PER_CONNECTION = 2; // Email #2 (Day 1) and Email #3 (Day 3)
    const REMINDER_COOLDOWN_HOURS = 48; // 48 hours between reminders

    // Get active connections with recent thread activity
    // We look at connections updated in the last 48h but with last message > 24h old
    const { data: connections, error } = await db
      .from("connections")
      .select("id, from_profile_id, to_profile_id, metadata, updated_at")
      .in("status", ["pending", "accepted"])
      .eq("type", "inquiry")
      .gte("updated_at", twoDaysAgo)
      .limit(100);

    if (error) {
      console.error("[cron/unread-reminders] query error:", error);
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }

    // First pass: identify unread connections and their recipients
    const unreadByRecipient = new Map<string, UnreadConnection[]>();

    for (const conn of connections || []) {
      const meta = (conn.metadata || {}) as Record<string, unknown>;
      const thread = (meta.thread as ThreadMessage[]) || [];
      if (thread.length === 0) continue;

      // Filter out auto-reply messages (seeded at connection creation)
      const humanMessages = thread.filter((msg) => !msg.is_auto_reply);
      if (humanMessages.length === 0) continue;

      const lastMsg = humanMessages[humanMessages.length - 1];
      const lastMsgTime = new Date(lastMsg.created_at).getTime();

      // Skip if last message is less than 24h old
      if (lastMsgTime > new Date(oneDayAgo).getTime()) continue;

      // Determine recipient (the person who did NOT send the last message)
      const recipientProfileId =
        lastMsg.from_profile_id === conn.from_profile_id
          ? conn.to_profile_id
          : conn.from_profile_id;

      // Add to recipient's unread list
      if (!unreadByRecipient.has(recipientProfileId)) {
        unreadByRecipient.set(recipientProfileId, []);
      }
      unreadByRecipient.get(recipientProfileId)!.push({
        connectionId: conn.id,
        fromProfileId: conn.from_profile_id,
        toProfileId: conn.to_profile_id,
        metadata: meta,
        lastMessage: lastMsg,
        lastMessageTime: lastMsgTime,
        senderProfileId: lastMsg.from_profile_id,
      });
    }

    let remindersSent = 0;

    // Second pass: process each RECIPIENT (not each connection)
    for (const [recipientProfileId, unreadConns] of unreadByRecipient) {
      // BUG FIX: Check if ANY connection for this recipient was reminded in last 6 hours
      // Must check ALL connections (not just currently unread) because if a previously
      // unread connection got a reply, it's no longer in unreadConns but still has
      // the reminder timestamp
      const { data: allRecipientConnections } = await db
        .from("connections")
        .select("metadata")
        .or(`from_profile_id.eq.${recipientProfileId},to_profile_id.eq.${recipientProfileId}`)
        .limit(50);

      let recentlyReminded = false;
      if (allRecipientConnections) {
        recentlyReminded = allRecipientConnections.some((conn) => {
          const meta = (conn.metadata || {}) as Record<string, unknown>;
          const lastRemindedAt = meta.last_reminder_sent_at as string | undefined;
          return lastRemindedAt && new Date(lastRemindedAt).getTime() > new Date(sixHoursAgo).getTime();
        });
      }

      if (recentlyReminded) continue; // Skip this recipient entirely

      // CONNECTION-LEVEL FILTERING: Only include connections eligible for reminders
      // A connection is eligible if:
      // 1. It hasn't hit the reminder limit (count < 2)
      // 2. It hasn't been reminded within the last 48 hours
      const now = Date.now();
      const eligibleConns = unreadConns.filter((uc) => {
        const reminderCount = (uc.metadata.unread_reminder_count as number) || 0;
        const lastReminderAt = uc.metadata.last_reminder_sent_at as string | undefined;

        // Check reminder count limit
        if (reminderCount >= MAX_REMINDERS_PER_CONNECTION) {
          return false;
        }

        // Check cooldown period (48 hours)
        if (lastReminderAt) {
          const hoursSinceLastReminder = (now - new Date(lastReminderAt).getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastReminder < REMINDER_COOLDOWN_HOURS) {
            return false;
          }
        }

        return true;
      });

      // Skip this recipient if no connections are eligible for reminders
      if (eligibleConns.length === 0) {
        continue;
      }

      // Sort eligible connections by most recent unread message first
      eligibleConns.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      const mostRecentUnread = eligibleConns[0];

      // Get recipient email + names + type for routing
      const [{ data: recipient }, { data: sender }] = await Promise.all([
        db
          .from("business_profiles")
          // slug / source_provider_id: stamp email_log.provider_id in the canonical slug space
          // (== provider_activity.provider_id) so the frequency gate counts this provider's nudges
          // alongside the digest's and lead-followup's — not under a disjoint profile-UUID key.
          .select("display_name, email, type, account_id, slug, source_provider_id")
          .eq("id", recipientProfileId)
          .single(),
        db
          .from("business_profiles")
          .select("display_name")
          .eq("id", mostRecentUnread.senderProfileId)
          .single(),
      ]);

      if (!recipient) continue;

      // Resolve recipient email: profile email for sending, auth email for magic links
      let recipientEmail = recipient.email;
      let authEmail = recipientEmail; // For magic link generation

      // Look up auth email if account exists (critical for magic link generation)
      if (recipient?.account_id) {
        const { data: acct } = await db
          .from("accounts")
          .select("user_id")
          .eq("id", recipient.account_id)
          .single();
        if (acct?.user_id) {
          const { data: { user: authUser } } = await db.auth.admin.getUserById(acct.user_id);
          if (authUser?.email) {
            authEmail = authUser.email; // Use auth email for magic links
            if (!recipientEmail) {
              recipientEmail = authEmail; // Fallback for sending if no profile email
            }
          }
        }
      }

      if (!recipientEmail) continue;

      const preview =
        mostRecentUnread.lastMessage.text.length > 200
          ? mostRecentUnread.lastMessage.text.slice(0, 200) + "..."
          : mostRecentUnread.lastMessage.text;

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
      const isFamily = recipient.type === "family";
      // Canonical provider key (slug space) for email_log.provider_id — mirrors lead-followup's
      // chain. All sampled provider profiles have a slug, so the fallbacks are belt-and-suspenders.
      const providerKey = isFamily
        ? undefined
        : recipient.slug || recipient.source_provider_id || recipientProfileId;

      // Different subject and template for families vs providers
      const senderFirstName = firstName(sender?.display_name || "", isFamily ? "A provider" : "Someone");
      const senderFullName = sender?.display_name || "A provider";

      // Count eligible connections (those we're actually reminding about)
      // This ensures the email accurately reflects what we're notifying them about
      const unreadCount = eligibleConns.length;
      const urSubject = isFamily
        ? unreadCount > 1
          ? `You have ${unreadCount} unread messages`
          : `You still have a message waiting from ${senderFullName}`
        : `${senderFirstName} sent you a message`;

      const urLogId = await reserveEmailLogId({
        to: recipientEmail,
        subject: urSubject,
        emailType: "unread_reminder",
        recipientType: isFamily ? "family" : "provider",
        providerId: providerKey,
        metadata: {
          connection_id: mostRecentUnread.connectionId,
          unread_count: unreadCount,
        },
      });

      // Build view URL with deep link to specific conversation
      let viewUrl: string;
      if (isFamily) {
        // Family: deep link to specific conversation
        // If multiple unread, link to inbox; if single, link to specific conversation
        const redirectPath = unreadCount > 1
          ? appendTrackingParams("/portal/inbox", urLogId)
          : appendTrackingParams(`/portal/inbox?id=${mostRecentUnread.connectionId}`, urLogId);

        // Generate HMAC token URL for one-click access (72-hour expiry, more reliable than Supabase magic links)
        viewUrl = generateFamilyInboxUrl(authEmail, redirectPath, siteUrl);
      } else {
        // Provider: link to provider connections page
        viewUrl = appendTrackingParams(`${siteUrl}/provider/connections`, urLogId);
      }

      // BUG FIX: Use different template for multiple unread vs single unread
      // When multiple unread, don't show specific sender/message (confusing UX)
      let emailHtml: string;
      if (isFamily && unreadCount > 1) {
        // Multiple unread: generic template without specific sender/message
        const recipientFirstName = firstName(recipient.display_name || "", "there");
        emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:480px;width:100%;">
        <tr><td style="padding:24px 32px 16px;">
          <span style="font-size:18px;font-weight:700;color:#198087;letter-spacing:-0.3px;">Olera</span>
        </td></tr>
        <tr><td style="padding:0 32px 32px;">
          <p style="font-size:15px;color:#374151;margin:0 0 20px;line-height:1.5;">
            Hi ${recipientFirstName},
          </p>
          <p style="font-size:15px;color:#374151;margin:0 0 20px;line-height:1.5;">
            You have <strong>${unreadCount} unread messages</strong> waiting in your inbox. The providers you reached out to are ready to help whenever you're ready to continue the conversation.
          </p>
          <div style="margin:0 0 24px;"><a href="${viewUrl}" style="display:inline-block;padding:12px 24px;background:#198087;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">View your messages</a></div>
          <div style="height:1px;background:#e5e7eb;margin:24px 0;"></div>
          <p style="font-size:15px;color:#374151;margin:0 0 16px;line-height:1.5;">
            There's no rush — reply whenever feels right. Each conversation stays private between you and the provider.
          </p>
          <p style="font-size:15px;color:#374151;margin:0 0 24px;line-height:1.5;">
            If you need help or have questions, a real person is here at <a href="mailto:support@olera.care" style="color:#198087;text-decoration:none;">support@olera.care</a>.
          </p>
          <p style="font-size:15px;color:#374151;margin:0 0 4px;line-height:1.5;">
            Warmly,
          </p>
          <p style="font-size:15px;color:#374151;margin:0;line-height:1.5;">
            The Olera team
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
          <p style="font-size:12px;color:#9ca3af;margin:0;">
            &copy; ${new Date().getFullYear()} Olera &middot;
            <a href="${siteUrl}" style="color:#9ca3af;">olera.care</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
      } else if (isFamily) {
        // Single unread: use existing template with sender/message
        emailHtml = unreadReminderEmail({
          recipientName: recipient.display_name || "",
          senderName: sender?.display_name || "",
          messagePreview: preview,
          viewUrl,
        });
      } else {
        // Provider: use provider-specific template
        emailHtml = newMessageEmailForProvider({
          providerName: recipient.display_name || "",
          familyName: sender?.display_name || "",
          messagePreview: preview,
          viewUrl,
        });
      }

      // BUG FIX: Check dry run BEFORE mutating database
      if (dryRun) {
        console.log(
          `[cron/unread-reminders] [DRY RUN] Would send to ${recipientEmail} (${unreadCount} unread)`
        );
        remindersSent++;
        continue;
      }

      const { skipped, skipReason } = await sendEmail({
        to: recipientEmail,
        subject: urSubject,
        html: emailHtml,
        emailType: "unread_reminder",
        recipientType: isFamily ? "family" : "provider",
        providerId: providerKey,
        emailLogId: urLogId ?? undefined,
      });

      // Frequency gate suppressed this nudge: do NOT advance reminder state — leave the connections
      // eligible so they retry once the provider's nudge budget frees up. Other skips (bounce
      // suppression, preference-disabled) fall through and mark reminded as before, so a dead address
      // isn't re-evaluated forever.
      if (skipped && skipReason === "nudge_cap") {
        continue;
      }

      // Mark ONLY ELIGIBLE connections as reminded (not those already at limit)
      // This prevents connections from getting count = 3, 4, 5... due to other unread connections
      const reminderTimestamp = new Date().toISOString();
      for (const uc of eligibleConns) {
        const currentCount = (uc.metadata.unread_reminder_count as number) || 0;
        await db
          .from("connections")
          .update({
            metadata: {
              ...uc.metadata,
              last_reminder_sent_at: reminderTimestamp,
              unread_reminder_count: currentCount + 1,
            },
          })
          .eq("id", uc.connectionId);
      }

      remindersSent++;
    }

    return NextResponse.json({ status: "ok", remindersSent, dry_run: dryRun });
  } catch (err) {
    console.error("[cron/unread-reminders] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  });
}
