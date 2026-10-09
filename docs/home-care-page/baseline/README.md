# Home care page: the Phase 0 baseline

A record of 9 October 2026, before any change from the Home Care Page plan
ships, so every later change can be proven safe. Three parts: the fixed page
set and its snapshots, today's numbers, and test accounts for every role.

The tool and the page set live in `scripts/provider-baseline/` (see its
README for how to run a comparison).

## 1. Snapshots

- **Page set:** `scripts/provider-baseline/page-set.json`, 29 real pages.
- **Baseline taken:** 9 October 2026 against https://olera.care, in WebKit at
  402 and 1,440 wide. Saved at
  `~/Desktop/olera-provider-pages-handoff/baseline/2026-10-09/` (screenshots
  are too large for git: about 80 MB).
- **Proven:** two production runs compare with zero differences; staging
  (same code) against production also compares clean; injected changes,
  including a price label alone, are all caught.

What the snapshots show about today, before any fix:

- The owner's own rate is labelled "Area estimate, not this provider's actual
  price" in the request card (seen on the claimed test listing). Phase 1.
- A directory row deleted in a data sweep still serves a page (200) when the
  agency had claimed it (`superior-home-care-services`). Expected, recorded.
- Deleted rows redirect with 308 (Next.js's permanent redirect), not 301.
- Removed-at-request and unknown slugs return 404.

## 2. Today's numbers

### Provider pages, 11 September to 8 October 2026 (28 days)

Raw rows and exact definitions: `numbers-2026-10-09.json`. Internal traffic
excluded. "Requests per session" counts sessions that requested and also
viewed a provider page.

| | Page views | Sessions | Requests | Requests per session | Questions |
|---|---:|---:|---:|---:|---:|
| **Home care, all devices** | 3,902 | 3,171 | 71 | 1.36% (43) | 274 |
| Home care, phone | 1,756 | 1,331 | 33 | 2.48% | 158 |
| Home care, desktop | 2,119 | 1,819 | 15 | 0.55% | 102 |
| Home care, no page view in session | | | 23 | | 1 |
| Home health | 3,613 | 3,101 | 28 | 0.87% | 223 |
| Assisted living | 4,063 | 3,444 | 50 | 1.39% | 353 |
| Memory care | 608 | 539 | 5 | 0.93% | 31 |
| Nursing home | 1,948 | 1,655 | 17 | 0.97% | 142 |
| Independent living | 4,122 | 3,259 | 109 | 3.25% | 424 |
| Two or more categories | 402 | 373 | 7 | 1.88% | 49 |
| **All provider pages** | 18,681 | 15,438 | 287 | 1.54% (238) | 1,499 |

Across all categories, phones request at 3.08% of sessions (197 of 6,406) and
desktop at 0.39% (35 of 8,886). The all-pages row counts distinct sessions;
adding up the category rows would count a session once per category it viewed. The 23 home care requests with no page view in the session are Ad
Boost leads handed to the client (`source` `ad_handover` or `city_lead_offer`,
all 23 traced: Hoop Cares 12, Assisting Hands 6, Colorado CareAssist 2,
Miracle Lightstar 2, Graceful Homecare 1), not requests made on the page. The
page test must leave them out, and those clients are out of the test anyway.

Why these differ slightly from the plan (1.15%, 56 days): a different window,
and this counts sessions with any provider page view rather than the plan's
home-care-only session set. The pilot will be read against these definitions.

### Search Console, weekly (Sunday to Saturday)

From the `/metrics` snapshots in Supabase (`growth_metric_snapshots`,
`growth_page_metrics`). Provider-page rows are those above the materiality
floor (2 clicks or 50 impressions a week), so they slightly undercount.

| Week | Site clicks | Site impressions | Provider page clicks | Provider page impressions | Provider pages counted |
|---|---:|---:|---:|---:|---:|
| 6–12 Sep | 2,343 | 371,302 | 810 | 84,847 | 962 |
| 13–19 Sep | 2,683 | 359,572 | 945 | 90,776 | 1,027 |
| 20–26 Sep | 2,808 | 329,037 | 977 | 70,198 | 939 |
| 27 Sep–3 Oct | 2,731 | 377,718 | 900 | 79,714 | 1,020 |

**Indexed pages: not yet recorded.** It isn't stored in the snapshots, and
reading it needs Search Console access this machine doesn't have. TJ: Search
Console, Indexing, Pages, the "Indexed" number for olera.care on 9 October.

## 3. Test accounts

Created 9 October with `node scripts/provider-baseline/test-accounts.mjs
create`. Sign in with the email; the code lands in tj@olera.care.

| Role | Email | State |
|---|---|---|
| Guest | tj+hc-guest@olera.care | No account. Use it in the request and question forms. |
| Signed-in family | tj+hc-family@olera.care | Account and family profile. |
| Returning family | tj+hc-family@olera.care | Same family after its first request to the claimed test listing. Made on the first QA run, on purpose: a request raises the team's lead alert. |
| Owner, claiming | tj+hc-claimer@olera.care | No account yet, by design. Claims the unclaimed test listing; `reset` undoes the claim. |
| Owner, editing | tj+hc-owner@olera.care | Owns the claimed test listing (verified), with its own hourly rate. |
| Team member | tj+hc-team@olera.care | Team login on the claimed test listing. No account until first sign-in, by design. |
| Admin | tj@olera.care | Existing admin. No new admin was created. |

Test listings, both "(Test)" home care in College Station, TX:

- `/provider/test-baseline-home-care-claimed`: verified claim, owner rate
  $30–36/hr, directory listed price $28–34.
- `/provider/test-baseline-home-care-unclaimed`: unclaimed, listed price
  $25–30, email tj+hc-unclaimed@olera.care.

**Rules.** Send test requests and questions only to these two listings, never
to a real provider; the multi-agency "ask several" step must be skipped in
tests. Production has no test switch on requests: each test request still
raises the team's lead alert and can enter the family follow-up emails (to
the tj+ alias). The "(Test)" name marks it. After a claim test, run `reset`.

**Side effects, handled.** Creating a claimed profile fires a database
trigger that logs a new claim in the outreach tracker, and a recent
`claimed_at` feeds the growth dashboards' claim counts and the welcome and
nudge emails. The script dates the test claim 1 January 2026 and removes the
tracker row; `reset` does the same after a QA claim. Expect the occasional
automated email to the tj+hc addresses; they reach only TJ.
