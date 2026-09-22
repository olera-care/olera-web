-- ===========================================================================
-- 247 — collateral on a record, and on the task it arrived with
-- ===========================================================================
-- Screenshots of the email they sent back, the brochure they attached, the
-- slide deck a career centre handed over. None of it had anywhere to live,
-- so it lived in somebody's inbox and the record said nothing about it.
--
-- One table, two links. A file uploaded from a task carries both the task
-- and the record; a file uploaded from the record carries only the record.
-- So the record shows everything and a finished task in the history shows
-- just what arrived with it, which is the same table read two ways rather
-- than two systems to keep in step.
-- ===========================================================================

-- Private. These are screenshots of other people's email: third-party names,
-- addresses and phone numbers. Nothing here is served without a signed URL.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medjobs-collateral',
  'medjobs-collateral',
  false,
  26214400,  -- 25MB, because a handed-over slide deck is not small
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS medjobs_attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Destroying a record destroys its files with it. The storage objects are
  -- removed by the delete action before the row goes, because storage does
  -- not cascade and an orphan in a bucket is invisible forever.
  outreach_id UUID NOT NULL REFERENCES student_outreach(id) ON DELETE CASCADE,
  -- The task it arrived with, when it arrived with one. SET NULL rather than
  -- CASCADE: unticking a rung deletes the pending task under it, and a file
  -- somebody uploaded should survive that as collateral on the record.
  task_id     UUID REFERENCES student_outreach_tasks(id) ON DELETE SET NULL,
  -- Denormalised so a campus can be cleaned up without walking the records.
  campus_id   UUID NOT NULL REFERENCES student_outreach_campuses(id) ON DELETE CASCADE,
  -- Where it sits in the bucket. Unique, so a retry cannot register one file
  -- twice under two rows.
  path        TEXT NOT NULL UNIQUE,
  filename    TEXT NOT NULL,
  mime        TEXT NOT NULL,
  size_bytes  INTEGER NOT NULL,
  caption     TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medjobs_attachments_outreach
  ON medjobs_attachments (outreach_id, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_medjobs_attachments_task
  ON medjobs_attachments (task_id)
  WHERE task_id IS NOT NULL;

ALTER TABLE medjobs_attachments ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE medjobs_attachments IS
  'Collateral on a MedJobs record: screenshots, brochures, decks. Stored in '
  'the private medjobs-collateral bucket and only ever served through a '
  'signed URL. task_id is set when the file was uploaded from a task.';
