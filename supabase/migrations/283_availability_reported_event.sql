-- A provider answering "Are you taking new clients?" from building email 2
-- (app/api/provider/availability). Without this the activity insert fails the
-- event_type check and the answer is saved but never logged.
-- Keeps every existing value, including ones added on other branches.
DO $$
DECLARE existing_check text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO existing_check FROM pg_constraint
  WHERE conrelid = 'public.provider_activity'::regclass
    AND conname = 'provider_activity_event_type_check';
  IF existing_check IS NULL THEN RAISE EXCEPTION 'Missing provider activity event constraint'; END IF;
  IF position('availability_reported' in existing_check) > 0 THEN RETURN; END IF;
  ALTER TABLE public.provider_activity DROP CONSTRAINT provider_activity_event_type_check;
  EXECUTE 'ALTER TABLE public.provider_activity ADD CONSTRAINT provider_activity_event_type_check CHECK (' ||
    regexp_replace(existing_check, '^CHECK \((.*)\)$', '\1') ||
    ' OR event_type IN (''availability_reported''))';
END $$;
