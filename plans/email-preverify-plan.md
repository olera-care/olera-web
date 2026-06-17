# Email Pre-Verification + Cold-Lane Suppression — Build Plan

**Status:** scoped, not built (2026-06-17). Branch: `good-pasteur` (or fresh off staging).
**Owner:** TJ. **Origin:** digest deliverability investigation — see Notion handoff `3825903a…` + memory `project_email_deliverability`.

---

## Problem (data-grounded)

Provider mail on the Resend account bounces above safe thresholds. The dominant
driver is `question_received` (6.74% / 30d, ~half of all account bounces); the
weekly digest was #2 (4.6% / 7d, over Resend's 4% line, on olera.care — now
partly addressed by PR #1093's ring-fence + whole-digest verification).

**Root cause is timing, not threshold.** Of every address that bounced (60d,
321 unique):

| Verdict we had at send | Share |
|---|---|
| **invalid (already known bad)** | **57.6%** |
| never verified | 24.0% |
| valid (went bad / false-neg) | 9.7% |
| risky (catch-all) | 8.7% |

We verify **lazily at send time and fail open**. During the weekly burst,
ZeroBounce hits its Cloudflare rate-limit (~2k calls), returns `unknown`, and
the mail sends. So we verify *least* reliably exactly when we send *most*.

**Bounce rate by verdict (of everything sent, 60d, 2,616 unique):**
invalid **18.9%**, never-verified **15.6%**, catch-all/risky **15.3%**, valid **3.2%**.

**Role accounts (`info@`/`admin@`): dropped as a separate rule.** Data showed
**zero** `valid` role accounts in our pool — every one already verifies invalid
or catch-all, so it's caught by levers 1+2. A standalone role-based block would
suppress nothing new and risked cutting a legit `info@` (of which there were
none). Reconsider only if complaint data later implicates valid role accounts.

---

## The fix — three levers, prioritized

### Lever 1 — Scheduled, throttled pre-verification cron (the 58% fix)
Move verification **off the hot send path** into a job that runs *ahead* of
sends and pre-populates the `email_verifications` cache, so send-time is a clean
cache read that reliably suppresses known-invalids.

- New cron (register in `lib/crons/registry.ts` + `vercel.json` — both, per
  memory `feedback_cron_schedule_registry_sync`). Runs a day or hours before the
  weekly digest / on a rolling basis.
- Reuse `scripts/verify-emails.ts` logic (`verifyAndCache`). **Throttle ≤1 req/1.5s**
  to dodge the Cloudflare 429 wall (memory `feedback_api_rate_limits_first`).
- Audience: the cold pools — `question_received` recipients + the unclaimed
  digest audience. (Decision D2: start with these two, expand to all
  `PROVIDER_NOTIFY_FROM_TYPES` if it works.)
- Admin-session auth path so it's browser-triggerable (memory
  `feedback_cron_routes_browser_triggered`).

### Lever 2 — Catch-all / `risky` suppression on the COLD lane only
Catch-all bounces 15.3% — too hot to keep cold-blasting. Suppress `risky` for
cold/unclaimed mail; **claimed + transactional keep today's lenient
(invalid-only) rule.**

- Implement as a stricter verdict gate keyed on the cold lane (reuse the
  `isUnclaimed` / `PROVIDER_NOTIFY_FROM_TYPES` signal already in play).
- **Decision D1 (TJ leans YES):** hard-suppress catch-all, OR the softer
  "send-once, then suppress on first bounce." Soft option preserves the rare
  legit-but-catch-all small provider; hard option is safer for the account.

### Lever 3 — Add-time UI warning for manual entry
The team hand-adds emails (`app/admin/leads/add-email`,
`app/admin/questions/add-email`). Today a catch-all/role address **passes** the
add-time check (only `invalid` is flagged), gets a green light, then is silently
skipped at send under lever 2 — double wasted effort + false confidence.

- On manual add, surface a warning when the verdict is `risky`/catch-all or the
  `sub_status` is role-based: "this address probably won't receive mail — find a
  named/personal inbox." Don't hard-block; warn.

### Lever 4 (defer) — TTL / re-verify stale `valid`
Re-check `valid` verdicts older than ~90d (9.7% of bounces were stale-valid).
Lower impact; only if 1–3 don't land us under 4%.

---

## Files in scope
- `lib/email-verification.ts` — verdict gating, possibly a `coldSuppressThreshold`.
- `lib/email.ts` — cold-lane suppression rule (extends the `VERIFY_ON_SEND_TYPES`
  / suppression block at ~line 350 shipped in PR #1093).
- `app/api/cron/email-preverify/route.ts` (new) + `lib/crons/registry.ts` + `vercel.json`.
- `app/admin/leads/add-email`, `app/admin/questions/add-email` — add-time warning.
- Reuse `scripts/verify-emails.ts`.

## Open decisions for TJ
- **D1:** catch-all — hard-suppress vs send-once-then-suppress-on-bounce. (lean: TBD with TJ)
- **D2:** pre-verify cron audience — two cold pools first, or all provider-notify types.

## Measurement
- Before/after bounce rate by lane (olera.care vs oleracare.com) and by verdict.
- ZeroBounce status distribution of the cold pool (predict reach loss from lever 2).
- Watch oleracare.com bounce after PR #1093 + this deploy — it's near the 4% line.

## Honest limit
Domain isolation (PR #1093) protects *where* bounces land. Verification + lever 2
lower the *rate*. Neither fully fixes a deeply bad address pool — the ceiling on
this work is better address sourcing (verify-at-capture / drop worst sources).
