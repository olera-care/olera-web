-- War Room could read Slack and Notion but not Olera's own written record.
--
-- On 2026-09-20 every binding question it reported as unresolved had already
-- been answered in a file it cannot see: the Ad Boost checkout question in
-- SCRATCHPAD.md (2026-09-16), the grant traffic figure in docs/crp
-- (corrected 2026-08-21), the provider-page decline in the September traffic
-- work. It spent a month rediscovering closed questions and then correctly
-- refused to recommend anything, because it could not corroborate them.
--
-- Widen the source allowlist so the archive reader can write. The column is
-- TEXT + CHECK rather than an enum, matching the rest of this schema, so a new
-- value needs this migration or every insert fails.

ALTER TABLE war_room_source_items
  DROP CONSTRAINT IF EXISTS war_room_source_items_source_check;

ALTER TABLE war_room_source_items
  ADD CONSTRAINT war_room_source_items_source_check
  CHECK (source IN ('slack', 'notion', 'archive'));
