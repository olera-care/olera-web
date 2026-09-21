-- ===========================================================================
-- 26 — everything held on two providers (READ ONLY — changes nothing)
-- ===========================================================================
-- Village Caregivers and Cornerstone Caregiving. A task advance is not the
-- only thing that writes: research, contact details and the record's own
-- notes each save through their own path, and a touchpoint row can only be
-- inserted, never changed. So this dumps every trace either record holds,
-- from every table, rather than asking about advances alone.
--
-- If a note survived anywhere, it is in one of these five results.
-- Times are Eastern.
-- ===========================================================================

-- ── 1. The records themselves, every field that can hold text ─────────────
SELECT c.name AS campus,
       o.organization_name,
       o.status,
       o.notes,
       jsonb_pretty(o.research_data)                     AS research_data,
       o.created_at     AT TIME ZONE 'America/New_York'  AS created_et,
       o.last_edited_at AT TIME ZONE 'America/New_York'  AS edited_et
FROM student_outreach o
JOIN student_outreach_campuses c ON c.id = o.campus_id
WHERE o.organization_name ILIKE '%village caregiver%'
   OR o.organization_name ILIKE '%cornerstone%';

-- ── 2. Every task on them, any state, with the full payload ───────────────
SELECT o.organization_name,
       t.status,
       t.task_type,
       t.notes,
       jsonb_pretty(t.payload)                        AS payload,
       t.created_at   AT TIME ZONE 'America/New_York' AS created_et,
       t.due_at       AT TIME ZONE 'America/New_York' AS due_et,
       t.completed_at AT TIME ZONE 'America/New_York' AS completed_et
FROM student_outreach_tasks t
JOIN student_outreach o ON o.id = t.outreach_id
WHERE o.organization_name ILIKE '%village caregiver%'
   OR o.organization_name ILIKE '%cornerstone%'
ORDER BY o.organization_name, t.created_at;

-- ── 3. Touchpoints — append-only, so nothing here was ever overwritten ────
SELECT o.organization_name,
       tp.touchpoint_type,
       tp.channel,
       tp.outcome,
       tp.notes,
       tp.created_at AT TIME ZONE 'America/New_York' AS created_et
FROM student_outreach_touchpoints tp
JOIN student_outreach o ON o.id = tp.outreach_id
WHERE o.organization_name ILIKE '%village caregiver%'
   OR o.organization_name ILIKE '%cornerstone%'
ORDER BY o.organization_name, tp.created_at;

-- ── 4. Contacts — names and numbers save on their own path ────────────────
SELECT o.organization_name,
       ct.is_primary,
       ct.name,
       ct.role,
       ct.phone,
       ct.email,
       ct.notes,
       ct.last_edited_at AT TIME ZONE 'America/New_York' AS edited_et
FROM student_outreach_contacts ct
JOIN student_outreach o ON o.id = ct.outreach_id
WHERE o.organization_name ILIKE '%village caregiver%'
   OR o.organization_name ILIKE '%cornerstone%'
ORDER BY o.organization_name, ct.is_primary DESC;

-- ── 5. In case either was deleted rather than simply not saved ────────────
SELECT e.organization_name,
       e.reason,
       e.deleted_at AT TIME ZONE 'America/New_York' AS deleted_et,
       jsonb_pretty(e.snapshot)                     AS snapshot
FROM medjobs_excluded_records e
WHERE e.organization_name ILIKE '%village caregiver%'
   OR e.organization_name ILIKE '%cornerstone%';
