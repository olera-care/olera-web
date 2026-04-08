"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createAuthClient } from "@/lib/supabase/auth-client";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Provider } from "@/lib/types/provider";
import SmartDashboardShell from "@/components/provider-onboarding/SmartDashboardShell";
import type { ActionCardState, NotificationData, NotificationType } from "@/components/provider-onboarding/ActionCard";
import {
  getOrCreateClaimSession,
  markSessionVerified,
  clearClaimSession,
  type ClaimSessionData,
} from "@/lib/claim-session";

type OnboardStep =
  | "loading"
  | "dashboard" // Shows SmartDashboardShell with appropriate ActionCard state
  | "finalizing"
  | "success"
  | "error";

/** Shared action→destination mapping for email notification routing */
function getActionRedirectUrl(
  action: string | null,
  actionId: string | null
): string {
  if (action && actionId) {
    switch (action) {
      case "lead":
        return `/provider/connections?id=${actionId}`;
      case "message":
        return `/provider/inbox?id=${actionId}`;
      case "question":
        return `/provider/qna?id=${actionId}`;
      case "review":
        return `/provider/reviews?id=${actionId}`;
      case "interview":
        return "/provider/caregivers";
      case "claim":
      case "signup":
        return "/provider";
    }
  }
  return "/provider";
}

export default function ProviderOnboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const providerIdParam = searchParams.get("provider_id");
  const stateParam = searchParams.get("state") as ActionCardState | null;
  // Action params for email notifications (lead/message/review/question) or campaign
  const actionParam = searchParams.get("action") as NotificationType | "campaign" | "claim" | "signup" | null;
  const actionIdParam = searchParams.get("actionId");
  // Token param for marketing campaign emails (pre-verified flow)
  // Named "otk" (one-time key) instead of "token" to avoid Apple Mail's
  // Link Tracking Protection which strips params named "token" from URLs
  const tokenParam = searchParams.get("otk");
  // Pending claim flag - when true, claim_state will be "pending" for manual review
  // (used when user claims with alternate email they don't have access to the email on file)
  const pendingClaimParam = searchParams.get("pending") === "true";
  const router = useRouter();
  const { user, account, profiles, openAuth, refreshAccountData, switchProfile } = useAuth();

  // Track email click if this visit came from an email link (fire-and-forget)
  useEffect(() => {
    const ref = searchParams.get("ref");
    const eid = searchParams.get("eid");
    if (ref === "email" && eid) {
      const emailTypeMap: Record<string, string> = {
        lead: "connection_request",
        review: "new_review",
        question: "question_received",
        interview: "interview_request",
        claim: "listing_claimed",
        signup: "account_created",
      };
      fetch("/api/activity/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: slug,
          event_type: "email_click",
          email_log_id: eid,
          email_type: actionParam ? emailTypeMap[actionParam] || actionParam : null,
          metadata: { source: "direct_link", destination: window.location.pathname },
        }),
      }).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Core state
  const [step, setStep] = useState<OnboardStep>("loading");
  const [provider, setProvider] = useState<Provider | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [session, setSession] = useState<ClaimSessionData | null>(null);
  const [actionCardState, setActionCardState] = useState<ActionCardState>("claim-form");
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null);
  const [preVerifiedEmail, setPreVerifiedEmail] = useState<string | null>(null);
  const initRef = useRef(false);
  const finalizeRef = useRef(false);

  // Get claimSession ID for API calls
  const claimSession = session?.sessionId || "";

  // Fetch provider on mount
  useEffect(() => {
    if (initRef.current || !isSupabaseConfigured() || !slug) return;
    initRef.current = true;

    (async () => {
      const supabase = createClient();
      let foundProvider: Provider | null = null;

      // Strategy 1: Look up in olera-providers by provider_id (if param provided)
      if (providerIdParam) {
        const { data } = await supabase
          .from("olera-providers")
          .select("*")
          .eq("provider_id", providerIdParam)
          .not("deleted", "is", true)
          .single<Provider>();
        if (data) foundProvider = data;
      }

      // Strategy 2: Look up by slug in olera-providers
      if (!foundProvider) {
        const { data } = await supabase
          .from("olera-providers")
          .select("*")
          .eq("slug", slug)
          .not("deleted", "is", true)
          .single<Provider>();
        if (data) foundProvider = data;
      }

      // Strategy 3: Look up by provider_id = slug in olera-providers (legacy)
      if (!foundProvider) {
        const { data } = await supabase
          .from("olera-providers")
          .select("*")
          .eq("provider_id", slug)
          .not("deleted", "is", true)
          .single<Provider>();
        if (data) foundProvider = data;
      }

      // Strategy 4: Look up in business_profiles by slug (for native/claimed providers)
      // These providers may not exist in olera-providers
      // Include both "organization" and "caregiver" types (both are provider profiles)
      if (!foundProvider) {
        const { data: bp } = await supabase
          .from("business_profiles")
          .select("id, slug, display_name, claim_state, account_id, source_provider_id, email, phone, address, city, state, zip, description, image_url, care_types, metadata, type, category")
          .eq("slug", slug)
          .in("type", ["organization", "caregiver"])
          .maybeSingle();

        if (bp) {
          // For claimed providers, check if user owns it and redirect appropriately
          if (bp.claim_state === "claimed" && account && bp.account_id === account.id) {
            router.replace(getActionRedirectUrl(actionParam, actionIdParam));
            return;
          }

          // For other cases (not owned or unclaimed), create a Provider-like object
          // to continue with the onboard flow
          foundProvider = {
            provider_id: bp.source_provider_id || bp.id,
            provider_name: bp.display_name || "Provider",
            slug: bp.slug,
            email: bp.email,
            phone: bp.phone,
            address: bp.address,
            city: bp.city,
            state: bp.state,
            zipcode: bp.zip ? parseInt(bp.zip, 10) : null,
            provider_description: bp.description,
            provider_images: bp.image_url ? JSON.stringify([bp.image_url]) : null,
            provider_category: bp.category || "",
            main_category: bp.care_types?.[0] || null,
            lat: null,
            lon: null,
            website: null,
            lower_price: null,
            upper_price: null,
            deleted: false,
          } as Provider;
        }
      }

      if (!foundProvider) {
        setErrorMsg("Provider not found.");
        setStep("error");
        return;
      }

      setProvider(foundProvider);

      // Fetch notification data if action params provided (lead/review/question from email)
      // Track locally so we can use it later in this same function (state isn't readable until re-render)
      let fetchedNotificationData: NotificationData | null = null;

      // For claim/signup, we don't need actionId - provider info IS the notification data
      // Handle these separately since their URLs don't include actionId
      // Note: pending_leads and pending_questions will be populated by validate-token API
      if (actionParam === "claim" || actionParam === "signup") {
        fetchedNotificationData = {
          type: actionParam,
          id: foundProvider.provider_id || foundProvider.slug || slug,
          created_at: new Date().toISOString(),
          provider_name: foundProvider.provider_name,
          provider_city: foundProvider.city || null,
          provider_state: foundProvider.state || null,
          provider_image: foundProvider.provider_images?.split("|")[0]?.trim() || null,
          // Activity counts will be populated by validate-token API (defaults to 0 in UI)
          pending_leads: 0,
          pending_questions: 0,
        };
        setNotificationData(fetchedNotificationData);
      } else if (actionParam && actionIdParam) {
        // For lead/question/review/interview, we need to fetch data using actionId
        try {
          if (actionParam === "lead") {
            // Fetch connection (lead) data
            const { data: conn } = await supabase
              .from("connections")
              .select("id, created_at, message, metadata, from_profile:business_profiles!connections_from_profile_id_fkey(display_name, email, city, state, image_url)")
              .eq("id", actionIdParam)
              .single();
            if (conn) {
              // Parse the message field - it's stored as JSON string with seeker info
              let parsedMessage: Record<string, unknown> = {};
              try {
                if (conn.message && typeof conn.message === "string") {
                  parsedMessage = JSON.parse(conn.message);
                }
              } catch {
                // If parsing fails, message might be plain text (legacy)
                parsedMessage = { message: conn.message };
              }

              // Extract the actual custom message (additionalNotes) from parsed data
              const customMessage = (parsedMessage.message as string) || (parsedMessage.additional_notes as string) || null;

              // Extract care_type from parsed message or metadata
              const careType = (parsedMessage.care_type as string) || null;

              // Get auto_intro from metadata (generated intro message)
              const connMetadata = conn.metadata as Record<string, unknown> | null;
              const autoIntro = (connMetadata?.auto_intro as string) || null;

              fetchedNotificationData = {
                type: "lead",
                id: conn.id,
                created_at: conn.created_at,
                message: customMessage,
                metadata: {
                  care_type: careType || undefined,
                  auto_intro: autoIntro || undefined,
                },
                from_profile: conn.from_profile as NotificationData["from_profile"],
              };
            }
          } else if (actionParam === "question") {
            // Fetch question data
            const { data: question } = await supabase
              .from("provider_questions")
              .select("id, question, asker_name, created_at")
              .eq("id", actionIdParam)
              .single();
            if (question) {
              fetchedNotificationData = {
                type: "question",
                id: question.id,
                created_at: question.created_at,
                question: question.question,
                asker_name: question.asker_name,
              };
            }
          } else if (actionParam === "review") {
            // Fetch review data
            const { data: review } = await supabase
              .from("reviews")
              .select("id, rating, comment, reviewer_name, created_at")
              .eq("id", actionIdParam)
              .single();
            if (review) {
              fetchedNotificationData = {
                type: "review",
                id: review.id,
                created_at: review.created_at,
                rating: review.rating,
                comment: review.comment,
                reviewer_name: review.reviewer_name,
              };
            }
          } else if (actionParam === "interview") {
            // Fetch interview data with student details
            const { data: interview } = await supabase
              .from("interviews")
              .select("id, type, proposed_time, notes, status, created_at, student:business_profiles!interviews_student_profile_id_fkey(display_name, image_url)")
              .eq("id", actionIdParam)
              .single();
            if (interview) {
              const student = interview.student as unknown as { display_name: string; image_url: string | null } | null;
              fetchedNotificationData = {
                type: "interview",
                id: interview.id,
                created_at: interview.created_at,
                candidate_name: student?.display_name || "A candidate",
                candidate_image: student?.image_url || null,
                interview_format: interview.type,
                proposed_time: interview.proposed_time,
                notes: interview.notes,
              };
            }
          }
        } catch (err) {
          console.error("[ProviderOnboard] Failed to fetch notification data:", err);
        }
        if (fetchedNotificationData) {
          setNotificationData(fetchedNotificationData);
        }
      }

      // Initialize or recover session
      const claimSessionData = getOrCreateClaimSession(
        foundProvider.provider_id,
        foundProvider.slug || foundProvider.provider_id,
        foundProvider.provider_name
      );
      setSession(claimSessionData);

      // Handle signed claim token (from any email: lead, question, review, campaign)
      // One-click flow: validate token → auto-sign-in → auto-claim → redirect
      if (tokenParam) {
        try {
          const tokenRes = await fetch("/api/claim/validate-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: tokenParam,
              claimSession: claimSessionData.sessionId,
              action: actionParam,
              actionId: actionIdParam,
            }),
          });
          const tokenResult = await tokenRes.json();

          if (tokenResult.valid) {
            const verifiedEmail = tokenResult.email || tokenResult.emailHint;

            // For notification actions (lead/question/review):
            // Show notification card + dashboard IMMEDIATELY, then
            // run auto-sign-in in the background. The provider sees
            // the lead while auth happens silently.
            if (actionParam && actionParam !== "campaign") {
              const notificationStateMap: Record<string, ActionCardState> = {
                lead: "notification-lead", message: "notification-lead",
                question: "notification-question", review: "notification-review",
                interview: "notification-interview",
                claim: "notification-claim", signup: "notification-signup",
              };

              // Use notification data from validate-token (fetched server-side
              // with service role key — bypasses RLS that blocks the anon client)
              if (tokenResult.notificationData) {
                setNotificationData(tokenResult.notificationData as NotificationData);
              }

              // 1. Show notification card + dashboard NOW (no auth needed)
              finalizeRef.current = true; // prevent useEffect auto-finalize race
              setPreVerifiedEmail(verifiedEmail);
              setActionCardState(notificationStateMap[actionParam] || "pre-verified");
              setStep("dashboard");

              // 2. Background auto-sign-in — invisible to the provider
              (async () => {
                try {
                  // If already signed in and owns the listing, just switch profile
                  if (user && account) {
                    const { data: ownedProfile } = await createClient()
                      .from("business_profiles")
                      .select("id")
                      .eq("slug", slug)
                      .in("type", ["organization", "caregiver"])
                      .eq("account_id", account.id)
                      .maybeSingle();
                    if (ownedProfile) {
                      switchProfile(ownedProfile.id);
                      console.log("[OneClick] Already signed in as owner");
                      return;
                    }
                  }

                  // Auto-sign-in with the verified email
                  console.log("[OneClick] Starting auto-sign-in for", verifiedEmail);
                  const signInRes = await fetch("/api/auth/auto-sign-in", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: verifiedEmail,
                      claimSession: claimSessionData.sessionId,
                    }),
                  });
                  const signInData = await signInRes.json();

                  if (!signInRes.ok || !signInData.tokenHash) {
                    console.warn("[OneClick] auto-sign-in failed:", signInData.error || signInRes.status);
                    return;
                  }

                  // Establish session (implicit flow — no PKCE)
                  const authClient = createAuthClient();
                  const { data: otpData, error: otpError } = await authClient.auth.verifyOtp({
                    token_hash: signInData.tokenHash,
                    type: "magiclink",
                  });

                  if (otpError || !otpData?.session) {
                    console.warn("[OneClick] verifyOtp failed:", otpError?.message);
                    return;
                  }

                  // Transfer session to SSR client
                  await createClient().auth.setSession({
                    access_token: otpData.session.access_token,
                    refresh_token: otpData.session.refresh_token,
                  });
                  console.log("[OneClick] Session established");

                  // Finalize claim (creates account + links profile for first-time providers)
                  if (!tokenResult.alreadyClaimed) {
                    const finalizeRes = await fetch("/api/claim/finalize", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        providerId: foundProvider.provider_id,
                        claimSession: claimSessionData.sessionId,
                        pendingClaim: pendingClaimParam, // For alternate email claims
                      }),
                    });
                    console.log("[OneClick] Finalize:", finalizeRes.ok ? "success" : finalizeRes.status, pendingClaimParam ? "(pending)" : "");
                  }

                  // Refresh auth state + switch to provider profile
                  await refreshAccountData();
                  const { data: bp } = await createClient()
                    .from("business_profiles")
                    .select("id")
                    .eq("slug", slug)
                    .in("type", ["organization", "caregiver"])
                    .maybeSingle();
                  if (bp) switchProfile(bp.id);

                  console.log("[OneClick] Background sign-in complete");

                  // Log for observability
                  fetch("/api/activity/track", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      provider_id: slug,
                      event_type: "one_click_access",
                      metadata: { action: actionParam, action_id: actionIdParam, email: verifiedEmail, source: "email_token" },
                    }),
                  }).catch(() => {});
                } catch (err) {
                  console.warn("[OneClick] Background sign-in error:", err);
                }
              })();

              return; // notification card is already showing
            }

            // For campaign or fallback: show pre-verified state
            setPreVerifiedEmail(verifiedEmail);
            setActionCardState(actionParam && actionParam !== "campaign"
              ? (({ lead: "notification-lead", message: "notification-lead", question: "notification-question", review: "notification-review", interview: "notification-interview", claim: "notification-claim", signup: "notification-signup" } as Record<string, ActionCardState>)[actionParam] || "pre-verified")
              : "pre-verified"
            );
            setStep("dashboard");
            return;
          } else if (tokenResult.alreadyClaimed) {
            // Token valid but already claimed — for notification actions,
            // this is handled by the notification card path above (which
            // fires background sign-in). For campaigns, show already-claimed.
            setActionCardState("already-claimed");
            setStep("dashboard");
            return;
          } else {
            // Token invalid/expired - fall through to normal flow
            console.warn("[ProviderOnboard] Token invalid:", tokenResult.error);
          }
        } catch (err) {
          console.error("[ProviderOnboard] Failed to validate token:", err);
          // Fall through to normal flow
        }
      }

      // Check if already claimed via business_profiles
      // Query by source_provider_id first (olera-providers path), then by slug (BP-only path)
      let bp: { claim_state: string | null; account_id: string | null } | null = null;
      const { data: bpBySource } = await supabase
        .from("business_profiles")
        .select("claim_state, account_id")
        .eq("source_provider_id", foundProvider.provider_id)
        .maybeSingle();
      bp = bpBySource;

      if (!bp && foundProvider.slug) {
        // BP-only provider: look up by slug directly
        const { data: bpBySlug } = await supabase
          .from("business_profiles")
          .select("claim_state, account_id")
          .eq("slug", foundProvider.slug)
          .in("type", ["organization", "caregiver"])
          .maybeSingle();
        bp = bpBySlug;
      }

      if (bp?.claim_state === "claimed") {
        // If the signed-in user owns this listing, redirect to the appropriate section
        if (account && bp.account_id && account.id === bp.account_id) {
          router.replace(getActionRedirectUrl(actionParam, actionIdParam));
          return;
        }
        // If they arrived from a notification email, show the contextual card
        // (lead/question/review preview) instead of the generic "already claimed" dispute card.
        // This lets the actual owner verify + sign in to respond.
        // Note: claim/signup are excluded — those notification states require a valid token.
        // Without a token on a claimed listing, show already-claimed (handled below).
        if (actionParam && fetchedNotificationData && actionParam !== "claim" && actionParam !== "signup") {
          const notificationStateMap: Record<string, ActionCardState> = {
            lead: "notification-lead",
            message: "notification-lead",
            question: "notification-question",
            review: "notification-review",
          };
          setActionCardState(notificationStateMap[actionParam] || "already-claimed");
          setStep("dashboard");
          return;
        }
        // No notification context — show dispute form
        setActionCardState("already-claimed");
        setStep("dashboard");
        return;
      }

      // Check if returning from OAuth with verified session
      if (claimSessionData.verified && user) {
        setStep("finalizing");
        return;
      }

      // Check recovered session state - if previously verified, go to finalize
      if (claimSessionData.step === "verified" || claimSessionData.step === "code-sent") {
        // Old OTP flow states - now just show claim form
        setActionCardState("claim-form");
        setStep("dashboard");
        return;
      }

      // Pre-verify if user is authenticated via magic link with provider's email
      // If they clicked the magic link in the email, they've proven email ownership
      if (user && actionParam && actionIdParam) {
        const userEmail = user.email?.toLowerCase();
        const providerEmail = foundProvider.email?.toLowerCase();

        // If user's email matches provider's email, they came from the magic link
        // and are already verified (no need for OTP)
        if (userEmail && providerEmail && userEmail === providerEmail) {
          console.log("[ProviderOnboard] User authenticated via magic link, pre-verifying");
          // Mark session as verified
          await markSessionVerified(claimSessionData.sessionId);
          setPreVerifiedEmail(user.email || "");
          setActionCardState("pre-verified");
          setStep("dashboard");
          return;
        }
      }

      // Start with dashboard (wizard will show first, then verification)
      // Set initial state based on context:
      // 1. Notification from email (lead/question/review) → show notification card
      // 2. State param provided (e.g., from dispute link) → use that state
      // 3. Default → claim-form
      if (actionParam) {
        // Map action param to notification state
        const notificationStateMap: Record<string, ActionCardState> = {
          lead: "notification-lead",
          message: "notification-lead", // Messages show similar card to leads
          question: "notification-question",
          review: "notification-review",
        };
        setActionCardState(notificationStateMap[actionParam] || "claim-form");
      } else {
        const validStates: ActionCardState[] = ["claim-form", "already-claimed"];
        if (stateParam && validStates.includes(stateParam)) {
          setActionCardState(stateParam);
        } else {
          setActionCardState("claim-form");
        }
      }
      setStep("dashboard");
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, providerIdParam, stateParam, actionParam, actionIdParam, tokenParam]);

  // Auto-finalize after OAuth return
  useEffect(() => {
    if (step !== "finalizing" || !user || finalizeRef.current) return;
    finalizeRef.current = true;
    handleFinalize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, user]);

  // Auto-finalize when user becomes available and session is verified
  useEffect(() => {
    if (!user || !session?.verified) return;
    if (step === "dashboard" && !finalizeRef.current) {
      finalizeRef.current = true;
      setStep("finalizing");
      handleFinalize();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, session?.verified, step]);

  // Finalize claim
  const handleFinalize = async () => {
    const pid = provider?.provider_id || providerIdParam || session?.providerId;
    if (!pid || !claimSession) {
      setErrorMsg("Could not determine provider.");
      setStep("error");
      return;
    }

    try {
      const res = await fetch("/api/claim/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: pid,
          claimSession,
          pendingClaim: pendingClaimParam, // For alternate email claims
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        setErrorMsg(result.error || "Failed to finalize claim.");
        setStep("error");
        return;
      }

      clearClaimSession();
      await refreshAccountData();

      // Switch to the newly claimed profile
      if (result.profileId) {
        switchProfile(result.profileId);
      }

      setStep("success");
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStep("error");
    }
  };

  // Handle claim button click - open auth modal for authentication-based claim flow
  // After auth, the API will check if email matches provider's email for auto-verification
  const hasProviderProfile = (profiles || []).some((p) => p.type === "organization");

  const handleClaimClick = useCallback(async () => {
    // If user is signed in AND has a provider profile, call claim-listing API directly
    if (user && hasProviderProfile) {
      setStep("finalizing");
      try {
        const res = await fetch("/api/provider/claim-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            providerId: provider?.provider_id,
            providerName: provider?.provider_name,
            providerSlug: provider?.slug || provider?.provider_id,
            providerEmail: provider?.email,
            city: provider?.city,
            state: provider?.state,
          }),
        });
        const result = await res.json();

        if (!res.ok) {
          setErrorMsg(result.error || "Failed to claim listing.");
          setStep("error");
          return;
        }

        await refreshAccountData();
        if (result.profileId) {
          switchProfile(result.profileId);
        }
        setStep("success");
      } catch {
        setErrorMsg("Something went wrong. Please try again.");
        setStep("error");
      }
      return;
    }

    // Store provider data in sessionStorage for UnifiedAuthModal to read after auth
    sessionStorage.setItem("olera_claim_provider_cache", JSON.stringify({
      provider_id: provider?.provider_id,
      provider_name: provider?.provider_name,
      slug: provider?.slug || provider?.provider_id,
      email: provider?.email,
      city: provider?.city,
      state: provider?.state,
    }));

    // Open auth modal with claim intent
    // For users signed in with family/caregiver account, they'll see error and can try different email
    // For guests, they sign up/in with business email
    // The claim-listing API will handle email matching for verification status
    openAuth({
      intent: "provider",
      providerType: "organization",
      headline: "Sign in to claim this listing",
      subline: user
        ? "Sign in with your business email to claim this listing"
        : provider?.email
          ? `Use ${provider.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")} for instant verification`
          : "Use your business email to claim and manage this listing",
      deferred: {
        action: "claim-listing",
        returnUrl: `${window.location.pathname}?provider_id=${provider?.provider_id}`,
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hasProviderProfile, openAuth, provider?.provider_id, provider?.provider_name, provider?.slug, provider?.email, provider?.city, provider?.state, refreshAccountData, switchProfile]);

  // Loading state
  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
        <div className="text-center px-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">{errorMsg || "Something went wrong"}</h1>
          <p className="text-gray-500 mb-6">Please try again or contact support if the issue persists.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                clearClaimSession();
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors min-h-[44px]"
            >
              Try again
            </button>
            <Link
              href={provider ? `/provider/${slug}` : "/"}
              className="text-primary-600 hover:text-primary-700 font-medium min-h-[44px] flex items-center"
            >
              Go back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Determine success redirect URL based on action type
  const getSuccessRedirectUrl = () =>
    getActionRedirectUrl(actionParam, actionIdParam);

  // Get button text based on action type
  const getSuccessButtonText = () => {
    if (actionParam === "lead" || actionParam === "message") {
      return "View Message";
    } else if (actionParam === "question") {
      return "View Question";
    } else if (actionParam === "review") {
      return "View Review";
    }
    return "Go to Dashboard";
  };

  // Success state
  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
        <div className="text-center max-w-md px-4" style={{ animation: "card-enter 0.3s ease-out both" }}>
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shadow-sm border border-primary-100/60">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center ring-4 ring-white">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-3">
            You&apos;re all set!
          </h1>
          <p className="text-gray-500 text-lg mb-8 leading-relaxed">
            <strong className="text-gray-700">{provider?.provider_name}</strong> is now linked to your account.
          </p>
          <button
            onClick={() => router.push(getSuccessRedirectUrl())}
            className="px-8 py-4 bg-primary-600 text-white text-base font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.99] transition-all shadow-sm min-h-[48px]"
          >
            {getSuccessButtonText()}
          </button>
        </div>
      </div>
    );
  }

  // Finalizing state
  if (step === "finalizing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
        <div className="text-center px-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // Dashboard state - render SmartDashboardShell with ActionCard
  if (!provider || !session) return null;

  return (
    <SmartDashboardShell
      provider={provider}
      onClaimClick={handleClaimClick}
      initialActionState={actionCardState}
      notificationData={notificationData}
      isSignedIn={!!user}
      preVerifiedEmail={preVerifiedEmail || undefined}
    />
  );
}
