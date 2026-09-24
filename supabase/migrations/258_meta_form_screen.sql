-- Meta instant forms can now carry one screening question: who the care is for,
-- with a "caregiving job" option. The import records the answer instead of
-- discarding it, and files a self-declared job seeker at the door: archived as
-- looking_for_work, never texted (the confirmation insert below already skips
-- archived leads), never handed to a provider (handToPrimary skips archived).
--
-- Same signature as 231, so the deployed code keeps working before and after:
-- a lead_data without the new keys imports exactly as it did.
CREATE OR REPLACE FUNCTION public.import_meta_city_lead(receipt_id text, lead_data jsonb, confirmation text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE receipt meta_lead_receipts; existing_id uuid; new_lead city_leads; job_seeker boolean;
BEGIN
  SELECT * INTO STRICT receipt FROM meta_lead_receipts WHERE leadgen_id=receipt_id FOR UPDATE;
  IF receipt.status IN ('imported','duplicate','blocked') THEN RETURN receipt.lead_id; END IF;
  -- Use the receipt snapshot even if live configuration changed before retry.
  lead_data := lead_data || jsonb_build_object('is_test', (receipt.form_config->>'testOnly')::boolean,
    'slug', receipt.form_config->>'slug', 'campaign_tag', receipt.form_config->>'campaignTag',
    'consent_form_version', receipt.form_config->>'consentVersion', 'consent_text', receipt.form_config->>'consentText');
  IF (lead_data->>'is_test') IS NULL THEN RAISE EXCEPTION 'Missing receipt test mode'; END IF;
  job_seeker := coalesce((lead_data->>'job_seeker')::boolean, false);
  PERFORM pg_advisory_xact_lock(hashtextextended((lead_data->>'slug') || ':' || (lead_data->>'phone'),0));
  SELECT id INTO existing_id FROM city_leads WHERE meta_lead_id=receipt_id;
  IF existing_id IS NULL THEN
    SELECT id INTO existing_id FROM city_leads WHERE slug=lead_data->>'slug'
      AND phone=lead_data->>'phone' AND is_test=(lead_data->>'is_test')::boolean
      AND created_at >= receipt.submitted_at - interval '24 hours'
      AND created_at <= receipt.submitted_at + interval '24 hours'
      ORDER BY created_at DESC LIMIT 1;
  END IF;
  IF existing_id IS NOT NULL THEN
    UPDATE meta_lead_receipts SET status='duplicate',lead_id=existing_id,last_error=NULL WHERE leadgen_id=receipt_id;
    RETURN existing_id;
  END IF;
  INSERT INTO city_leads(slug,campaign_tag,utm_source,utm_medium,utm_campaign,first_name,phone,email,zip,
    care_type,care_recipient,consent_at,consent_form_version,consent_text,capture_method,meta_lead_id,meta_form_id,
    meta_campaign_id,meta_adset_id,meta_ad_id,is_test,created_at,
    status,next_offer_at,archived_at,archive_reason,archived_by,
    qualification_verdict,qualification_verdict_category,qualification_verdict_reason,qualification_verdict_at)
  VALUES(lead_data->>'slug',lead_data->>'campaign_tag','meta','paid_meta',lead_data->>'campaign_tag',
    lead_data->>'first_name',lead_data->>'phone',lead_data->>'email',lead_data->>'zip','unsure',
    CASE WHEN job_seeker THEN NULL ELSE nullif(lead_data->>'care_recipient','') END,
    receipt.submitted_at,lead_data->>'consent_form_version',lead_data->>'consent_text','meta_instant_form',
    receipt_id,receipt.form_id,lead_data->>'meta_campaign_id',lead_data->>'meta_adset_id',receipt.ad_id,
    (lead_data->>'is_test')::boolean,receipt.submitted_at,
    CASE WHEN job_seeker THEN 'stopped' ELSE 'new' END,
    NULL,
    CASE WHEN job_seeker THEN now() END,
    CASE WHEN job_seeker THEN 'looking_for_work' END,
    CASE WHEN job_seeker THEN 'meta_form' END,
    CASE WHEN job_seeker THEN 'not_care_seeker' END,
    CASE WHEN job_seeker THEN 'looking_for_work' END,
    CASE WHEN job_seeker THEN 'Chose the caregiving-job answer on the Meta form.' END,
    CASE WHEN job_seeker THEN now() END) RETURNING * INTO new_lead;
  -- Existing initial-optout trigger makes suppressed contacts stopped/archived.
  IF new_lead.archived_at IS NULL AND new_lead.status <> 'stopped' AND NOT new_lead.is_test THEN
    INSERT INTO city_lead_messages(lead_id,channel,body,send_after,created_by)
      VALUES(new_lead.id,'sms',confirmation,now(),'meta_native_intake');
  END IF;
  UPDATE meta_lead_receipts SET status=CASE WHEN new_lead.archived_at IS NOT NULL THEN 'blocked' ELSE 'imported' END,
    lead_id=new_lead.id,last_error=NULL WHERE leadgen_id=receipt_id;
  RETURN new_lead.id;
END $$;
REVOKE ALL ON FUNCTION public.import_meta_city_lead(text,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.import_meta_city_lead(text,jsonb,text) TO service_role;
