-- A university for teaching the board, marked as such.
--
-- Demonstrating the funnel on a real campus means clicking real records: the
-- notes are real, the outcomes are real, and undoing them afterwards is the
-- careful, error-prone job the reset scripts exist for. A campus that is
-- allowed to be wrong removes the problem.
--
-- The flag is a column rather than a name match for three reasons, and the
-- third is the one that matters. The board can badge the row so nobody
-- mistakes it for live work. The reset can scope to it, so a script written
-- for the demo physically cannot reach a real campus. And the rollups can
-- leave it out, so a morning spent teaching does not move a number anybody
-- reports on. A name match would do the first two and silently fail the
-- third the first time somebody renamed it.

ALTER TABLE student_outreach_campuses
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN student_outreach_campuses.is_demo IS
  'A teaching campus. Excluded from Health, the 30-day funnel and growth reporting; safe to reset with scripts/migration/demo-seed.sql.';

-- Partial, because the interesting set is tiny and the common query is
-- "everything that is not the demo".
CREATE INDEX IF NOT EXISTS idx_so_campuses_demo
  ON student_outreach_campuses (id) WHERE is_demo;

-- The campus itself, and its entry in the universities registry.
--
-- Both are needed and for different reasons. The campus is what the board
-- lists and what records hang off. The registry row is what the
-- campus-university bridge resolves a campus to, and a campus the bridge
-- cannot resolve has no students — so without it the demo would show
-- providers and an empty Students section.
--
-- The content is not here. scripts/migration/demo-reset.sql fills it and
-- refills it, which is the whole point of having a campus that is allowed to
-- be wrong.

INSERT INTO student_outreach_campuses (slug, name, city, state, is_active, is_demo, notes)
VALUES (
  'dubose-university-of-olera',
  'DuBose University of Olera',
  -- A real city, so the sweep's map link and the directions link open
  -- somewhere. A campus in "Demo, TX" makes both look broken in front of an
  -- audience, which is the one place they must not.
  'Austin',
  'TX',
  TRUE,
  TRUE,
  'Teaching campus. Reset with scripts/migration/demo-reset.sql. Not counted in Health, the 30-day funnel or growth reporting.'
)
ON CONFLICT (slug) DO UPDATE
  SET is_demo = TRUE, name = EXCLUDED.name, notes = EXCLUDED.notes;

INSERT INTO medjobs_universities (name, slug, city, state, is_active)
VALUES ('DuBose University of Olera', 'dubose-university-of-olera', 'Austin', 'TX', TRUE)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
