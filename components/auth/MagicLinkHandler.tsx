/**
 * Guest redirect storage for magic link flow.
 *
 * When a guest creates a connection, we store where they should be redirected
 * after clicking the magic link. This persists in localStorage so it survives
 * across browser sessions (e.g., when user clicks link from email app).
 */

const GUEST_REDIRECT_KEY = "olera_guest_redirect";
const CLAIM_TOKEN_KEY = "olera_claim_token";

/**
 * Store the redirect destination before user clicks magic link.
 * Call this when creating a guest connection.
 * Uses localStorage so it persists across browser sessions.
 */
export function storeGuestRedirect(redirect: string, claimToken: string) {
  try {
    localStorage.setItem(GUEST_REDIRECT_KEY, JSON.stringify({ redirect, claimToken }));
    // Also store claim token separately for backup
    localStorage.setItem(CLAIM_TOKEN_KEY, claimToken);
    console.log("[storeGuestRedirect] Stored redirect:", redirect);
  } catch {
    // localStorage unavailable
  }
}
