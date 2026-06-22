-- ============================================================
-- Widen connections.type CHECK to include MedJobs connection types
-- Original constraint: ('inquiry', 'save', 'match', 'request')
-- Adding: 'application', 'invitation', 'dismiss'
-- These types are already in the TypeScript ConnectionType union
-- but were never added to the DB constraint.
-- ============================================================

ALTER TABLE public.connections DROP CONSTRAINT IF EXISTS connections_type_check;
ALTER TABLE public.connections ADD CONSTRAINT connections_type_check
  CHECK (type IN ('inquiry', 'save', 'match', 'request', 'application', 'invitation', 'dismiss'));
