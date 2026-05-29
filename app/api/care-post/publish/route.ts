import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { matchesLiveEmail, reachOutAutoDeclinedEmail } from "@/lib/email-templates";
import { calculateFamilyCompleteness } from "@/lib/admin/profile-completeness";

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * POST /api/care-post/publish
 *
 * Updates metadata.care_post on the user's business_profiles record.
 * Actions: "publish" | "deactivate" | "delete"
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { action, reasons, source } = body as {
      action: "publish" | "deactivate" | "delete";
      reasons?: string[];
      source?: "enrichment_flow" | "profile_page" | "quick_wizard" | "benefits_flow";
    };

    if (!action || !["publish", "deactivate", "delete"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get user's family profile
    const { data: account } = await supabase
      .from("accounts")
      .select("active_profile_id")
      .eq("user_id", user.id)
      .single();

    if (!account?.active_profile_id) {
      return NextResponse.json({ error: "No active profile" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("business_profiles")
      .select("id, metadata, type, display_name, image_url, city, phone, description, care_types")
      .eq("id", account.active_profile_id)
      .single();

    if (!profile || profile.type !== "family") {
      return NextResponse.json({ error: "Family profile required" }, { status: 400 });
    }

    const metadata = (profile.metadata || {}) as Record<string, unknown>;

    // Track if this is the first time publishing (for analytics - only track first publish)
    // Use dedicated flag that's never reset, so re-activations aren't double-counted
    // Also check matches_live_email_sent to handle users who published before this flag existed
    const hasBeenPublishedBefore = Boolean(metadata.profile_publication_tracked) || Boolean(metadata.matches_live_email_sent);

    // Calculate and store profile completeness at publish time
    const completeness = calculateFamilyCompleteness(
      {
        display_name: profile.display_name,
        image_url: profile.image_url,
        city: profile.city,
        phone: profile.phone,
        description: profile.description,
        care_types: profile.care_types,
        metadata: profile.metadata,
      },
      user.email
    );
    metadata.profile_completeness = completeness.percentage;

    if (action === "publish") {
      metadata.care_post = {
        status: "active",
        published_at: new Date().toISOString(),
      };

      // Mark first publish for analytics tracking (flag is never reset)
      if (!hasBeenPublishedBefore) {
        metadata.profile_publication_tracked = true;
      }

      // F1: Send "Your care profile is live" email — fire once only
      if (!metadata.matches_live_email_sent) {
        metadata.matches_live_email_sent = true;

        // Fire-and-forget: send email in background, don't block API response
        // Note: Family email is in auth.users (user.email), not business_profiles
        const recipientEmail = user.email;
        if (recipientEmail) {
          // Start async email send without awaiting
          (async () => {
            try {
              const { data: bp } = await supabase
                .from("business_profiles")
                .select("display_name, city")
                .eq("id", profile.id)
                .single();

              const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
              await sendEmail({
                to: recipientEmail,
                subject: `Your care profile is live — providers in ${bp?.city || "your area"} can find you`,
                html: matchesLiveEmail({
                  familyName: bp?.display_name || "there",
                  city: bp?.city || "your area",
                  matchesUrl: `${siteUrl}/portal/profile`,
                }),
                emailType: "matches_live",
                recipientType: "family",
              });
            } catch (emailErr) {
              console.error("[care-post/publish] matches live email failed:", emailErr);
            }
          })();
        }
      }
    } else if (action === "delete") {
      // Store deletion metadata for analytics, then remove the care post
      metadata.care_post_deleted = {
        deleted_at: new Date().toISOString(),
        reasons: reasons || [],
        ...(typeof metadata.care_post === "object" && metadata.care_post !== null
          ? { published_at: (metadata.care_post as Record<string, unknown>).published_at }
          : {}),
      };
      delete metadata.care_post;
    } else {
      metadata.care_post = {
        status: "paused",
        ...(typeof metadata.care_post === "object" && metadata.care_post !== null
          ? { published_at: (metadata.care_post as Record<string, unknown>).published_at }
          : {}),
      };
    }

    const { error: updateError } = await supabase
      .from("business_profiles")
      .update({ metadata })
      .eq("id", profile.id);

    if (updateError) {
      console.error("Care post update error:", updateError);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    // Auto-decline pending reach-out requests when family deactivates/deletes profile
    if (action === "deactivate" || action === "delete") {
      const serviceDb = getServiceDb();
      if (serviceDb) {
        // Find all pending connections TO this family (provider reach-outs)
        const { data: pendingConnections } = await serviceDb
          .from("connections")
          .select("id, from_profile_id")
          .eq("to_profile_id", profile.id)
          .eq("type", "request")
          .eq("status", "pending");

        if (pendingConnections && pendingConnections.length > 0) {
          // Auto-decline with reason - merge with existing metadata
          const declineMetadata = {
            declined_reason: action === "delete" ? "profile_deleted" : "profile_deactivated",
            auto_declined_at: new Date().toISOString(),
          };

          // Track which connections were successfully declined (for email notifications)
          const declinedProviderIds: string[] = [];

          for (const conn of pendingConnections) {
            try {
              // Fetch existing connection to preserve metadata
              const { data: existing, error: fetchError } = await serviceDb
                .from("connections")
                .select("metadata")
                .eq("id", conn.id)
                .single();

              if (fetchError) {
                console.error(`[care-post/publish] Failed to fetch connection ${conn.id}:`, fetchError);
                continue;
              }

              const { error: updateError } = await serviceDb
                .from("connections")
                .update({
                  status: "declined",
                  metadata: {
                    ...(existing?.metadata || {}),
                    ...declineMetadata,
                  },
                })
                .eq("id", conn.id);

              if (updateError) {
                console.error(`[care-post/publish] Failed to decline connection ${conn.id}:`, updateError);
                continue;
              }

              // Only add to email list if update succeeded
              declinedProviderIds.push(conn.from_profile_id);
            } catch (err) {
              console.error(`[care-post/publish] Error processing connection ${conn.id}:`, err);
            }
          }

          // Send notification emails to providers whose connections were actually declined
          if (declinedProviderIds.length > 0) {
            (async () => {
            try {
              // Fetch provider profiles with their account info
              const { data: providerProfiles } = await serviceDb
                .from("business_profiles")
                .select("id, display_name, account_id")
                .in("id", declinedProviderIds);

              if (!providerProfiles?.length) return;

              const accountIds = providerProfiles
                .map((p: { account_id: string | null }) => p.account_id)
                .filter(Boolean) as string[];

              if (!accountIds.length) return;

              // Get accounts with user_id
              const { data: accounts } = await serviceDb
                .from("accounts")
                .select("id, user_id")
                .in("id", accountIds);

              if (!accounts?.length) return;

              // Get user emails via admin API - fetch each user by ID
              // This is more reliable than listUsers() which is paginated and returns all users
              const userIds = accounts.map((a: { user_id: string }) => a.user_id);
              const userMap = new Map<string, string>();

              for (const userId of userIds) {
                try {
                  const { data: userData } = await serviceDb.auth.admin.getUserById(userId);
                  if (userData?.user?.email) {
                    userMap.set(userId, userData.user.email);
                  }
                } catch {
                  // Skip users we can't fetch
                }
              }

              const accountToUser = new Map(
                accounts.map((a: { id: string; user_id: string }) => [a.id, a.user_id])
              );

              const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
              const familyCity = profile.city || "your area";

              for (const provider of providerProfiles) {
                const userId = accountToUser.get(provider.account_id);
                const email = userId ? userMap.get(userId) : null;

                if (email) {
                  await sendEmail({
                    to: email,
                    subject: "A family closed their care profile",
                    html: reachOutAutoDeclinedEmail({
                      providerName: provider.display_name || "there",
                      familyCity,
                      viewUrl: `${siteUrl}/provider/matches`,
                    }),
                    emailType: "reach_out_auto_declined",
                    recipientType: "provider",
                  });
                }
              }
            } catch (emailErr) {
              console.error("[care-post/publish] auto-decline emails failed:", emailErr);
            }
          })();
          }
        }
      }
    }

    // Track profile_published event to seeker_activity (family-centric analytics)
    // This enables queries like "which family profiles came through enrichment flow"
    // Only track the first publish, not re-activations (flag is never reset)
    if (action === "publish" && !hasBeenPublishedBefore) {
      const serviceDb = getServiceDb();
      if (serviceDb) {
        const publishedAt = (metadata.care_post as Record<string, unknown>)?.published_at;
        serviceDb.from("seeker_activity").insert({
          profile_id: profile.id,
          event_type: "profile_published",
          metadata: {
            source: source || "profile_page", // Default to profile_page if not specified
            published_at: publishedAt,
            completeness: completeness.percentage,
          },
        }).then(({ error }) => {
          if (error) {
            console.error("[care-post/publish] seeker_activity tracking failed:", error);
          }
        });
      }
    }

    return NextResponse.json({ success: true, care_post: metadata.care_post });
  } catch (err) {
    console.error("Care post error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
