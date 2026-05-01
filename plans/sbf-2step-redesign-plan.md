# Plan: SBF Redesign — 2-step embedded form + Pattern G results reveal + addressable /m/{token}

Created: 2026-04-30
Status: Not Started
Notion: [SBF redesign (P1)](https://app.notion.com/p/3525903a0ffe81338f59d5b5326b1796) · [sibling P2 — unify SBF results with care profile](https://app.notion.com/p/3525903a0ffe81a2b7a8c0e746ad35ae)
Copy log: [SBF Copy Variants DB](https://app.notion.com/p/ec27110d1c6a4cc1a76bdf991344f63d)

## Goal

Cut the embedded SBF on provider pages (`components/providers/BenefitsDiscoveryModule.tsx`) from 5 steps to 2 (care need → contact). Silently create the family profile via existing `/api/benefits/save-results` pipeline. Reveal matches in a Pattern G side-panel (desktop) / bottom-sheet (mobile) overlay, **without redirecting away from the provider page**. Same component renders at `/m/{token}` for direct access. Email or SMS — user picks. Three copy arms (`availability` / `loss` / `empathic`) replace the existing copy A/B.

## Success Criteria

- [ ] Embedded SBF on `/provider/[slug]` is 2 steps. No 5-step path remains in code.
- [ ] Care-need pickup rate ≥ 55% (currently 39%) within 4 weeks of ship.
- [ ] Contact-submission rate ≥ 15% of starts (currently 8.2%) within 4 weeks; clear win at 20%+, revert if <8%.
- [ ] Three copy arms live and tracked separately in admin/analytics.
- [ ] Per-card pickup data populated for all four care-need cards.
- [ ] After submit, user lands in the results overlay on the provider page (no `/welcome` redirect). Provider page scroll position preserved on dismiss.
- [ ] `/m/{token}` route renders the same component as a standalone page; tokens are unguessable, single-purpose, tied to the family profile.
- [ ] SMS path: user can toggle to phone, gets a Twilio-delivered short link to `/m/{token}`, with TCPA-compliant consent and STOP keyword honored.
- [ ] Email path: user gets a state-filtered starter list of 5–8 programs in the body (not a generic "your results saved" message), plus a magic link to `/m/{token}`. Bounces flagged via Resend webhook.
- [ ] Privacy policy updated to cover benefits-intake data flows; inline consent text shown at the contact step (email and SMS variants).
- [ ] No remaining writes to `metadata.benefits_results.answers` (the duplicate of flat metadata fields). Sibling P2 task closed.
- [ ] Notion `SBF Copy Variants` DB updated: `control` and `money_loss` rows moved to Archived with final numbers; new arms moved to Live.

## Tasks

### Phase 0: Pre-implementation verification (no code yet)

- [ ] **0.1** Sample SBF match output for ~10 representative TX/FL/CA care-need combinations
      - Files: scratch script or run `lib/benefits/match.ts` against fixtures
      - Verify: confirm the dollar values aggregate to $400+/month for typical cases. If they don't, soften Arm B's subhead to remove the dollar specificity (drop "$400–$900/month often goes unclaimed" in favor of "Help often goes unclaimed.").
      - Output: a brief note (5 lines) recording the sampled outputs. Update Arm B Notion row if we soften.

- [ ] **0.2** Confirm Twilio webhook coverage for STOP keyword + delivery events
      - Files: `app/api/whatsapp/webhook/route.ts`, `lib/twilio.ts`, search for any existing SMS inbound handler
      - Verify: there's a route that receives Twilio inbound messages and respects STOP/UNSUBSCRIBE. If missing, scope adding it (separate task in Phase 4).

- [ ] **0.3** Confirm Resend webhook → `email_webhook_events` table captures `email.bounced` and `email.complained`
      - Files: `lib/resend-events.ts`, `supabase/functions/resend-webhook/index.ts`, migration 051
      - Verify: events land in the table. Identify the join path from `email_webhook_events` to `business_profiles` (likely via the `to` email address or via `email_logs.recipient_id`).

### Phase 1: Database foundations

- [ ] **1.1** Migration: `057_benefits_results_tokens.sql`
      - Files: `supabase/migrations/057_benefits_results_tokens.sql`
      - Schema:
        ```sql
        CREATE TABLE benefits_results_tokens (
          token TEXT PRIMARY KEY,           -- short unguessable, 16-char base64url
          profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
          care_need TEXT NOT NULL,
          state_code TEXT NOT NULL,
          provider_slug TEXT,                -- the provider page they came from (for tie-in copy)
          match_count INT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          last_viewed_at TIMESTAMPTZ
        );
        CREATE INDEX ON benefits_results_tokens(profile_id);
        ```
      - Verify: `supabase migration up` runs cleanly.

- [ ] **1.2** Migration: `058_family_profile_contact_channels.sql`
      - Files: `supabase/migrations/058_family_profile_contact_channels.sql`
      - Adds to `business_profiles`:
        - `phone TEXT` (already may exist — check before adding)
        - `phone_validity TEXT CHECK (phone_validity IN ('unverified', 'delivered', 'failed'))`
        - `email_validity TEXT CHECK (email_validity IN ('unverified', 'delivered', 'bounced', 'complained'))`
        - `preferred_contact_channel TEXT CHECK (preferred_contact_channel IN ('email', 'sms')) DEFAULT 'email'`
      - Verify: existing rows backfill `email_validity = 'unverified'`, `preferred_contact_channel = 'email'`. Schema introspection matches.

- [ ] **1.3** Extend `provider_activity` (or `seeker_activity`) event allowlist for new event types
      - Files: `supabase/migrations/059_benefits_v3_event_types.sql`
      - Heeds memory `feedback_event_allowlist_needs_db_migration.md` — add CHECK-constraint extension for any new event names introduced (`care_need_selected`, `benefits_v3_started`, etc).
      - Verify: `grep -rn "provider_activity_event_type_check" supabase/migrations/` shows the new constraint covers all new event names.

### Phase 2: Backend — token issuance + storage cleanup

- [ ] **2.1** Token generation library: `lib/benefits-token.ts`
      - Files: new — `lib/benefits-token.ts`
      - Exports: `generateBenefitsToken()` (16-char base64url from crypto.randomBytes), `getResultBundle(token)` (joins token + profile + match preview).
      - Verify: unit-test the token: 1k tokens have 0 collisions, all match `/^[A-Za-z0-9_-]{16}$/`.

- [ ] **2.2** Update `/api/benefits/save-results/route.ts`
      - Files: `app/api/benefits/save-results/route.ts`
      - Changes:
        - Accept `null` for `age`, `medicaidStatus`, `incomeRange` (already does — verify).
        - **Drop the `metadata.benefits_results.answers` blob** (lines 244–254). Keep only `matchCount` + `completed_at` inside `benefits_results`. (Closes sibling P2.)
        - Accept new payload field `contactChannel: 'email' | 'sms'` and `phone?: string`.
        - For SMS path: skip Resend magic-link, queue Twilio SMS instead (Phase 4).
        - Generate a `benefits_results_tokens` row after profile resolved. Return `token` in the response.
        - Hardened email validation: regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) + ~15-line disposable-domain blocklist. New file: `lib/email-validation.ts`.
        - Phone validation: E.164 format, US-default country code, simple length check.
      - Verify: existing 5-step still works against this endpoint (during transition); new payload (with `contactChannel: 'sms'`) creates the profile, generates token, queues SMS.

- [ ] **2.3** Email-validation module
      - Files: new — `lib/email-validation.ts`
      - Exports: `isValidEmail(string): { valid: boolean; reason?: 'malformed' | 'disposable' }`. Disposable list as a small static array (mailinator/guerrillamail/sharklasers/yopmail/tempmail/etc).
      - Verify: unit tests for known-valid, known-disposable, malformed, edge-case inputs.

- [ ] **2.4** Resend bounce handler — flag email_validity post-hoc
      - Files: `lib/resend-events.ts`, `supabase/functions/resend-webhook/index.ts` (mirror)
      - Changes: when `email.bounced` or `email.complained` event arrives for an address that matches a `business_profiles.email`, update `email_validity` to `'bounced'` or `'complained'`.
      - Verify: send a test email to a bounce address (e.g., `bounce@simulator.amazonses.com` if Resend supports it, otherwise an obviously-wrong address) and confirm the profile gets flagged.

### Phase 3: New embedded module + variant infra

- [ ] **3.1** Variant rename: `lib/analytics/variant.ts`
      - Files: `lib/analytics/variant.ts`
      - Changes: `BenefitsVariant = "availability" | "loss" | "empathic"`, djb2 mod 3, drop `control`/`money_loss` types. Update any imports.
      - Verify: TypeScript compiles with no remaining references to old type values.

- [ ] **3.2** Rewrite `components/providers/BenefitsDiscoveryModule.tsx` for 2 steps
      - Files: `components/providers/BenefitsDiscoveryModule.tsx`
      - Structure:
        - Step 1: `care-need` — 4 cards (reordered: Paying for care, In-home care, Memory & medical care, Caregiver & social support) with refined descriptions and same icons.
        - Step 2: `contact` — single field, default email, inline channel toggle "Or text me instead →".
        - Variant H2/Sub branches per the three locked-in arms.
        - Trust strip: `Free · Under a minute · Never sold to insurers · {N} {state} programs`.
        - On submit: POST to `/api/benefits/save-results` with new payload, then trigger results overlay (Phase 4) — no `setStep("results")` inline reveal, no redirect.
        - Inline consent text below the contact field (email vs SMS variant).
      - Funnel events: existing per-step events stay; add `care_need_selected` property to the `benefits_step_completed` event when stepName === `'care-need'`.
      - Delete: all 5-step state + age/financial steps + previous results-step rendering. Lean on git for revert.
      - Verify: form completes end-to-end on dev — both email and SMS paths — and produces a valid token in the response.

- [ ] **3.3** Channel toggle micro-interaction
      - Files: same as 3.2 (or split into `components/providers/BenefitsContactStep.tsx` if module gets too large)
      - UI: toggle text below the field swaps between "Or text me instead →" and "Or use email →". Field type swaps (input type=email ↔ tel). Placeholder + button label stay outcome-anchored ("See my matches").
      - SMS consent: explicit TCPA-compliant text, e.g., *"By tapping See my matches, you agree to receive a one-time text from Olera. Reply STOP to opt out. Msg & data rates may apply."*
      - Email consent: shorter, e.g., *"We'll send your matches and a magic link to log back in. We never share your email."*
      - Verify: visually inspect both states on mobile + desktop; consent text is legible and accessible.

### Phase 4: Results panel/sheet — unified component

- [ ] **4.1** Build `ResultsSheet` shell component
      - Files: new — `components/benefits/ResultsSheet.tsx`
      - Behavior:
        - Mobile (<768px): bottom sheet, slides up 300–400ms ease-out, drag-down to dismiss, Esc dismiss.
        - Desktop (≥768px): right-side panel, ~480px wide, slides in 300–400ms, backdrop blur + dim, click-backdrop / X / Esc to dismiss.
        - On dismiss: provider page scroll position is preserved (use `scrollIntoView` on a ref sentinel, or simply don't manipulate scroll).
      - Animation: framer-motion if already in deps, else CSS transitions. Check `package.json` first.
      - Accessibility: `role="dialog"`, `aria-modal="true"`, focus trap, escape handling, body-scroll lock while open.
      - Verify: open/close state transitions are smooth; keyboard nav works; mobile drag-to-dismiss works on iOS Safari.

- [ ] **4.2** ResultsSheet content — editorial layout
      - Files: same component or split into `ResultsSheetContent.tsx`
      - Hero: *"Your family may qualify for {N} programs in {state}."* — display font, generous spacing.
      - Personalized line: *"Based on what you shared — {careNeedLabel}."*
      - Optional contextual line if matches overlap with provider services: *"Some of these may help cover services at {Provider X}."* (See task 4.3.)
      - Match cards: program name (display font), 1-line plain-English description, *"why this matches"* tag, savings range if `structuredEligibility.incomeTable` indicates one, "Learn more" link → existing `/benefits/{state}/{programId}`.
      - Footer: *"We saved these — magic link sent to {email/phone} so you can come back."*
      - CTAs: "Continue exploring {Provider X}" (dismisses overlay) + "See full list at olera.care" (links to `/welcome` — opt-in, not forced).
      - Style: Perena/Notion-grade typography; generous white space; no marketing-form smell.
      - Verify: visual review on mobile + desktop. Compare against Whispr Flow / Perena reference screenshots.

- [ ] **4.3** Provider tie-in helper
      - Files: new — `lib/benefits/provider-tie-in.ts`
      - Logic: given the matched program list + the provider's care-type metadata, return `null` or a contextual phrase like *"Two of these may help cover services at {Provider X}."* Match heuristic: programs whose tags overlap with the provider's `care_types` array.
      - Verify: returns `null` for no overlap; returns a non-null phrase for at least one realistic test case (e.g., memory-care provider + dementia-related programs).

- [ ] **4.4** Wire submit → ResultsSheet open
      - Files: `components/providers/BenefitsDiscoveryModule.tsx` (state hook), top-level provider page or layout to host the sheet
      - On successful POST: set sheet state open, pass token + match data to `ResultsSheet`, fire `benefits_v3_completed` analytics event.
      - Verify: form → submit → sheet appears with matches; dismissal returns user to provider page.

### Phase 5: `/m/{token}` standalone page

- [ ] **5.1** Route handler: `app/m/[token]/page.tsx`
      - Files: new — `app/m/[token]/page.tsx` (server component)
      - Behavior:
        - Look up token in `benefits_results_tokens`; 404 if not found.
        - Fetch family profile (matches, care need, state, provider slug).
        - Update `last_viewed_at`.
        - Render the same `ResultsSheet` component, with a "page" shell (no overlay backdrop, full viewport, persistent header/footer).
      - Auth: token IS the auth — no login wall on this URL. Optionally write a session cookie if profile has a valid auth.users link, so user lands logged-in for cross-Olera navigation.
      - Verify: hit `/m/{validToken}` in browser → renders the matches; bad/expired token → 404.

- [ ] **5.2** Deep-link integration with welcome email/SMS
      - Files: `app/api/benefits/save-results/route.ts` (welcome email body), Twilio SMS body in same route or `lib/twilio.ts`
      - Update both message bodies to point to `/m/{token}` instead of generic `/portal`.
      - Verify: emails contain `https://olera.care/m/{token}` link that resolves correctly.

### Phase 6: Notification content upgrade

- [ ] **6.1** Welcome email body — state-filtered starter list
      - Files: `app/api/benefits/save-results/route.ts` (the inline HTML around line 424)
      - Replace generic "your results saved" body with an editorial layout containing:
        - Greeting (uses `displayName` or generic if missing).
        - "We found {N} programs in {state} that may help with {careNeedLabel}."
        - 5–8 specific matched programs as a list — name, 1-line description, savings hint, `/benefits/{state}/{programId}` link.
        - Footer with magic link to `/m/{token}` ("View your saved list anytime").
      - Inline-styled HTML (email-safe). Test in Litmus or Email on Acid if access; otherwise verify in Gmail + Apple Mail manually.
      - Verify: email lands in inbox (not spam) for a real address, renders correctly.

- [ ] **6.2** SMS message body
      - Files: `lib/twilio.ts` (or new `lib/benefits-sms.ts`)
      - Body: *"Olera: We found {N} care benefit programs in {state} for your family. View: olera.care/m/{token}. Reply STOP to opt out."*
      - Verify: Twilio test number receives the message with the correct deep link; STOP reply suppresses future messages (Phase 0.2 handler).

### Phase 7: Privacy + consent

- [ ] **7.1** Privacy policy updates
      - Files: `app/privacy/page.tsx` (or wherever the policy lives)
      - Add language covering: benefits-intake data collection (care need, state, IP-derived geo, contact info), purpose (matching to programs, follow-up communications), retention, sharing (none with insurers), opt-out.
      - Verify: legal review or self-review with the strictest reading. TJ confirms policy reads honestly.

- [ ] **7.2** Inline consent text at contact step
      - Files: `components/providers/BenefitsDiscoveryModule.tsx`
      - Email variant: *"We'll send your matches and a magic link to come back. We never share your email."*
      - SMS variant: *"By tapping See my matches, you agree to receive a one-time text from Olera at this number. Reply STOP to opt out. Msg & data rates may apply."*
      - Both link to the privacy policy.
      - Verify: text is legible (not 9px gray-on-gray); accessible to screen readers.

### Phase 8: Admin analytics + observability

- [ ] **8.1** Per-card pickup display on `/admin/analytics`
      - Files: `app/admin/analytics/page.tsx`
      - Add a small section in the Benefits Intake Funnel showing the breakdown: Paying for care X · In-home care Y · Memory & medical Z · Caregiver & social W. Use the new `care_need_selected` property.
      - Verify: counts match raw events for a known time window.

- [ ] **8.2** Three-arm variant comparison on `/admin/analytics`
      - Files: same as 8.1
      - Add a section showing each arm's: Sessions assigned · Step 1 pickup % · Contact submitted %. Mirrors the existing copy A/B section but adapted for 3 arms.
      - Verify: numbers reconcile with the Notion `SBF Copy Variants` DB after the test runs for a few days.

- [ ] **8.3** Slack alert for V3 completion
      - Files: `lib/slack.ts`, `/api/benefits/save-results/route.ts`
      - Update the existing `slackBenefitsCompleted` to indicate channel (email vs SMS) and include the `/m/{token}` link.
      - Verify: a successful submission fires a Slack alert with the correct fields.

### Phase 9: Notion + cleanup

- [ ] **9.1** Update Notion `SBF Copy Variants` rows
      - Files: none — Notion via MCP
      - Set `control (legacy)` and `money_loss (legacy)` to `Status: Archived` with `Archived On` = ship date and final session/conversion numbers.
      - Set `availability` / `loss` / `empathic` to `Status: Live` with `Started` = ship date.
      - Verify: DB rows reflect ship.

- [ ] **9.2** Delete dead 5-step code paths
      - Files: anywhere that referenced `BenefitsVariant = "control" | "money_loss"`, the `setStep("age")` / `setStep("financial")` paths, the inline `setStep("results")` handler.
      - Confirm no orphaned references via TypeScript compile + grep.
      - Verify: build passes; no dead imports.

- [ ] **9.3** Sample provider-page smoke test
      - Files: none — manual
      - Open 3 different provider pages on staging (TX, FL, CA). Run the 2-step flow end-to-end on email AND SMS for each. Confirm: token issued, profile created, results overlay opens, dismissal restores scroll, follow-up message arrives at the chosen channel, `/m/{token}` works.
      - Verify: TJ-grade walkthrough — I do this myself before requesting review.

## Risks

- **R1: Twilio cost spike.** Each SMS costs ~$0.008. If 50% of users pick SMS at scale, monthly cost grows linearly. *Mitigation:* monitor send volume in admin/analytics; cap to 1 SMS per user per 24h server-side; degrade to email if Twilio errors.
- **R2: Bottom-sheet drag conflicts on iOS Safari.** Native momentum scroll can fight a custom drag handler. *Mitigation:* use `touch-action: pan-y` strategically; test on real iOS device, not just simulator.
- **R3: `/m/{token}` token leakage via referer headers.** A user clicks "Learn more" on a program — the program's site sees `referer: olera.care/m/{token}`, leaking the token. *Mitigation:* set `Referrer-Policy: same-origin` on the `/m/[token]` page response.
- **R4: TCPA compliance gap.** SMS consent text must be exact and STOP keyword must be honored within 24h. *Mitigation:* include consent text verbatim from FCC examples; verify Phase 0.2 STOP handler routes to the correct profile flag.
- **R5: Match list returns <3 programs for niche care needs.** A user picks "Caregiver & social support" in a state with few programs and gets a thin list, eroding trust. *Mitigation:* if `matchCount < 3`, expand match radius (drop the careNeed filter, return state-only) and label the bonus matches as *"Other programs in {state}"*.
- **R6: Variant attribution quirk persists.** The current attribution-fires-at-care-need-step issue may carry over. *Mitigation:* fire `benefits_v3_started` on module-render (not on first interaction) so `started` count = sessions, not pickups.
- **R7: Three-arm A/B is underpowered at current traffic.** ~16 starts/arm/14 days. Will be directional only. *Mitigation:* accept this going in; carry test for 4–6 weeks; supplement with qualitative checks (do users understand the H2? micro-survey post-submit?).

## Notes

- The `/welcome` page stays untouched. It's still where the magic link lands users (and where "See full list" CTA points). Just no longer the forced redirect target.
- Standalone `/benefits/finder` stays untouched. Different surface, different intent. The 5-step lives on there.
- "No gated revert" decided — git history is our revert, not a feature flag. Acceptable risk for a 6-person team given the rollback cost (~5min Vercel deploy + a `git revert`).
- SMS path uses existing `lib/twilio.ts`; no new infra. WhatsApp infra also exists (`lib/whatsapp.ts`, `app/api/whatsapp/webhook`) — could be a fast-follow channel after we see SMS engagement numbers.
- Pre-cutover: Phases 1, 2, 4, 5, 6 ship silently in main as foundations; nothing user-facing changes. Hard cutover happens at Phase 3 ship.
- This plan creates account silently — heeds memory `feedback_one_click_ux_principles.md` (notification card always visible, no claim/verify UI, auth invisible).

## Pre-cutover ship order (each = its own PR)

1. **PR 1**: Phase 0 verification report + Phase 1 migrations (057, 058, 059)
2. **PR 2**: Phase 2 — token lib + save-results updates + email-validation module + Resend bounce handler
3. **PR 3**: Phase 4 — `ResultsSheet` component (silent — not yet wired to anything live)
4. **PR 4**: Phase 5 — `/m/[token]` route (silent — no traffic yet)
5. **PR 5**: Phase 6 — welcome email + SMS body upgrades (improves current 5-step's email immediately)
6. **PR 6 — CUTOVER**: Phase 3 (new module replaces old) + Phase 7 (consent + privacy) + ResultsSheet wired to submit
7. **PR 7**: Phase 8 — admin analytics view updates
8. **PR 8** (post-launch, ~2 weeks in): Phase 9 — Notion archival + dead-code cleanup
