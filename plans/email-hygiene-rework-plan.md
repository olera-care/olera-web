# Email Hygiene Rework — Spec

**Status:** Draft (2026-06-19) · Owner: TJ
**Supersedes:** the narrow "build an override" ticket. The override is now Step 1 of this.

## The problem (the false tradeoff)

We have one global email checker, and it's forced to make a single strict-vs-loose call:

- **Too loose** → we send to too many bad addresses → bounce rate climbs toward Resend's 4% suspension ceiling (`lib/email-thresholds.ts:14-17`) → risk losing olera.care, the crown jewel.
- **Too strict** → valid addresses get flagged and permanently blocked → real providers (incl. The Grove) stop receiving family questions, and the queue piles up.

There is no global setting that's right, because **two different problems are tangled into one knob:**

1. **Protect olera.care's sender reputation** — a *per-sending-domain* problem.
2. **Decide whether a single message should send** — a *per-message* problem, currently a one-way permanent ratchet.

The fix is to **decouple them**: protect the domain by *routing* risk to a cold lane, and decide each message with a *graded, reversible, claim-aware* block. Once risk is routed off olera.care, we can afford to be lenient on the per-message decision without endangering the crown jewel.

## Current state (grounded in code)

- **Lane routing already exists but is OFF.** `resolveFromAddress()` (`lib/email.ts:62-68`) routes cold provider types (`PROVIDER_NOTIFY_FROM_TYPES`, `lib/email.ts:29-41`) and unclaimed digest recipients (`app/api/cron/weekly-provider-digest/route.ts:1161-1165`) through `PROVIDER_NOTIFY_FROM` — but the env var is unset in prod, so everything sends from olera.care today.
- **Block decision is partly graded already.** In `sendEmail()` (`lib/email.ts:342-400`): ZeroBounce `invalid` always suppresses; `risky` suppresses on the cold lane only (`lib/email.ts:376-383`). Verdict mapping in `lib/email-verification.ts:46-60`.
- **The ratchet:** `isSuppressedRecipient()` (`lib/email.ts:166-182`) treats any `email_log.bounced_at`/`complained_at` as a **permanent** block, and an `invalid` verdict suppresses until a 90-day cache TTL. **There is no clear/un-suppress path, no human-override, and suppression does not branch on claim status** — so a claimed, engaged provider with one stale bounce is blocked identically to a dead scraped address.
- **A replay mechanism already exists.** `sendDeferredNotificationsForProvider()` (`lib/admin/send-deferred-notifications.ts:45-429`) re-sends pending questions/leads when a provider's email is added/updated. A backfill can reuse this pattern.
- **No per-domain bounce visibility.** Bounce rate is tracked account-wide (`lib/email-thresholds.ts`), not split by domain — so today we can't *see* whether a lane split is working.

## Target design

### 1. Turn on the lane split (protect the crown jewel by routing, not blocking)
- Set `PROVIDER_NOTIFY_FROM` so cold/unverified/unclaimed provider mail leaves via the cousin domain; claimed + transactional stay on olera.care.
- **Risk to verify first:** confirm the cousin domain is a *separate reputation unit* from olera.care in Resend (own sending domain / auth), or a bounce there still drags olera.care's account-level rate. If Resend caps bounce at the account level, the split must be a separate Resend project/domain, not just a different From string.
- Add **per-domain bounce visibility** so we can confirm the split is actually offloading risk.

### 2. Make the block graded + claim-aware (stop hard-blocking what's safe)
- **Confirmed hard bounce** (`email_log.bounced_at`) → block, but **reversible** (see Step 3).
- **Predictive ZeroBounce `invalid`/`risky`** is a guess, not a bounce. On the warm lane / claimed account / human-verified address → **warn and send** (route `risky` via cold lane), do **not** permanently suppress.
- **Claim-aware branch** (new): a claimed account (`business_profiles.account_id` set, `claim_state='claimed'`) is a monitored real inbox — predictive verdicts should not block it. Suppression currently ignores claim status; add the branch.

### 3. Human-trust override + reversibility (kill the ratchet) — *Step 1, ships first*
- A **trusted-address** mark (QA phone-verified, pulled from official website, or claimed-account email) that **supersedes** both the bounce flag and the predictive verdict — bypasses `isSuppressedRecipient()` + `isUndeliverable()` for that address.
- A **clear / un-suppress** action that removes (or overrides) the `email_log` bounce flag and re-validates, with an audit of who cleared it and when.
- This is the old "override," now correctly scoped: it bypasses the *bounce block*, not just the ZeroBounce check (the current `force=true` on `add-email` only skips ZeroBounce, which is why it "retries and rejects again"). It also must work for **claimed** providers (today `add-email` 403s them, `app/admin/questions/add-email/route.ts:149-157`).

### 4. Backfill stuck sends (Esther's ask)
- After a flag is cleared or the checker is loosened, **re-attempt** the sends that were blocked.
- Hook: query `email_log` rows with `status='failed'` + a suppression reason, plus questions/connections carrying `needs_provider_email` / `email_dead`. Reuse the `sendDeferredNotificationsForProvider()` pattern; add a `retry-failed-sends` cron or fold into an existing one.
- Safe by construction: `sendEmail()` re-suppresses automatically if the condition still holds, so a backfill can't punch bad mail through.

## Guardrail / sequencing constraint
olera.care must stay under Resend's 4% bounce ceiling. The lane split (Step 1 above / build-step 2 below) is what makes loosening the per-message block (build-step 3) safe — the lenient/risky sends go out the cold lane, not olera.care. **Therefore loosening must not ship before the lane split is on and verified.**

## Build order (shippable slices)
1. **Human-trust override + clear-flag** for claimed/verified addresses — bypass suppression for a specific address. **Unblocks The Grove's ~12 stuck questions immediately. Target 24–48h.**
2. **Turn on the lane split** (`PROVIDER_NOTIFY_FROM`) — after verifying cousin-domain reputation isolation — and add per-domain bounce visibility.
3. **Graded + claim-aware block** — predictive verdicts no longer permanently suppress claimed/warm/verified; route `risky` to cold lane. (Gated behind step 2.)
4. **Backfill cron** for stuck sends.

## Key files
- `lib/email.ts` — `resolveFromAddress()` (62-68), `PROVIDER_NOTIFY_FROM_TYPES` (29-41), `VERIFY_ON_SEND_TYPES` (53-56), `SUPPRESSION_EXEMPT_TYPES` (134-144), `isSuppressedRecipient()` (166-182), suppression gate (342-400)
- `lib/email-verification.ts` — verdict mapping (46-60), `verifyAndCache()` (163-182), 90-day TTL (165)
- `lib/email-thresholds.ts` — Resend bounce/complaint ceilings (14-17)
- `lib/admin/send-deferred-notifications.ts` — replay mechanism (45-429)
- `app/admin/questions/add-email/route.ts` — current force path (161-166), claimed 403 (149-157)
- `app/api/cron/weekly-provider-digest/route.ts` — claimed/unclaimed lane selection (1161-1165)
- `supabase/functions/resend-webhook/index.ts` — bounce/complaint write (131-170)

## Source
QA thread (Graize/Ces) + Esther's email-hygiene thread, #ai-product-development, 2026-06-18/19.
