-- Work that needs approval rather than judgement.
--
-- WHY. On 2026-09-21 Cortex produced this, unprompted, in its own critic review:
-- "All are read-only probes with a one-pull-request blast radius and zero
-- founder minutes." And: "Zero founder minutes requested this scan; the one
-- time-boxed act that matters is the calling." It identified the right work and
-- had nowhere to put it.
--
-- The system has exactly one output type: a founder decision brief. Anything
-- not worth thirty minutes of TJ's judgement becomes "keep investigating" and
-- dies there. Five of the six action kinds (research, operations,
-- business_development, content, decision) have no executor at all; only `code`
-- does. So five-sixths of what Cortex can propose has never had a destination.
--
-- TJ, 2026-09-21: "there's so much to chop in between understanding the
-- high-level thing and doing nothing at all. For instance, making sure the
-- provider subscription doesn't expire without her continuing: establish weekly
-- touch points with her, phone calls, updates on progress, asking her what we
-- can do better, speaking to her about the price point. Cortex can help me plan
-- this, assign a task, come up with drafts."
--
-- `assigned_owner` is the missing fact. Everything else already exists:
-- evaluation_window_days gives the due date, execution_plan carries the steps,
-- proposed_solution carries the draft. What was missing was a person.
--
-- Safe to run twice.

ALTER TABLE war_room_proposals
  ADD COLUMN IF NOT EXISTS assigned_owner text;

COMMENT ON COLUMN war_room_proposals.assigned_owner IS
  'Who does this work, for proposals that need approval rather than founder judgement. Named because the founder is usually the wrong actor: on 2026-09-21 Cortex correctly refused to escalate a renewal call because "handing it to a founder at UTC+7 would be handing back a step he is worse placed to perform" -- the calling team owns it. A non-code proposal without an owner is an idea, not work.';
