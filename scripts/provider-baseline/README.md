# Provider page baseline

Phase 0 of the Home Care Page plan. A fixed set of real provider pages, a
record of how each one looks to Google and to a family today, and a script
that re-takes the record and says exactly what changed.

Every PR that touches provider pages runs it before review: snapshot the
preview, compare against the production baseline, and accept only the
differences the PR meant to make. A home-care-only change must show zero
difference on facility pages.

## Run it

```bash
npm --prefix scripts/provider-baseline install
npx --prefix scripts/provider-baseline playwright install webkit

# Snapshot production, or a preview (set VERCEL_BYPASS_SECRET if protected)
node scripts/provider-baseline/baseline.mjs snapshot --base https://olera.care --out <dir>

# Compare two snapshots
node scripts/provider-baseline/baseline.mjs compare <before-dir> <after-dir>
```

A run takes about six minutes. It is read-only: every non-GET request and
every analytics call is aborted, and the page's view tracker skips automated
browsers, so no page view, question or request is recorded.

## What a snapshot holds

For each page in `page-set.json`, at phone (402 wide) and laptop (1440 wide),
in WebKit (Safari's engine):

- the redirect chain and final status code
- from the HTML the server sent: title, description, robots, canonical, Open
  Graph, structured data, H1, internal links
- a full-page screenshot

## What the comparison ignores, and why

Two runs against the same deployment must compare clean, so three things that
change on every load are handled on purpose:

- **The comparison cards** ("Compare X to the best local options") show
  providers drawn at random. Their count is compared; the cards are hidden
  behind a fixed box in screenshots.
- **Links to other providers** come only from those cards, so they are counted,
  not listed. Every other internal link is compared exactly.
- **Redirected pages** land on a city page; the chain and destination are
  compared, the city page's pixels are not.

A screenshot differs when more than 100 pixels change, or its size changes.
Two runs of the same deployment differ by at most 17 pixels; one changed
word is several hundred. Each difference writes a red-on-white diff image next to the report.

## The page set

29 pages chosen from production data on 9 October 2026: the plan's four QA
providers, a paying Ad Boost client, a provider with two profiles, a team-login
agency, claimed with and without an owner price, listed price, contact for
pricing, placeholder 0 rating, Facebook links, long names, every facility
category, the two test listings, and every status path (claimed after deletion,
three kinds of redirect, removed at the provider's request, unknown slug).
The reason for each is in the file. Change it only on purpose.

## Test accounts

`test-accounts.mjs create|status|reset`. Two "(Test)" home care listings in
College Station, TX, and a login for every role, all `tj+hc-…@olera.care`
(sign-in codes land in TJ's inbox). See `docs/home-care-page/baseline/README.md`
for the table and the rules.
