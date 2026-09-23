-- Atomic reservation for the building care services email.
-- Same pattern as reserve_building_facility_manager: one durable attempt per provider,
-- a worker crash leaves a visible pending row, never a resend loop.
-- Uses 5-day digest deferral (longer than the 3-day window for earlier building emails).
BEGIN;
CREATE OR REPLACE FUNCTION public.reserve_building_care_services(p_profile_id uuid, p_email text)
RETURNS uuid LANGUAGE plpgsql SET search_path = public AS $$
DECLARE p public.business_profiles%ROWTYPE; log_id uuid;
BEGIN
  SELECT * INTO p FROM business_profiles WHERE id = p_profile_id FOR UPDATE;
  IF NOT FOUND OR p.type <> 'organization' OR p.account_id IS NULL OR p.email IS NULL
    OR p.email IS DISTINCT FROM p_email
    OR p.metadata->>'building_care_services_attempt_id' IS NOT NULL
    OR p.metadata->>'admin_archived' = 'true'
  THEN RETURN NULL; END IF;
  -- Defer if a provider digest was sent in the last 5 days. Care services uses a
  -- wider deferral window than earlier building emails (3 days) to avoid stacking
  -- with both the digest and any recent building emails.
  IF EXISTS (SELECT 1 FROM email_log e
    WHERE e.email_type = 'weekly_analytics_digest'
      AND e.created_at >= now() - interval '5 days'
      AND (lower(e.recipient) = lower(p.email) OR e.provider_id IN (p.id::text, p.slug, p.source_provider_id))
      AND e.status NOT IN ('failed', 'suppressed')
      AND (e.resend_id IS NOT NULL OR e.status IN ('sent','delivered','opened','clicked'))
      AND coalesce(e.error_message, '') !~* '^(suppressed:|skipped:)'
  ) THEN RETURN NULL; END IF;
  INSERT INTO email_log (recipient, subject, email_type, recipient_type, provider_id, status)
  VALUES (p.email, 'Do you offer these services?', 'building_care_services', 'provider', p.id::text, 'pending')
  RETURNING id INTO log_id;
  UPDATE business_profiles SET metadata = COALESCE(metadata, '{}'::jsonb) ||
    jsonb_build_object('building_care_services_attempt_id', log_id, 'building_care_services_attempted_at', now())
    WHERE id = p_profile_id;
  RETURN log_id;
END $$;
REVOKE ALL ON FUNCTION public.reserve_building_care_services(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_building_care_services(uuid,text) TO service_role;

-- Starts paused until copy QA and staging dry run are complete.
INSERT INTO cron_config (job_id, enabled, paused_reason)
VALUES ('building-care-services', false, 'Awaiting copy QA and staging dry run')
ON CONFLICT (job_id) DO UPDATE SET enabled = false, paused_reason = EXCLUDED.paused_reason;
COMMIT;
