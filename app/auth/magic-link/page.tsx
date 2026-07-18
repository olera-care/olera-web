"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getDeferredAction, clearDeferredAction } from "@/lib/deferred-action";
import { getAnonSaves } from "@/lib/saved-providers";
import { Suspense } from "react";

/**
 * /auth/magic-link
 *
 * Client-side handler for magic link implicit flow.
 * When Supabase redirects with #access_token=..., this page:
 * 1. Extracts tokens from the hash fragment
 * 2. Sets the session using supabase.auth.setSession()
 * 3. Ensures account exists (calls ensure-account API)
 * 4. Redirects to the intended destination
 */

function MagicLinkHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleMagicLink() {
      try {
        // Get the intended destination from query params
        const next = searchParams.get("next") || "/";

        // Check for hash fragment with tokens
        const hash = window.location.hash;
        if (!hash || !hash.includes("access_token")) {
          // No tokens in hash - might be expired link or direct visit
          // Check if already authenticated
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            // Already logged in, redirect to destination
            router.refresh();
            router.replace(next);
            return;
          }

          // No session and no tokens - link is expired or invalid
          // Redirect to browse page (family landing) with context
          // Better UX than showing error - they can sign in naturally from there
          console.log("[magic-link] Link expired or invalid, redirecting to browse page");
          router.replace("/browse");
          return;
        }

        // Parse tokens from hash fragment
        // Format: #access_token=xxx&refresh_token=xxx&expires_in=xxx&token_type=bearer&type=magiclink
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (!accessToken) {
          setError("Invalid link format. Please request a new one.");
          setStatus("error");
          setTimeout(() => router.replace("/"), 3000);
          return;
        }

        // Set the session
        const supabase = createClient();
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (sessionError || !data.session) {
          console.error("Failed to set session:", sessionError);
          setError("Failed to sign in. Please try again.");
          setStatus("error");
          setTimeout(() => router.replace("/"), 3000);
          return;
        }

        // Ensure account exists (same as OAuth callback)
        // Retry once on failure to handle transient network issues
        let isNewUser = false;
        let accountReady = false;
        for (let attempt = 0; attempt < 2 && !accountReady; attempt++) {
          try {
            const res = await fetch("/api/auth/ensure-account", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                claimToken: searchParams.get("token") || null,
              }),
            });
            if (res.ok) {
              const { account } = await res.json();
              isNewUser = account?.onboarding_completed === false;
              accountReady = true;
            } else {
              console.error(`[magic-link] ensure-account failed (attempt ${attempt + 1}):`, res.status);
              if (attempt === 0) await new Promise(r => setTimeout(r, 500));
            }
          } catch (err) {
            console.error(`[magic-link] ensure-account error (attempt ${attempt + 1}):`, err);
            if (attempt === 0) await new Promise(r => setTimeout(r, 500));
          }
        }

        // Handle save nudge signup: create family profile + track conversion
        // If account creation failed, skip this block and let client-side fallback handle it
        // (deferred action will persist in localStorage)
        try {
          const deferredAction = getDeferredAction();
          console.log("[magic-link-debug] Deferred action:", deferredAction, "accountReady:", accountReady, "isNewUser:", isNewUser);

          if (deferredAction?.action === "save" && accountReady) {
            let profileCreated = false;
            let isPermanentFailure = false;

            // Create family profile for save nudge signups
            // ensure-account doesn't create profiles without claimToken
            try {
              const profileRes = await fetch("/api/auth/create-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  intent: "family",
                  displayName: data.session.user.user_metadata?.full_name
                    || data.session.user.user_metadata?.name
                    || data.session.user.email?.split("@")[0]
                    || "My Family",
                }),
              });

              if (profileRes.ok) {
                profileCreated = true;
              } else {
                const errorData = await profileRes.json().catch(() => ({}));
                if (errorData.code === "ACCOUNT_TYPE_MISMATCH") {
                  // Permanent failure - user has provider/caregiver profile with this email
                  // Can't create family profile, clear deferred action to prevent retry loops
                  console.warn("[magic-link] Cannot create family profile - account type mismatch");
                  isPermanentFailure = true;
                } else if (profileRes.status === 409) {
                  // Profile already exists - treat as success for tracking purposes
                  profileCreated = true;
                } else {
                  // Transient failure (500, network) - don't clear deferred action
                  // Client-side fallback will retry
                  console.error("[magic-link] create-profile failed:", profileRes.status, errorData);
                }
              }
            } catch (err) {
              // Network error - don't clear deferred action, let fallback retry
              console.error("[magic-link] create-profile network error:", err);
            }

            // Track conversion if profile was created (or already existed) and user is new
            console.log("[magic-link-debug] profileCreated:", profileCreated, "isNewUser:", isNewUser);
            if (profileCreated && isNewUser) {
              const anonSaves = getAnonSaves();
              console.log("[magic-link-debug] anonSaves count:", anonSaves.length);
              if (anonSaves.length > 0) {
                console.log("[magic-link-debug] Firing conversion tracking...");
                // Track conversion - use keepalive to ensure request completes during navigation
                fetch("/api/activity/track", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    actor_type: "family",
                    event_type: "save_nudge_converted",
                    metadata: {
                      saved_count: anonSaves.length,
                      saved_provider_names: anonSaves.map((s) => s.name),
                      user_email: data.session.user.email || "unknown",
                      user_name: data.session.user.user_metadata?.full_name || data.session.user.email?.split("@")[0] || "User",
                      signup_method: "magic_link",
                    },
                  }),
                  keepalive: true,
                }).catch(() => {});
              }
            }

            // Only clear deferred action if we succeeded OR hit a permanent failure
            // Transient failures should preserve deferred action for client-side retry
            if (profileCreated || isPermanentFailure) {
              clearDeferredAction();
            }
          }
        } catch {
          // Non-blocking — conversion tracking failure should not affect auth
          // Deferred action preserved for client-side fallback
        }

        // Clear the hash from URL (for cleaner experience)
        window.history.replaceState(null, "", window.location.pathname + window.location.search);

        setStatus("success");

        // Track email click if this visit came from an email link
        try {
          const nextUrl = new URL(next, window.location.origin);
          const ref = nextUrl.searchParams.get("ref");
          const eid = nextUrl.searchParams.get("eid");
          if (ref === "email" && eid) {
            // Determine if this is a family or provider destination
            const dest = nextUrl.pathname;
            const isFamilyDest = dest.startsWith("/portal/") ||
              dest.startsWith("/browse") ||
              dest.startsWith("/welcome") ||
              dest.startsWith("/review/");

            if (isFamilyDest) {
              // Family click — need profile_id from session
              // Fetch active profile from account (fire-and-forget)
              fetch("/api/portal/profile")
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                  const profileId = data?.profile?.id;
                  if (profileId) {
                    fetch("/api/activity/track", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        actor_type: "family",
                        profile_id: profileId,
                        event_type: "email_click",
                        email_log_id: eid,
                        metadata: { source: "magic_link", destination: next },
                      }),
                    }).catch(() => {});
                  }
                })
                .catch(() => {});
            } else {
              // Provider click (existing behavior)
              const pathParts = dest.split("/");
              const providerIdx = pathParts.indexOf("provider");
              const providerSlug = providerIdx >= 0 ? pathParts[providerIdx + 1] : null;
              const action = nextUrl.searchParams.get("action");
              const emailTypeMap: Record<string, string> = {
                lead: "connection_request",
                review: "new_review",
              };
              fetch("/api/activity/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  provider_id: providerSlug || "unknown",
                  event_type: "email_click",
                  email_log_id: eid,
                  email_type: action ? emailTypeMap[action] || action : null,
                  metadata: { source: "magic_link", destination: next },
                }),
              }).catch(() => {}); // Fire-and-forget
            }
          }
        } catch {
          // Non-blocking — tracking failure should never affect auth flow
        }

        // Track lead_opened for providers landing on specific lead pages
        // IMPORTANT: Only track when there's a specific connection_id in the URL.
        // Landing on /provider/connections without a connection_id should NOT count
        // as "viewed" - that happens when provider actually opens a lead drawer.
        try {
          const nextUrl = new URL(next, window.location.origin);
          const dest = nextUrl.pathname;

          // Extract connection_id from URL params - required for tracking
          const connectionId = nextUrl.searchParams.get("id") ||
            nextUrl.searchParams.get("actionId") ||
            null;

          // Only track lead_opened if we have a specific connection_id
          // Without it, we'd mark ALL provider's leads as "viewed" which is incorrect
          if (connectionId) {
            // Check if destination is provider connections page with specific lead
            const isProviderConnections = dest === "/provider/connections";
            // Check if destination is provider inbox (role=provider in query)
            const isProviderInbox = dest === "/portal/inbox" &&
              nextUrl.searchParams.get("role") === "provider";
            // Check if destination is provider onboard with lead/message action
            const isOnboardLead = dest.match(/^\/provider\/[^/]+\/onboard/) &&
              ["lead", "message"].includes(nextUrl.searchParams.get("action") || "");

            if (isProviderConnections || isProviderInbox || isOnboardLead) {
              // Use server-side endpoint to track lead_opened
              // This endpoint gets the provider profile from the authenticated session
              fetch("/api/activity/track-lead-opened", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  connection_id: connectionId,
                  source: "magic_link",
                  destination: next,
                }),
                keepalive: true,
              }).catch(() => {});

              console.log("[magic-link] Tracking lead_opened for connection:", connectionId);
            }
          }
        } catch {
          // Non-blocking — tracking failure should never affect auth flow
        }

        // Check for pending connection info from guest connection flow
        let pendingConnection: { connectionId: string; providerSlug: string } | null = null;
        try {
          const stored = localStorage.getItem("olera_pending_connection");
          if (stored) {
            pendingConnection = JSON.parse(stored);
            localStorage.removeItem("olera_pending_connection");
          }
        } catch {
          // localStorage not available
        }

        // Determine final destination
        // If we have pending connection info, include it in the welcome URL
        // New user (onboarding_completed=false) + no deferred action → /welcome
        const hasDeferredAction = !!getDeferredAction()?.action;
        let finalDestination: string;

        if (pendingConnection) {
          // Guest connection flow - go to welcome with connection info
          finalDestination = `/welcome?connection=${pendingConnection.connectionId}&provider=${pendingConnection.providerSlug}`;
        } else if (isNewUser && !hasDeferredAction) {
          finalDestination = `/welcome?next=${encodeURIComponent(next)}`;
        } else {
          finalDestination = next;
        }

        // Force Next.js to re-render with new auth state before navigation
        // This ensures the Navbar and other components see the session immediately
        router.refresh();
        router.replace(finalDestination);
      } catch (err) {
        console.error("Magic link handler error:", err);
        setError("Something went wrong. Please try again.");
        setStatus("error");
        setTimeout(() => router.replace("/"), 3000);
      }
    }

    handleMagicLink();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        {status === "processing" && (
          <>
            <div className="w-12 h-12 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Signing you in...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait a moment</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">Signed in!</p>
            <p className="text-sm text-gray-500 mt-1">Redirecting...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">Sign in failed</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <p className="text-xs text-gray-400 mt-2">Redirecting to home...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-12 h-12 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MagicLinkHandler />
    </Suspense>
  );
}
