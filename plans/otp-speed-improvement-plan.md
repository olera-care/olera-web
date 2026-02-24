# Plan: Improve Speed of OTP Verification

Created: 2026-02-24
Status: Not Started
Owner: TJ
Priority: P1

## Goal

Cut post-OTP-verification latency from ~1600ms to ~400-700ms by eliminating redundant network calls in `handleAuthComplete()`.

## Success Criteria

- [ ] Returning user (sign-in OTP): modal closes within ~700ms of clicking "Verify" (down from ~1600ms)
- [ ] New user (sign-up OTP): post-auth onboarding step appears within ~400ms of clicking "Verify"
- [ ] No regressions: password sign-in still works correctly
- [ ] No regressions: AuthProvider still loads full account data in background
- [ ] Console timers (`[olera] fetchAccountData`) confirm data is loaded once (via AuthProvider), not twice

## Problem Analysis

After the user enters their OTP code, `handleVerifyOtp()` runs 6 sequential network calls:

```
verifyOtp()           ~300ms  (required)
setSession()          ~100ms  (required)
refreshAccountData()  ~600ms  (REDUNDANT - AuthProvider SIGNED_IN listener does this)
  ├─ accounts query
  └─ profiles + memberships query
getUser()             ~300ms  (REDUNDANT - we just verified the OTP)
accounts query        ~300ms  (REDUNDANT - already fetched above)
                     --------
Total:               ~1600ms
```

The AuthProvider's `onAuthStateChange` SIGNED_IN listener already calls `fetchAccountData()` when `setSession()` fires. So `handleAuthComplete()` is duplicating that work, then doing two more redundant calls on top.

## Tasks

### Phase 1: Eliminate redundant calls in handleAuthComplete

- [ ] **1. Restructure `handleAuthComplete()` to skip `refreshAccountData()` and `getUser()`**
  - File: `components/auth/UnifiedAuthModal.tsx` (lines 403-436)
  - Change:
    - Remove `await refreshAccountData()` — the SIGNED_IN listener handles this
    - Replace `getUser()` with `getSession()` (local read, no network call)
    - Keep the single `accounts.onboarding_completed` query (lightweight, needed for routing)
  - Verify: Add `console.time("[otp] handleAuthComplete")` / `console.timeEnd` and confirm <400ms

- [ ] **2. Short-circuit for new signups**
  - File: `components/auth/UnifiedAuthModal.tsx` (same function)
  - Change: When `otpContext === "signup"`, skip the accounts query entirely — new users always need onboarding, and the DB trigger may not have created the row yet anyway
  - Verify: Sign up with new email + OTP → post-auth screen appears instantly (~0ms for routing logic)

- [ ] **3. Short-circuit for provider intent**
  - File: `components/auth/UnifiedAuthModal.tsx` (same function)
  - Change: When `options.intent === "provider"`, skip the accounts query — route straight to `/provider/onboarding`
  - Verify: Provider sign-up flow redirects without delay

### Phase 2: Verify no regressions

- [ ] **4. Test returning user sign-in via OTP**
  - Verify: Sign in with existing account via OTP → modal closes, AuthProvider loads data in background, portal works
  - Check: `[olera] fetchAccountData` appears once in console (from SIGNED_IN listener), not twice

- [ ] **5. Test returning user sign-in via password**
  - Verify: Password sign-in still calls `handleAuthComplete()` → modal closes correctly
  - Note: Password sign-in uses main client (not implicit), so SIGNED_IN fires from `signInWithPassword()` directly

- [ ] **6. Test new user sign-up via OTP**
  - Verify: Sign up → OTP → post-auth onboarding appears → complete onboarding → lands on correct page

## Implementation Detail

**Before** (`handleAuthComplete`, current):
```typescript
const handleAuthComplete = async () => {
  await refreshAccountData();                    // ~600ms, redundant

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();  // ~300ms, redundant
    if (user) {
      const { data: acct } = await supabase
        .from("accounts")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single();                                // ~300ms
      if (acct?.onboarding_completed) {
        onClose();
        return;
      }
    }
  }

  if (options.intent === "provider") {
    onClose();
    router.push("/provider/onboarding");
    return;
  }

  setStep("post-auth");
};
```

**After** (proposed):
```typescript
const handleAuthComplete = async () => {
  // AuthProvider's SIGNED_IN listener handles refreshAccountData()
  // automatically when setSession() fires — no need to duplicate here.

  // New signups always need onboarding — skip DB check entirely.
  // (The accounts row may not even exist yet due to DB trigger delay.)
  if (otpContext === "signup") {
    if (options.intent === "provider") {
      onClose();
      router.push("/provider/onboarding");
      return;
    }
    setStep("post-auth");
    return;
  }

  // Provider intent — route straight to onboarding wizard
  if (options.intent === "provider") {
    onClose();
    router.push("/provider/onboarding");
    return;
  }

  // Returning user (sign-in) — one lightweight query to check onboarding
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: acct } = await supabase
        .from("accounts")
        .select("onboarding_completed")
        .eq("user_id", session.user.id)
        .single();

      if (acct?.onboarding_completed) {
        onClose();
        return;
      }
    }
  }

  // Returning user without completed onboarding — show post-auth
  setStep("post-auth");
};
```

## Risks

| Risk | Mitigation |
|------|-----------|
| `getSession()` might not have the session immediately after `setSession()` | `setSession()` is awaited in `handleVerifyOtp` before `handleAuthComplete` is called, so session should be available. If flaky, fall back to `getUser()` with a comment explaining why. |
| Password sign-in path doesn't set `otpContext` | `otpContext` defaults to `"signin"`, so the signup short-circuit won't trigger for password logins. They'll still hit the lightweight accounts query — still faster than before. |
| AuthProvider SIGNED_IN listener might not fire | It fires reliably for both `setSession()` and `signInWithPassword()`. We can verify via console logs. |
| Accounts row not found for returning users | `.single()` returns null → `acct?.onboarding_completed` is falsy → falls through to `setStep("post-auth")`, which is a safe fallback. |

## Notes

- The OTP email delivery speed (secondary concern) is controlled by Supabase's email provider — not something we can optimize in our codebase. If it becomes a priority, consider switching to a custom SMTP provider (e.g., Resend, SendGrid) via Supabase dashboard.
- `otpContext` state is already tracked: `"signup"` for new signups, `"signin"` for returning users requesting a code. This is the reliable discriminator.
- This fix benefits ALL auth paths (OTP sign-in, OTP sign-up, password sign-in) since they all flow through `handleAuthComplete()`.
