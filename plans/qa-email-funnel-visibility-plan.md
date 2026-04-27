# Plan: Q&A Email Funnel Visibility (Phase 1 of P1 task)

Created: 2026-04-27
Status: Not Started
Notion: [P1 — Increase sign-ins from Q&A](https://www.notion.so/Increase-sign-ins-from-Q-A-by-throughly-auditing-the-Q-A-emails-to-improve-open-rates-and-follow-ups-34e5903a0ffe80a3989ee19c09dc110a)
Branch: `bold-nash` (off staging)

## Goal

Make the provider Q&A email open-rate funnel falsifiable by surfacing all upstream Resend signals (sent / delivered / bounced / complained) alongside the existing opens metric, plus bounce/complaint reasons. No template or behavioral changes — pure visibility.

## Why

Last 7d: ~496 questions sent → 33 opens → 27 sign-ins → 19 answered. The leak is opens (~7%). Until we can see what happened upstream of that 33 (delivered? bounced? marked spam?) we can't iterate on subject line, sender rep, or send time without flying blind.

The data is already in the DB. Migration 051 (commit `9b1f74f5`, 2026-04-26) added `delivered_at` / `first_opened_at` / `first_clicked_at` / `bounced_at` / `complained_at` to `email_log` plus a full `email_events` table. The Resend webhook (Supabase Edge Function) writes to both. Phase 1 is purely surfacing what's already captured.

## Success Criteria

- [ ] Admin `/analytics` shows a "Provider Q&A Email Funnel" with absolute counts AND step-to-step % at each stage: sent → delivered → opened → clicked → signed-in → answered
- [ ] Funnel is anchored on `email_log.created_at` (cohort framing — denominator = emails sent in window)
- [ ] Apple Mail caveat preserved in opens tooltip (carries over from existing tile)
- [ ] Bounce / complaint reasons surfaced (top 5 reasons + count) for the same window
- [ ] Existing `qa_email_openers` tile + other provider tiles remain unchanged
- [ ] Page loads in <2s for default 7d range (matches existing perf)

## Tasks

### Task 1 — Extend summary endpoint with cohort-anchored funnel
- **Files:** `app/api/admin/analytics/summary/route.ts`
- **Adds:**
  - New TS interface `ProviderQaFunnel { sent, delivered, opened, clicked, bounced, complained, signed_in, answered }`
  - New query in `windowQuery()`: `email_log` rows where `email_type='question_received'` AND `recipient_type='provider'` AND `created_at` in window. `SELECT id, provider_id, delivered_at, first_opened_at, first_clicked_at, bounced_at, complained_at`. Limit 50000 (matches existing).
  - Aggregate in-memory: count rows where each timestamp is non-null
  - For `signed_in` and `answered`: derive from existing `provider_distinct_counts.qa_signins` and `question_answerers` (no new query, just project them onto the funnel object)
  - Add `qa_funnel` to `WindowResult` and the JSON response shape
- **Verify:** `GET /api/admin/analytics/summary?date_from=...&date_to=...` in browser, confirm `qa_funnel` object returned. Spot-check `sent ≥ delivered ≥ opened ≥ clicked` (monotonic).
- **Depends on:** none

### Task 2 — Surface bounce / complaint reasons
- **Files:** `app/api/admin/analytics/summary/route.ts` (extend)
- **Adds:**
  - New query: `email_events` rows where `event_type IN ('bounced', 'complained')` AND `occurred_at` in window AND joined `email_log.email_type = 'question_received'`. SELECT `event_type, bounce_type, bounce_reason, email_log_id`. Limit 5000 (bounce volume is tiny).
  - Two-step join (no FK in select syntax for cross-filter): first pull candidate `email_log.id`s for question_received in a wider window, then `.in('email_log_id', ids)` on `email_events`. Or use a SQL view if cleaner.
  - Aggregate in-memory: group by `bounce_reason || '(no reason)'`, count, sort desc, top 5
  - Return as `qa_email_issues: Array<{ reason: string, count: number, type: 'bounced' | 'complained' }>`
- **Verify:** if no current bounces, force one by sending to a known-bad address from a dev script; confirm it surfaces. If no easy way, just confirm the field is `[]` (not `null`) and the UI handles empty gracefully.
- **Depends on:** Task 1 (so the type plumbing is in place)

### Task 3 — Render the funnel card on /admin/analytics
- **Files:** `app/admin/analytics/page.tsx`
- **Adds:**
  - New `<QaFunnelCard>` component placed below the existing `<WindowedCard>` (separate card — funnel deserves its own visual breathing room and the existing card is already dense)
  - 8 stats in a horizontal row (sent / delivered / opened / clicked / signed-in / answered + bounced + complained as smaller secondary tiles or footnote), each with: count, % of previous step, prior-window delta. Reuse existing `<Stat>` and `<DeltaLine>` components.
  - Apple Mail caveat tooltip on Opened tile (lift wording from existing `qa_email_openers`)
  - "Top issues" subsection inside the same card: up to 5 rows like "Hard bounce — invalid recipient × 12". Empty state: "No bounces or complaints in window."
- **Verify:** visit `/admin/analytics` in browser, confirm funnel renders, change date range, confirm counts update, confirm step-to-step % math (open / sent, click / open, etc.)
- **Depends on:** Tasks 1 + 2

### Task 4 — Sanity test against real data + ship
- Run dev server, load `/admin/analytics` with 7d range
- Cross-check funnel `opened` against existing tile `qa_email_openers` — they may differ (cohort vs event framing); document in tooltip if material
- Cross-check funnel `signed_in` against existing `qa_signins`
- Spot-check one bounced email in `email_events` (if any) to confirm reason maps correctly
- Open PR to staging with one-line summary + funnel screenshot
- **Verify:** numbers add up, monotonic funnel where expected, no console errors
- **Depends on:** Tasks 1 + 2 + 3

## Risks

- **Cohort vs event framing collision.** Existing `qa_email_openers` tile is event-anchored (opens that occurred in window). New funnel is cohort-anchored (sends in window, then their downstream events). For 7d windows these are similar; for short or very recent windows they diverge. *Mitigation:* keep both tiles, document the difference in tooltip. Do not deprecate or modify the existing tile.

- **`signed_in` and `answered` come from `provider_activity`, not `email_log`.** They're filtered by event `created_at`, not by which email triggered them. A sign-in today from an email sent 10 days ago shows in today's "answered" but the email isn't in today's "sent" cohort. For 7d windows this is small noise. *Mitigation:* tooltip note "approximate attribution — full attribution requires email_log_id → activity linkage (not built)." Don't fix in Phase 1.

- **Limit 50000 truncation.** At ~70 emails/day, that's ~700 days. Safe. Document threshold in code comment.

- **Bounce reason text from Resend can be verbose** (sometimes 100+ chars). *Mitigation:* truncate at render to 80 chars, full text in tooltip.

- **Apple Mail prefetch inflates open counts** (already known per existing tooltip). *Mitigation:* same Apple Mail caveat copy on the new Opened step. Phase 2 work should treat CTR as the cleaner signal.

## Notes

- Phase 1 ships visibility ONLY. No template changes, no behavior changes, no new emails.
- Phase 2 (subject line A/B, preheader audit, send-time test) and Phase 3 (follow-up sequences for unopened) depend on this baseline.
- Once shipped, let real data accumulate ~7 days before drawing conclusions about the baseline.
- Out of scope: changing `questionReceivedEmail` template, touching `qa_email_openers` tile, new outbound emails, deeper attribution, provider-side dashboard changes.

## File touch summary

| File | Change |
|---|---|
| `app/api/admin/analytics/summary/route.ts` | Add `qa_funnel` query + `qa_email_issues` query + interfaces |
| `app/admin/analytics/page.tsx` | Add `<QaFunnelCard>` component |

Two-file diff. ~150-200 LOC. ~3-4h work.
