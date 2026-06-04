/**
 * Helper to deliver pending_verification connections and notify recipients.
 * Used when a provider completes verification - their pending inquiries
 * are delivered to caregivers with full notifications.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { connectionRequestEmail } from "@/lib/email-templates";
import { sendSMS, normalizeUSPhone } from "@/lib/twilio";
import { sendWhatsApp } from "@/lib/whatsapp";
import { sendSlackAlert, slackNewLead } from "@/lib/slack";
import { getSiteUrl } from "@/lib/site-url";

interface DeliverResult {
  delivered: number;
  notified: number;
  errors: string[];
}

interface ConnectionToDeliver {
  id: string;
  to_profile_id: string;
  type: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Deliver all pending_verification connections for a provider and send notifications.
 *
 * @param db - Supabase admin client
 * @param providerProfileId - The provider's profile ID (from_profile_id)
 * @param providerName - Provider's display name for notifications
 * @param providerSlug - Provider's slug for URLs
 */
export async function deliverPendingConnections(
  db: SupabaseClient,
  providerProfileId: string,
  providerName: string,
  providerSlug?: string
): Promise<DeliverResult> {
  const result: DeliverResult = {
    delivered: 0,
    notified: 0,
    errors: [],
  };

  try {
    // Fetch all pending_verification connections
    const { data: pendingConnections, error: fetchError } = await db
      .from("connections")
      .select("id, to_profile_id, type, message, metadata")
      .eq("from_profile_id", providerProfileId)
      .eq("status", "pending_verification");

    if (fetchError) {
      result.errors.push(`Failed to fetch pending connections: ${fetchError.message}`);
      return result;
    }

    if (!pendingConnections || pendingConnections.length === 0) {
      return result;
    }

    // Update all connections to "pending" status (delivered)
    const { error: updateError } = await db
      .from("connections")
      .update({
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("from_profile_id", providerProfileId)
      .eq("status", "pending_verification");

    if (updateError) {
      result.errors.push(`Failed to update connection status: ${updateError.message}`);
      return result;
    }

    result.delivered = pendingConnections.length;

    // Send notifications for each delivered connection (fire-and-forget)
    const notificationPromises = pendingConnections.map((conn) =>
      notifyRecipient(db, conn as ConnectionToDeliver, providerName, providerSlug)
        .then(() => {
          result.notified++;
        })
        .catch((err) => {
          result.errors.push(`Notification failed for ${conn.id}: ${err.message}`);
        })
    );

    await Promise.allSettled(notificationPromises);

    console.log(
      `[deliver-pending] Delivered ${result.delivered} connections, notified ${result.notified} recipients for ${providerName}`
    );

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result.errors.push(`Unexpected error: ${message}`);
    return result;
  }
}

/**
 * Send notifications to a connection recipient (caregiver/family).
 */
async function notifyRecipient(
  db: SupabaseClient,
  connection: ConnectionToDeliver,
  providerName: string,
  providerSlug?: string
): Promise<void> {
  // Fetch recipient profile details
  const { data: recipient, error: recipientError } = await db
    .from("business_profiles")
    .select("id, display_name, email, phone, type, metadata")
    .eq("id", connection.to_profile_id)
    .single();

  if (recipientError || !recipient) {
    throw new Error(`Recipient not found: ${connection.to_profile_id}`);
  }

  const recipientEmail = recipient.email;
  const recipientPhone = recipient.phone;
  const recipientName = recipient.display_name || "there";
  const recipientMeta = (recipient.metadata || {}) as Record<string, unknown>;

  // Parse connection message for context
  let careType: string | null = null;
  let messageText: string | null = null;
  let senderFirstName = "A provider";

  if (connection.message) {
    try {
      const parsed = JSON.parse(connection.message) as Record<string, unknown>;
      careType = (parsed.care_type as string) || null;
      messageText = (parsed.message as string) || (parsed.additional_notes as string) || null;
      const seekerName = (parsed.seeker_name as string) || "";
      senderFirstName = seekerName.split(/\s+/)[0] || "A provider";
    } catch {
      // Message isn't JSON, use as-is
      messageText = connection.message;
    }
  }

  const siteUrl = getSiteUrl();

  // Send email notification
  if (recipientEmail) {
    try {
      const emailSubject = `${providerName} sent you a care inquiry`;
      const emailLogId = await reserveEmailLogId({
        to: recipientEmail,
        subject: emailSubject,
        emailType: "connection_request",
        recipientType: recipient.type === "family" ? "family" : "provider",
        providerId: connection.to_profile_id,
      });

      const viewUrl = appendTrackingParams(
        `${siteUrl}/portal/inbox?id=${connection.id}`,
        emailLogId
      );

      await sendEmail({
        to: recipientEmail,
        subject: emailSubject,
        html: connectionRequestEmail({
          providerName: recipientName,
          familyName: providerName,
          careType: careType ? formatCareType(careType) : null,
          viewUrl,
          providerSlug,
        }),
        emailType: "connection_request",
        recipientType: recipient.type === "family" ? "family" : "provider",
        providerId: connection.to_profile_id,
        emailLogId: emailLogId ?? undefined,
        recipientProfileId: connection.to_profile_id,
      });
    } catch (emailErr) {
      console.error("[deliver-pending] Email notification failed:", emailErr);
    }
  }

  // Send SMS notification
  if (recipientPhone) {
    try {
      const normalized = normalizeUSPhone(recipientPhone);
      if (normalized) {
        await sendSMS({
          to: normalized,
          body: `New inquiry on Olera from ${providerName}. View and respond: ${siteUrl}/portal/inbox`,
          recipientProfileId: connection.to_profile_id,
          notificationType: "new_leads",
        });
      }
    } catch (smsErr) {
      console.error("[deliver-pending] SMS notification failed:", smsErr);
    }
  }

  // Send WhatsApp notification (if opted in)
  if (recipientPhone && recipientMeta.whatsapp_opted_in) {
    try {
      const waNormalized = normalizeUSPhone(recipientPhone);
      if (waNormalized) {
        await sendWhatsApp({
          to: waNormalized,
          contentSid: process.env.TWILIO_WA_TEMPLATE_NEW_LEAD || "sandbox",
          contentVariables: {
            "1": providerName,
            "2": recipientName,
          },
          fallbackBody: `${providerName} sent you a care inquiry on Olera.\n\nView and respond: ${siteUrl}/portal/inbox`,
          messageType: "connection_request",
          recipientType: recipient.type === "family" ? "family" : "provider",
          profileId: connection.to_profile_id,
          notificationType: "new_leads",
        });
      }
    } catch (waErr) {
      console.error("[deliver-pending] WhatsApp notification failed:", waErr);
    }
  }

  // Slack alert (fire-and-forget)
  try {
    const alert = slackNewLead({
      familyName: providerName,
      providerName: recipientName,
      careType: careType ? formatCareType(careType) : null,
    });
    await sendSlackAlert(alert.text, alert.blocks);
  } catch {
    // Non-blocking
  }
}

/**
 * Format care type for display
 */
function formatCareType(careType: string): string {
  const careTypeMap: Record<string, string> = {
    home_care: "Home Care",
    home_health: "Home Health Care",
    assisted_living: "Assisted Living",
    memory_care: "Memory Care",
    nursing_home: "Nursing Home",
    hospice: "Hospice",
  };
  return careTypeMap[careType] || careType;
}
