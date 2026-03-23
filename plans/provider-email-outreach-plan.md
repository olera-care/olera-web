# Plan: Provider Email Outreach Revamp

Created: 2026-03-22
Status: Complete
Notion: https://www.notion.so/32c5903a0ffe8020860fe6a90e3660d6

## Goal

Rewrite all 3 provider-facing email templates from cold notifications to warm, trust-building emails that introduce Olera, convey value, and include off-ramps — so providers who don't know Olera still engage.

## Problem

All 3 provider-facing emails share the same pattern: "[Person] did [thing] on Olera" + button. No context about who Olera is, why they're getting this email, or what value responding creates. Providers who've never heard of Olera will ignore or distrust these.

## Emails in Scope

| # | Template | File:Line | Subject (current) | Trigger |
|---|----------|-----------|-------------------|---------|
| 1 | `questionReceivedEmail` | `lib/email-templates.tsx:306` | "New question on your Olera page" | Family asks question on provider profile |
| 2 | `connectionRequestEmail` | `lib/email-templates.tsx:73` | "New care inquiry" | Family sends care inquiry to provider |
| 3 | `newReviewEmail` | `lib/email-templates.tsx:282` | "You received a new review!" | Family leaves review on provider profile |

## Design Principles (from Notion task)

- **Professional, warm, clear** — no fluff, no lengthy pitches
- **Build trust** — briefly introduce Olera (NIH-backed senior care platform)
- **Show value** — responding showcases expertise to families actively searching
- **Off-ramp** — link to manage preferences / request removal
- **Forward prompt** — if wrong contact, ask to forward to right person
- Scannable in 10 seconds — short paragraphs, clear hierarchy

## Email Structure (shared across all 3)

Each email follows this anatomy:

```
1. HEADER        — Olera logo (existing layout wrapper)
2. HEADLINE      — Warm, specific to the action (not generic "New X!")
3. TRUST INTRO   — One line: "Olera is an NIH-backed platform helping families find trusted senior care."
4. CONTEXT       — What happened: who did what, on which page
5. CONTENT BLOCK — The question / inquiry message / review (styled block)
6. VALUE PROP    — Why responding matters (1 sentence)
7. PRIMARY CTA   — "Answer this question" / "View inquiry" / "See your review"
8. ECOSYSTEM     — Soft nudge: "Want to manage your profile? Claim your page →"
9. OFF-RAMP      — "Not the right contact? Forward this to the right person."
                   "Prefer not to be listed? Manage preferences →"
10. FOOTER       — Existing footer (© Olera)
```

## Success Criteria

- [ ] All 3 templates rewritten with trust intro, value prop, off-ramp, and forward prompt
- [ ] Subject lines updated to be warmer and more specific
- [ ] Off-ramp links point to existing `/for-providers/removal-request/[slug]` page
- [ ] No functional changes to send logic — template-only changes
- [ ] Existing `layout()` and `button()` helpers reused (no structural changes)
- [ ] `npm run build` passes with zero errors

## Tasks

### Phase 1: Shared Helpers
- [ ] 1. Add a reusable `trustIntro()` helper in `lib/email-templates.tsx`
      - One-liner about Olera (NIH-backed, families finding trusted senior care)
      - Returns an HTML string, same pattern as `button()`
      - Also add a `secondaryLink(label, href)` helper for off-ramp/ecosystem links (muted style, not a button)
      - Files: `lib/email-templates.tsx`
      - Verify: Build passes, helpers are importable

### Phase 2: Rewrite Templates
- [ ] 2. Rewrite `questionReceivedEmail` (line 306)
      - Subject: "A family has a question about {providerName}"
      - Add trust intro, value prop ("Families are actively evaluating your services"), off-ramp, forward prompt
      - Add `providerSlug` param for removal-request link
      - CTA: "Answer this question" → links to provider portal
      - Files: `lib/email-templates.tsx`
      - Depends on: 1
      - Verify: Build passes

- [ ] 3. Rewrite `connectionRequestEmail` (line 73)
      - Subject: "A family is looking for care from {providerName}"
      - Add trust intro, value prop ("This family is actively searching — a timely response makes all the difference")
      - Add `providerSlug` param for removal-request link
      - CTA: "View care inquiry"
      - Files: `lib/email-templates.tsx`
      - Depends on: 1
      - Verify: Build passes

- [ ] 4. Rewrite `newReviewEmail` (line 282)
      - Subject: "{reviewerName} left a review for {providerName}"
      - Add trust intro, value prop ("Reviews help families make confident care decisions")
      - Add `providerSlug` param for removal-request link
      - Keep star rating display
      - CTA: "View your review"
      - Files: `lib/email-templates.tsx`
      - Depends on: 1
      - Verify: Build passes

### Phase 3: Update Callers
- [ ] 5. Update all call sites to pass `providerSlug` to the rewritten templates
      - `app/api/questions/route.ts` — questionReceivedEmail call (~line 211)
      - `app/api/connections/request/route.ts` — connectionRequestEmail call
      - `app/api/admin/leads/add-email/route.ts` — connectionRequestEmail call
      - `app/api/reviews/route.ts` — newReviewEmail call
      - Files: 4 API routes
      - Depends on: 2, 3, 4
      - Verify: `npm run build` passes, grep for old param signatures finds no mismatches

### Phase 4: Subject Line Updates
- [ ] 6. Update email subjects at the call sites (not in templates — subjects are set by callers)
      - Questions: "A family has a question about {providerName}"
      - Connections: "A family is looking for care from {providerName}"
      - Reviews: "{reviewerName} left a review for {providerName}"
      - Files: same 4 API routes as task 5 (can be done in same pass)
      - Depends on: 5
      - Verify: Grep for old subject strings returns 0 matches

### Phase 5: Verify
- [ ] 7. Full build + manual email preview
      - `npm run build` — zero errors
      - Optionally: add a temporary `/api/debug/email-preview` route to render all 3 templates in-browser (delete before PR)
      - Files: none (or temporary debug route)
      - Depends on: 6
      - Verify: All 3 emails render correctly with trust intro, off-ramp, forward prompt

## Risks

| Risk | Mitigation |
|------|------------|
| Breaking existing email sends | Template-only changes + same function signatures (just adding optional `providerSlug` param) |
| Off-ramp link needs provider slug | Slug is already available in all call sites (comes from the provider record) |
| Email too long / providers don't read | Keep trust intro to 1 line, value prop to 1 line, off-ramp to small-text footer area |
| HTML rendering across email clients | Using same inline-style approach as existing templates — proven to work |

## Copy Direction

### Trust Intro (shared)
> "Olera is an NIH-backed platform helping families find quality senior care providers like you."

### Question Email — Value Line
> "Families researching care are reading your profile. A thoughtful answer helps them see your expertise."

### Connection Email — Value Line
> "This family is actively searching for care and chose to reach out to you. A timely response makes all the difference."

### Review Email — Value Line
> "Reviews help families make confident decisions about care — and yours is getting noticed."

### Off-Ramp Block (shared)
> "Not the right contact? Please forward this to the appropriate person on your team."
> "Manage your listing · Request changes" (links to removal-request page)

## Notes

- The `layout()` wrapper stays unchanged — it already handles Olera branding, 480px card, footer
- Subject lines are set at the call site (not in the template function), so those need updating separately
- The removal-request page already exists at `/for-providers/removal-request/[slug]` with hide/delete options
- This is a copy/design pass — no new API routes, no database changes, no new dependencies
