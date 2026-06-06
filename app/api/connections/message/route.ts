import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { newMessageEmail, firstMessageEmail, firstName, firstResponseConfirmationEmail, matchesEncouragementEmail } from "@/lib/email-templates";
import { sendLoopsEvent } from "@/lib/loops";
import { sendWhatsApp } from "@/lib/whatsapp";
import { normalizeUSPhone } from "@/lib/twilio";

interface ThreadMessage {
  from_profile_id: string;
  text: string;
  created_at: string;
  is_auto_reply?: boolean;
}

/**
 * POST /api/connections/message
 *
 * Appends a message to the connection's metadata.thread array.
 * Only participants can send messages. Connection must be pending or accepted.
 *
 * Supports two auth modes:
 * 1. Authenticated users: uses Supabase session + active_profile_id
 * 2. Guest users: uses claimToken to validate unclaimed profile ownership
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { connectionId, text, claimToken } = body as {
      connectionId?: string;
      text?: string;
      claimToken?: string;
    };

    if (!connectionId || !text?.trim()) {
      return NextResponse.json(
        { error: "connectionId and text are required" },
        { status: 400 }
      );
    }

    const admin = getServiceClient();
    let profileId: string;
    let userEmail: string | null = null;

    // Try authenticated flow first
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Authenticated user flow
      const { data: account } = await supabase
        .from("accounts")
        .select("active_profile_id")
        .eq("user_id", user.id)
        .single();

      if (!account?.active_profile_id) {
        return NextResponse.json(
          { error: "No active profile" },
          { status: 400 }
        );
      }
      profileId = account.active_profile_id;
      userEmail = user.email || null;
    } else if (claimToken) {
      // Guest flow — validate claim token
      const { data: guestProfile } = await admin
        .from("business_profiles")
        .select("id, email")
        .eq("claim_token", claimToken)
        .is("account_id", null)
        .single();

      if (!guestProfile) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        );
      }
      profileId = guestProfile.id;
      userEmail = guestProfile.email || null;
    } else {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch the connection (use admin to bypass RLS for guests)
    // Include 'type' to correctly identify provider vs family for different connection types
    const { data: connection, error: fetchError } = await admin
      .from("connections")
      .select("id, from_profile_id, to_profile_id, status, metadata, type")
      .eq("id", connectionId)
      .single();

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Must be a participant
    if (
      connection.from_profile_id !== profileId &&
      connection.to_profile_id !== profileId
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Can only message on pending or accepted connections
    if (connection.status !== "pending" && connection.status !== "accepted") {
      return NextResponse.json(
        { error: "Cannot send messages on this connection" },
        { status: 400 }
      );
    }

    // Append message to metadata.thread
    const existingMeta =
      (connection.metadata as Record<string, unknown>) || {};
    const existingThread = (existingMeta.thread as ThreadMessage[]) || [];

    const newMessage: ThreadMessage = {
      from_profile_id: profileId,
      text: text.trim(),
      created_at: new Date().toISOString(),
    };

    const updatedThread = [...existingThread, newMessage];

    // Determine provider and family based on connection type
    // inquiry: from=family, to=provider (family initiated)
    // request: from=provider, to=family (provider initiated via Matches)
    const isInquiry = connection.type === "inquiry";
    const providerProfileId = isInquiry ? connection.to_profile_id : connection.from_profile_id;
    const familyProfileId = isInquiry ? connection.from_profile_id : connection.to_profile_id;

    // Check if this is the provider's first response in this thread (for first response email)
    // Only applies to inquiry connections - for Matches (request), provider already initiated
    const isProviderSender = profileId === providerProfileId;
    const providerMessagesBeforeThis = existingThread.filter(
      (m) => m.from_profile_id === providerProfileId && !m.is_auto_reply
    );
    // Only trigger first response email for inquiry connections (not Matches)
    // For Matches, the provider already sent the first message (the reach-out)
    const isFirstProviderResponse = isInquiry && isProviderSender && providerMessagesBeforeThis.length === 0;

    // Use admin client to bypass RLS (needed for guest flow)
    const { error: updateError } = await admin
      .from("connections")
      .update({
        metadata: { ...existingMeta, thread: updatedThread },
      })
      .eq("id", connectionId);

    if (updateError) {
      console.error("Message error:", updateError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    // Email notification to the other party (fire-and-forget, debounced)
    try {
      const recipientProfileId =
        profileId === connection.from_profile_id
          ? connection.to_profile_id
          : connection.from_profile_id;

      // Debounce: skip if recipient sent a message in the last 5 minutes
      // (they're likely active in the conversation)
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      const recentRecipientMsg = updatedThread
        .filter((m) => m.from_profile_id === recipientProfileId)
        .some((m) => new Date(m.created_at).getTime() > fiveMinAgo);

      console.log("[message] notification check:", {
        senderProfileId: profileId,
        recipientProfileId,
        connectionId,
        recentRecipientMsg,
        willSendEmail: !recentRecipientMsg,
      });

      if (!recentRecipientMsg) {
        // Check if family has already replied (for email template selection)
        const familyMessagesBeforeThis = existingThread.filter(
          (m) => m.from_profile_id === familyProfileId && !m.is_auto_reply
        );
        const isFamilyEngaged = familyMessagesBeforeThis.length > 0;

        const [{ data: senderProfile }, { data: recipientProfile }] =
          await Promise.all([
            admin
              .from("business_profiles")
              .select("display_name")
              .eq("id", profileId)
              .single(),
            admin
              .from("business_profiles")
              .select("display_name, email, account_id, type, slug, source_provider_id, phone, metadata")
              .eq("id", recipientProfileId)
              .single(),
          ]);

        // Resolve recipient email: business_profiles.email for sending, auth email for magic links
        let recipientEmail = recipientProfile?.email;
        let authEmail = recipientEmail; // For magic link generation
        let emailSource: "profile" | "auth" | "none" = recipientEmail ? "profile" : "none";

        // Always look up auth email if account exists (for magic link generation)
        if (recipientProfile?.account_id) {
          const { data: acct } = await admin
            .from("accounts")
            .select("user_id")
            .eq("id", recipientProfile.account_id)
            .single();
          if (acct?.user_id) {
            const { data: { user: authUser } } = await admin.auth.admin.getUserById(acct.user_id);
            if (authUser?.email) {
              authEmail = authUser.email; // Use auth email for magic links
              if (!recipientEmail) {
                recipientEmail = authEmail; // Fallback for sending if no profile email
                emailSource = "auth";
              }
            }
          }
        }

        // Check if provider has claimed their listing (used for routing)
        const isClaimed = !!recipientProfile?.account_id;

        console.log("[message] email resolution:", {
          recipientProfileId,
          recipientType: recipientProfile?.type,
          recipientName: recipientProfile?.display_name,
          hasEmail: !!recipientEmail,
          emailSource: recipientEmail ? (emailSource === "profile" ? "profile" : "auth") : "none",
          hasAccountId: !!recipientProfile?.account_id,
          isClaimed,
        });

        if (recipientEmail) {
          const preview =
            text.trim().length > 200
              ? text.trim().slice(0, 200) + "..."
              : text.trim();

          const isFamily = recipientProfile?.type === "family";

          // Only send the "first response" email to families when:
          // 1. This is the first provider response (provider just replied to lead)
          // 2. Family hasn't engaged yet (no conversation started)
          // For ongoing conversations, skip this specific notification (handled by unread reminders)
          const shouldSendFirstResponseEmail = isFamily && isFirstProviderResponse && !isFamilyEngaged;

          if (isFamily && !shouldSendFirstResponseEmail) {
            // Skip email for ongoing family conversations - unread reminder cron will handle it
            console.log("[message] Skipping first-response email for ongoing conversation:", {
              isFirstProviderResponse,
              isFamilyEngaged,
              connectionId,
            });
            // Continue to WhatsApp notification below, then return
          } else {

          // For families: use full provider name (not shortened) in subject
          // For providers: use first name
          const senderFullName = senderProfile?.display_name || "Someone";
          const senderFirstName = firstName(senderFullName, "Someone");
          const msgSubject = isFamily
            ? `You have a reply from ${senderFullName}`
            : `${senderFirstName} sent you a message`;

          const msgEmailLogId = await reserveEmailLogId({
            to: recipientEmail,
            subject: msgSubject,
            emailType: "new_message",
            recipientType: isFamily ? "family" : "provider",
            providerId: !isFamily ? recipientProfileId : undefined,
          });

          // Route to inbox with auto-select and magic link:
          // - Families → /portal/inbox?id=... with magic link
          // - Claimed providers (have account) → /portal/inbox?role=provider&id=... with magic link
          // - Unclaimed providers → /provider/[slug]/onboard with magic link (to claim first)
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
          let viewUrl: string;

          if (isFamily) {
            const redirectPath = appendTrackingParams(
              `/portal/inbox?id=${connectionId}`,
              msgEmailLogId
            );
            viewUrl = `${siteUrl}${redirectPath}`;

            // Generate magic link for family (auto-sign in) using auth email
            try {
              const { data: familyLinkData, error: familyLinkError} = await admin.auth.admin.generateLink({
                type: "magiclink",
                email: authEmail, // Use auth email for magic link
                options: {
                  redirectTo: `${siteUrl}/auth/magic-link?next=${encodeURIComponent(redirectPath)}`,
                },
              });
              if (!familyLinkError && familyLinkData?.properties?.action_link) {
                viewUrl = familyLinkData.properties.action_link;
              } else {
                console.warn("Failed to generate family magic link for message:", familyLinkError?.message);
              }
            } catch (linkErr) {
              console.error("Failed to generate family magic link for message:", linkErr);
              // Continue with fallback URL (inbox without magic link)
            }
          } else if (isClaimed) {
            // Claimed provider → direct to inbox with magic link
            const redirectPath = appendTrackingParams(
              `/portal/inbox?role=provider&id=${connectionId}`,
              msgEmailLogId
            );
            viewUrl = `${siteUrl}${redirectPath}`;

            try {
              const { data: providerLinkData, error: providerLinkError } = await admin.auth.admin.generateLink({
                type: "magiclink",
                email: authEmail, // Use auth email for magic link
                options: {
                  redirectTo: `${siteUrl}/auth/magic-link?next=${encodeURIComponent(redirectPath)}`,
                },
              });
              if (!providerLinkError && providerLinkData?.properties?.action_link) {
                viewUrl = providerLinkData.properties.action_link;
              }
            } catch (linkErr) {
              console.error("Failed to generate provider magic link for message:", linkErr);
              // Continue with fallback URL (inbox without magic link)
            }
          } else {
            // Unclaimed provider → onboard page to claim listing first
            const providerSlug = recipientProfile?.slug || recipientProfile?.source_provider_id || recipientProfileId;
            const redirectPath = appendTrackingParams(
              `/provider/${providerSlug}/onboard?action=message&actionId=${connectionId}`,
              msgEmailLogId
            );
            viewUrl = `${siteUrl}${redirectPath}`;

            try {
              const { data: providerLinkData, error: providerLinkError } = await admin.auth.admin.generateLink({
                type: "magiclink",
                email: authEmail, // Use auth email for magic link
                options: {
                  redirectTo: `${siteUrl}/auth/magic-link?next=${encodeURIComponent(redirectPath)}`,
                },
              });
              if (!providerLinkError && providerLinkData?.properties?.action_link) {
                viewUrl = providerLinkData.properties.action_link;
              }
            } catch (linkErr) {
              console.error("Failed to generate provider magic link for message:", linkErr);
              // Continue with fallback URL (onboard page)
            }
          }

          // Detect if this is recipient's first message or a reply
          // If recipient has never sent a message in this thread → first message
          // If recipient has sent messages → reply
          const recipientPreviousMessages = existingThread.filter(
            (m) => m.from_profile_id === recipientProfileId && !m.is_auto_reply
          );
          const isFirstMessageToRecipient = recipientPreviousMessages.length === 0;

          console.log("[message] sending email notification:", {
            to: recipientEmail,
            subject: msgSubject,
            recipientType: isFamily ? "family" : "provider",
            senderName: senderProfile?.display_name,
            emailLogId: msgEmailLogId,
            isFirstMessage: isFirstMessageToRecipient,
          });

          // Use different template based on whether recipient has messaged before
          const emailTemplate = isFirstMessageToRecipient
            ? firstMessageEmail
            : newMessageEmail;

          await sendEmail({
            to: recipientEmail,
            subject: msgSubject,
            html: emailTemplate({
              recipientName: recipientProfile?.display_name || "",
              senderName: senderProfile?.display_name || "",
              messagePreview: preview,
              viewUrl,
            }),
            emailType: 'new_message',
            recipientType: isFamily ? "family" : "provider",
            providerId: !isFamily ? recipientProfileId : undefined,
            emailLogId: msgEmailLogId ?? undefined,
            recipientProfileId,
          });

          console.log("[message] email sent successfully to:", recipientEmail);
          } // End of email sending else block
        } else {
          console.warn("[message] no email found for recipient:", {
            recipientProfileId,
            recipientType: recipientProfile?.type,
            recipientName: recipientProfile?.display_name,
          });
        }

        // WhatsApp notification (same debounce applies)
        try {
          const recipientMeta = (recipientProfile?.metadata || {}) as Record<string, unknown>;
          if (recipientProfile?.phone && recipientMeta.whatsapp_opted_in) {
            const waNormalized = normalizeUSPhone(recipientProfile.phone);
            if (waNormalized) {
              const waPreview = text.trim().length > 100
                ? text.trim().slice(0, 100) + "..."
                : text.trim();

              const senderLabel = senderProfile?.display_name || "Someone";
              await sendWhatsApp({
                to: waNormalized,
                contentSid: process.env.TWILIO_WA_TEMPLATE_NEW_MESSAGE || "sandbox",
                contentVariables: {
                  "1": senderLabel,
                  "2": waPreview,
                },
                fallbackBody: `New message from ${senderLabel} on Olera:\n\n"${waPreview}"\n\nReply now: ${process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care"}${
                  recipientProfile?.type === "family"
                    ? `/portal/inbox?id=${connectionId}`
                    : isClaimed
                      ? `/portal/inbox?role=provider&id=${connectionId}`
                      : `/provider/${recipientProfile?.slug || recipientProfile?.source_provider_id || recipientProfileId}/onboard?action=message&actionId=${connectionId}`
                }`,
                messageType: "new_message",
                recipientType: recipientProfile?.type === "family" ? "family" : "provider",
                profileId: recipientProfileId,
                notificationType: recipientProfile?.type === "family" ? "messages_and_responses" : "messages",
              });
            }
          }
        } catch (waErr) {
          console.error("[whatsapp] Message notification failed:", waErr);
        }
      }
    } catch (emailErr) {
      console.error("[message] email notification failed:", emailErr);
    }

    // Loops: new message event (fire-and-forget)
    try {
      if (userEmail) {
        await sendLoopsEvent({
          email: userEmail,
          eventName: "new_message",
          audience: "seeker",
          eventProperties: {
            messagePreview: text.trim().slice(0, 100),
          },
        });
      }
    } catch {
      // Non-blocking
    }

    // First response confirmation email (provider only, inquiry connections only)
    if (isFirstProviderResponse) {
      try {
        // Get provider and family details using the correct profile IDs
        // (providerProfileId and familyProfileId are defined above based on connection type)
        const [{ data: providerProfile }, { data: familyProfile }] = await Promise.all([
          admin
            .from("business_profiles")
            .select("display_name, email, account_id, slug")
            .eq("id", providerProfileId)
            .single(),
          admin
            .from("business_profiles")
            .select("display_name")
            .eq("id", familyProfileId)
            .single(),
        ]);

        // Resolve provider email
        let providerEmail = providerProfile?.email;
        if (!providerEmail && providerProfile?.account_id) {
          const { data: acct } = await admin
            .from("accounts")
            .select("user_id")
            .eq("id", providerProfile.account_id)
            .single();
          if (acct?.user_id) {
            const { data: { user: authUser } } = await admin.auth.admin.getUserById(acct.user_id);
            providerEmail = authUser?.email;
          }
        }

        if (providerEmail) {
          // Calculate response time in hours
          const connectionCreatedAt = connection.metadata?.created_at || existingThread[0]?.created_at;
          let responseTimeHours = 24; // default if we can't calculate
          if (connectionCreatedAt) {
            const createdMs = new Date(connectionCreatedAt as string).getTime();
            const nowMs = Date.now();
            responseTimeHours = Math.round((nowMs - createdMs) / (1000 * 60 * 60));
          }

          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
          const emailLogId = await reserveEmailLogId({
            to: providerEmail,
            subject: "Great job reaching out!",
            emailType: "first_response_confirmation",
            recipientType: "provider",
            providerId: providerProfileId,
          });

          // Generate magic link for auto-sign-in (provider is claimed since they just sent a message)
          const redirectPath = appendTrackingParams(
            `/portal/inbox?role=provider&id=${connectionId}`,
            emailLogId
          );
          let viewUrl = `${siteUrl}${redirectPath}`;

          try {
            const { data: magicLinkData, error: magicLinkError } = await admin.auth.admin.generateLink({
              type: "magiclink",
              email: providerEmail,
              options: {
                redirectTo: `${siteUrl}/auth/magic-link?next=${encodeURIComponent(redirectPath)}`,
              },
            });
            if (!magicLinkError && magicLinkData?.properties?.action_link) {
              viewUrl = magicLinkData.properties.action_link;
            }
          } catch (linkErr) {
            console.error("[message] Failed to generate magic link for first response confirmation:", linkErr);
            // Continue with fallback URL
          }

          await sendEmail({
            to: providerEmail,
            subject: "Great job reaching out!",
            html: firstResponseConfirmationEmail({
              providerName: providerProfile?.display_name || "Provider",
              recipientName: providerProfile?.display_name || "there",
              familyName: familyProfile?.display_name || "A family",
              responseTimeHours,
              viewUrl,
            }),
            emailType: "first_response_confirmation",
            recipientType: "provider",
            providerId: providerProfileId,
            emailLogId: emailLogId ?? undefined,
            recipientProfileId: providerProfileId,
          });

          console.log("[message] sent first response confirmation email to provider:", providerEmail);

          // Matches encouragement: introduce Matches to providers who have never used it
          try {
            // Fetch provider metadata to check if we've already sent this email
            const { data: fullProviderProfile } = await admin
              .from("business_profiles")
              .select("metadata")
              .eq("id", providerProfileId)
              .single();

            const providerMeta = (fullProviderProfile?.metadata || {}) as Record<string, unknown>;
            const alreadySentMatchesEncouragement = providerMeta.matches_encouragement_sent;

            if (!alreadySentMatchesEncouragement) {
              // Check if provider has ever used Matches (sent a reach-out)
              const { count: matchesCount } = await admin
                .from("connections")
                .select("id", { count: "exact", head: true })
                .eq("from_profile_id", providerProfileId)
                .eq("type", "request");

              const hasUsedMatches = (matchesCount || 0) > 0;

              if (!hasUsedMatches) {
                const matchesLogId = await reserveEmailLogId({
                  to: providerEmail,
                  subject: "Did you know you can reach out first?",
                  emailType: "matches_encouragement",
                  recipientType: "provider",
                  providerId: providerProfileId,
                });

                // Generate magic link for Matches page
                const matchesPath = appendTrackingParams("/provider/matches", matchesLogId);
                let matchesUrl = `${siteUrl}${matchesPath}`;

                try {
                  const { data: matchesLinkData, error: matchesLinkError } = await admin.auth.admin.generateLink({
                    type: "magiclink",
                    email: providerEmail,
                    options: {
                      redirectTo: `${siteUrl}/auth/magic-link?next=${encodeURIComponent(matchesPath)}`,
                    },
                  });
                  if (!matchesLinkError && matchesLinkData?.properties?.action_link) {
                    matchesUrl = matchesLinkData.properties.action_link;
                  }
                } catch (matchesLinkErr) {
                  console.error("[message] Failed to generate magic link for matches encouragement:", matchesLinkErr);
                }

                await sendEmail({
                  to: providerEmail,
                  subject: "Did you know you can reach out first?",
                  html: matchesEncouragementEmail({
                    providerName: providerProfile?.display_name || "Provider",
                    recipientName: providerProfile?.display_name || "there",
                    familyName: familyProfile?.display_name || "a family",
                    matchesUrl,
                  }),
                  emailType: "matches_encouragement",
                  recipientType: "provider",
                  providerId: providerProfileId,
                  emailLogId: matchesLogId ?? undefined,
                  recipientProfileId: providerProfileId,
                });

                // Mark as sent so we don't send it again
                await admin
                  .from("business_profiles")
                  .update({
                    metadata: {
                      ...providerMeta,
                      matches_encouragement_sent: true,
                      matches_encouragement_sent_at: new Date().toISOString(),
                    },
                  })
                  .eq("id", providerProfileId);

                console.log("[message] sent matches encouragement email to provider:", providerEmail);
              }
            }
          } catch (matchesEncErr) {
            console.error("[message] matches encouragement email failed:", matchesEncErr);
            // Non-blocking
          }
        }
      } catch (firstResponseErr) {
        console.error("[message] first response confirmation email failed:", firstResponseErr);
      }
    }

    return NextResponse.json({ thread: updatedThread });
  } catch (err) {
    console.error("Message error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
