import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { newMessageEmail } from "@/lib/email-templates";

interface ThreadMessage {
  from_profile_id: string;
  text: string;
  created_at: string;
  is_auto_reply?: boolean;
}

/**
 * GET /api/cron/matches-unread
 *
 * Runs every hour. Checks for unread messages in Matches conversations
 * (type="request", provider_initiated) that have been unread for 1hr+.
 *
 * Covers spec items:
 * - F4: Provider replies in inbox → "New message from [Provider name]"
 * - P3: Family replies in inbox → "New message from [Family name]"
 *
 * Only fires if the message is unread for 1hr. Avoids noise during active
 * conversations (skips if recipient sent a message in the last 5 minutes).
 *
 * Note: The existing unread-reminders cron handles type="inquiry" connections
 * with a 24hr threshold. This cron handles type="request" (Matches) with a
 * 1hr threshold. No overlap.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getServiceClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    // Get accepted Matches connections with recent activity
    const { data: connections, error } = await db
      .from("connections")
      .select(
        "id, from_profile_id, to_profile_id, metadata, updated_at",
      )
      .eq("status", "accepted")
      .eq("type", "request")
      .gte("updated_at", sixHoursAgo)
      .limit(200);

    if (error) {
      console.error("[cron/matches-unread] query error:", error);
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }

    let remindersSent = 0;

    for (const conn of connections || []) {
      const meta = (conn.metadata || {}) as Record<string, unknown>;

      // Only Matches connections
      if (!meta.provider_initiated) continue;

      const thread = (meta.thread as ThreadMessage[]) || [];
      if (thread.length === 0) continue;

      // Filter out auto-replies
      const humanMessages = thread.filter((msg) => !msg.is_auto_reply);
      if (humanMessages.length === 0) continue;

      const lastMsg = humanMessages[humanMessages.length - 1];
      const lastMsgTime = new Date(lastMsg.created_at).getTime();

      // Skip if last message is less than 1hr old
      if (lastMsgTime > new Date(oneHourAgo).getTime()) continue;

      // Skip if already reminded for this message
      const lastRemindedAt = meta.matches_last_unread_reminder as
        | string
        | undefined;
      if (
        lastRemindedAt &&
        new Date(lastRemindedAt).getTime() > lastMsgTime
      )
        continue;

      // Determine recipient (person who didn't send last message)
      const recipientProfileId =
        lastMsg.from_profile_id === conn.from_profile_id
          ? conn.to_profile_id
          : conn.from_profile_id;

      // Check if recipient has been active recently (5-min window)
      const recipientMessages = humanMessages.filter(
        (m) => m.from_profile_id === recipientProfileId,
      );
      if (recipientMessages.length > 0) {
        const lastRecipientMsg =
          recipientMessages[recipientMessages.length - 1];
        if (lastRecipientMsg.created_at > fiveMinAgo) continue;
      }

      // Fetch profiles
      const [{ data: recipient }, { data: sender }] = await Promise.all([
        db
          .from("business_profiles")
          .select("display_name, email, type")
          .eq("id", recipientProfileId)
          .single(),
        db
          .from("business_profiles")
          .select("display_name")
          .eq("id", lastMsg.from_profile_id)
          .single(),
      ]);

      if (!recipient?.email) continue;

      const preview =
        lastMsg.text.length > 200
          ? lastMsg.text.slice(0, 200) + "..."
          : lastMsg.text;

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

      // Route based on recipient type
      const viewUrl =
        recipient.type === "family"
          ? `${siteUrl}/portal/inbox`
          : `${siteUrl}/provider/connections`;

      const senderName = sender?.display_name || "Someone";

      await sendEmail({
        to: recipient.email,
        subject: `New message from ${senderName}`,
        html: newMessageEmail({
          recipientName: recipient.display_name || "there",
          senderName,
          messagePreview: preview,
          viewUrl,
        }),
        emailType: "unread_reminder",
        recipientType: recipient.type === "family" ? "family" : "provider",
      });

      // Mark as reminded
      await db
        .from("connections")
        .update({
          metadata: {
            ...meta,
            matches_last_unread_reminder: new Date().toISOString(),
          },
        })
        .eq("id", conn.id);

      remindersSent++;
    }

    return NextResponse.json({ status: "ok", remindersSent });
  } catch (err) {
    console.error("[cron/matches-unread] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
