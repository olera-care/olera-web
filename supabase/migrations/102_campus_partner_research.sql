-- Partner prospecting research state per Site (Chunk 1.3).
--
-- Holds two things the partner-sourcing + manual-audit workflow needs to
-- persist per university, neither of which has a home today:
--   1. sources — the AI source map per subtype (R4), so it's reusable for the
--      manual audit and later research instead of re-paying for it.
--   2. audit   — the required manual-audit checklist state per subtype (R3),
--      which gates "prospecting complete" for that subtype.
--
-- One additive, nullable JSONB column (default '{}'). No backfill; RLS inherits
-- the campus table's service-role policy. Shape:
--   {
--     "sources": { "advisor": [ {title,url,tier}, ... ], "student_org": [...], "dept_head": [...] },
--     "audit":   { "advisor": { "steps": { "<key>": true }, "complete_at": "ISO" }, ... }
--   }

ALTER TABLE student_outreach_campuses
  ADD COLUMN IF NOT EXISTS partner_research JSONB NOT NULL DEFAULT '{}'::jsonb;
