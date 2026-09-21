-- The target, with a number and a date, so conditions can be ranked by distance
-- to it instead of by whatever the ten-lens sweep happens to notice.
--
-- WHY. On 2026-09-21 Cortex held ten live investigations. Three were on the
-- path to paying providers. The other seven were traffic composition, disputes
-- about the accuracy of its own numbers, internal backlog, and a runway
-- tangent that this same doctrine session had accidentally created. Nothing was
-- wrong with any of them individually. There was simply no target to be far
-- from, so "important" could only mean "large", and a big number about anything
-- outranked a small number about the only thing that matters.
--
-- `current_priorities` already says "get providers subscribing". It has no
-- count and no date, so nothing can compute a distance from it. That is the
-- whole difference between a priority and a target.
--
-- EDITABLE ON PURPOSE. TJ, 2026-09-21: the four goals "will probably change
-- over time". This is a row he edits, not a constant compiled into the scan.
-- Add a target, retire a target, move a date; the ranking follows.
--
-- Safe to run twice: the column add is IF NOT EXISTS and the seed only fires
-- when no target with this key exists yet.

ALTER TABLE war_room_company_models
  ADD COLUMN IF NOT EXISTS targets jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN war_room_company_models.targets IS
  'Countable goals with a number and a date. Each entry: key, label, metric, target, due, why. `metric` names the snapshot fact that counts progress, so a target nobody can count is impossible to write. Cortex ranks conditions by distance to these, which is what stops a large number about an unimportant thing outranking a small number about the north star.';

UPDATE war_room_company_models
SET
  targets = targets || jsonb_build_array(
    jsonb_build_object(
      'key',    'paid_providers',
      'label',  'Providers who have actually paid',
      'metric', 'payingProviders',
      'target', 12,
      'due',    '2027-01-05',
      'why',    $why$Twelve providers who have actually paid, not paid-or-trial, is what lets the CRP application stand on commercial readiness rather than intent. TJ, 2026-09-21: "We want providers who have actually paid, so we got 75 dollars from one subscriber. We want that from 12. That shows, okay, you are real." The two paths are Managed Ads, which TJ runs directly, and MedJobs, which Logan runs. As of 2026-09-21 the count is one: Hoop Cares, subscribed 2026-09-15 at 75 dollars a month.$why$
    )
  ),
  updated_at = now()
WHERE key = 'olera'
  AND NOT (targets @> '[{"key": "paid_providers"}]'::jsonb);
