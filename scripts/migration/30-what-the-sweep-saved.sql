-- ===========================================================================
-- 30 — what the advisor sweep actually saved (READ ONLY)
-- ===========================================================================
-- The board draws a swept office the moment it is added, before the server
-- has answered, and what it draws carries only the name — every other field
-- is a blank placeholder. Production does not refetch afterwards, so an
-- office can look empty on screen while the record behind it is complete.
--
-- This reads the database directly. If the columns below are filled, nothing
-- was lost and the screen was showing you a placeholder.
-- ===========================================================================

SELECT c.name AS campus,
       o.organization_name,
       o.research_data->>'found_by'  AS created_by_sweep,
       o.research_data->>'website'   AS website,
       o.research_data->>'address'   AS address,
       ct.name                       AS primary_contact,
       ct.role,
       ct.phone,
       ct.email,
       o.created_at AT TIME ZONE 'America/New_York' AS created_et
FROM student_outreach o
JOIN student_outreach_campuses c ON c.id = o.campus_id
LEFT JOIN student_outreach_contacts ct
       ON ct.outreach_id = o.id AND ct.is_primary
WHERE o.kind = 'advisor'
ORDER BY o.created_at DESC;

-- Every contact on every advisor record, in case more than one was entered.
SELECT o.organization_name, ct.is_primary, ct.name, ct.role, ct.phone, ct.email
FROM student_outreach_contacts ct
JOIN student_outreach o ON o.id = ct.outreach_id
WHERE o.kind = 'advisor'
ORDER BY o.organization_name, ct.is_primary DESC, ct.created_at;
