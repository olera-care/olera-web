# Phase 2: search correctness

What every provider page tells Google, made true and allowed. One change to
`app/provider/[slug]/page.tsx`, all provider pages, all categories.

## What changed

| | Before | After |
|---|---|---|
| Star rating markup (`aggregateRating`) | Google's own rating and review count | None. Google forbids marking up ratings aggregated from another site. |
| Review markup (`review`) | Demo reviews, on demo or seeded profiles | None. No live profile had any (0 of 1,331), so nothing visible changes. |
| `priceRange` | The headline price, including Olera's area estimate | Only the provider's own or listed price |
| `priceSpecification.unitText` | Stored unit, else `MONTH` | Stored unit, else the category's unit (home care and home health: `HOUR`) |
| Services (`hasOfferCatalog`) | Listed services padded with category defaults | Listed services only |
| Search description, claimed page with no description | "…, a home_care_agency provider in …" (37 pages) | "…, a Home Care (Non-medical) provider in …"; "an" before a vowel |

Nothing on the visible page changes. Titles, canonicals and URLs are untouched.

## Baseline, 9 October 2026

- **Review snippets report:** 2,420 valid items, 0 invalid (Google's update of 7 October).
- **Search appearance, 90 days:** no rows. Out of 39,100 clicks and 5.9 million
  impressions, none is attributed to a review-snippet or other rich result.
- **Review snippet impressions** (the report's own impressions line): never more
  than about 3 a day across the whole site. Google accepted the star markup but
  almost never showed stars in our results.
- **Clicks and impressions:** see `baseline/README.md` (provider pages about 900
  clicks and 80,000 impressions a week; site 2,700 clicks a week).
- **Indexed:** 52,900 indexed, 135,000 not (Google's update of 4 October).

Expected effect: none measurable on clicks, because the stars almost never showed. The review
snippets report will fall towards zero valid items over the following weeks as
Google recrawls. That is the intended outcome, not a loss.

## Four-week watch

Read Search Console each Tuesday with `/metrics` for four weeks after release.

| Check | Rollback trigger |
|---|---|
| Provider page clicks, week on week and against the same weeks last year | Down more than 20% for two weeks running, with site clicks outside provider pages flat |
| Indexed pages | Down more than 5% |
| Search appearance | A review-snippet row appears and then disappears with a click drop (would mean stars were showing after all) |
| Rich Results test on three sample pages | Any error |

## Undo

One revert of the Phase 2 commit restores the old markup exactly:
`git revert <merge commit>` on a branch off staging, PR, merge, promote. No data
changed, so nothing else needs undoing. Google picks the old markup back up as it
recrawls.

## Bringing stars back

Only from reviews families leave on Olera (the `reviews` table), never from
Google. Today that is 35 published reviews across 34 providers, averaging 3.2
stars, so stars would appear on few pages and often low. Decision for TJ before
any are added. (Olera Scores are retired and are not a source.)
