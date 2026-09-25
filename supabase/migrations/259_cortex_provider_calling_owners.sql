-- Provider calls are made by TJ and Ces. Nobody else.
--
-- The company model said calling was "owned by Graize and Ces", and the one
-- approved proposal (ask the paying provider what made her pay) had a plan
-- step reading "Chantel takes the call". Both were wrong, and the daily brief
-- repeated it: "Chantel calls Liz Hoop". TJ, 2026-09-25: "Chantelle is not
-- making these calls. It's me and Ces."
--
-- Both edits are matched on the old text, so re-running this is a no-op.

UPDATE war_room_company_models
SET constraints = (
  SELECT jsonb_agg(
    CASE
      WHEN item.value #>> '{}' LIKE 'Provider calling is owned by Graize and Ces.%'
        THEN to_jsonb('Provider calls are made by TJ and Ces (Ces Chavez), nobody else. Chantel and Graize do not make provider calls, so never assign, schedule or draft provider outreach for them. TJ takes the calls where the relationship or the judgement is the point (the paying subscriber, a renewal at risk); Ces takes the rest and absorbs scheduling and follow-up. TJ is at UTC+7, so US-hours volume falls to Ces. Anything not written down does not reach the call.'::text)
      ELSE item.value
    END
    ORDER BY item.ordinality
  )
  FROM jsonb_array_elements(constraints) WITH ORDINALITY AS item(value, ordinality)
),
updated_at = now()
WHERE key = 'olera'
  AND constraints::text LIKE '%Provider calling is owned by Graize and Ces.%';

UPDATE war_room_proposals
SET execution_plan = jsonb_set(
  execution_plan,
  '{0,detail}',
  to_jsonb('TJ takes the call himself, with Ces scheduling it and handling follow-up; Ces takes it if TJ cannot. Target this week, well inside the renewal window, during US business hours. Number and script are already in the written record under the existing blocked item; no new material needs writing.'::text)
),
updated_at = now()
WHERE id = '0da78241-1828-4a15-be24-c16adddf0dee'
  AND execution_plan #>> '{0,detail}' LIKE 'Chantel takes the call%';
