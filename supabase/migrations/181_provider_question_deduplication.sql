-- Canonical provider question topics + append-only family ask receipts.
--
-- Provider UX is topic-based: one thread, one provider notification, one
-- answer. Family UX and attribution are submission-based: every tap retains
-- its asker, timestamp, session, and managed-ad attribution.

CREATE OR REPLACE FUNCTION normalize_provider_question(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT trim(
    regexp_replace(
      regexp_replace(lower(replace(trim(COALESCE(input, '')), '’', '''')), '[?.!,]+$', '', 'g'),
      '\s+',
      ' ',
      'g'
    )
  );
$$;

ALTER TABLE provider_questions
  ADD COLUMN IF NOT EXISTS normalized_question TEXT,
  ADD COLUMN IF NOT EXISTS suggestion_key TEXT,
  ADD COLUMN IF NOT EXISTS provider_identity_key TEXT,
  ADD COLUMN IF NOT EXISTS canonical_question_id UUID REFERENCES provider_questions(id),
  ADD COLUMN IF NOT EXISTS asked_count INTEGER NOT NULL DEFAULT 1;

ALTER TABLE provider_questions
  DROP CONSTRAINT IF EXISTS provider_questions_asked_count_check;
ALTER TABLE provider_questions
  ADD CONSTRAINT provider_questions_asked_count_check CHECK (asked_count >= 1);

UPDATE provider_questions
SET normalized_question = normalize_provider_question(question)
WHERE normalized_question IS DISTINCT FROM normalize_provider_question(question);

-- Claimed accounts already have the stable identity migration 129 introduced.
UPDATE provider_questions
SET provider_identity_key = 'bp:' || business_profile_id::text
WHERE business_profile_id IS NOT NULL;

-- Resolve unclaimed directory rows across either stored URL identifier.
UPDATE provider_questions pq
SET provider_identity_key = 'directory:' || op.provider_id
FROM "olera-providers" op
WHERE pq.business_profile_id IS NULL
  AND pq.provider_identity_key IS NULL
  AND op.deleted IS NOT TRUE
  AND (pq.provider_id = op.provider_id OR pq.provider_id = op.slug);

UPDATE provider_questions
SET provider_identity_key = 'provider:' || provider_id
WHERE provider_identity_key IS NULL;

CREATE OR REPLACE FUNCTION set_provider_question_derived_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.normalized_question := normalize_provider_question(NEW.question);
  NEW.provider_identity_key := COALESCE(
    NEW.provider_identity_key,
    CASE
      WHEN NEW.business_profile_id IS NOT NULL THEN 'bp:' || NEW.business_profile_id::text
      ELSE 'provider:' || NEW.provider_id
    END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS provider_questions_derive_fields ON provider_questions;
CREATE TRIGGER provider_questions_derive_fields
BEFORE INSERT OR UPDATE OF question, provider_id, business_profile_id ON provider_questions
FOR EACH ROW EXECUTE FUNCTION set_provider_question_derived_fields();

ALTER TABLE provider_questions
  ALTER COLUMN normalized_question SET NOT NULL,
  ALTER COLUMN provider_identity_key SET NOT NULL;

CREATE TABLE IF NOT EXISTS provider_question_asks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES provider_questions(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  provider_identity_key TEXT NOT NULL,
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE SET NULL,
  asker_name TEXT NOT NULL DEFAULT 'Anonymous',
  asker_email TEXT,
  asker_user_id UUID,
  original_question TEXT NOT NULL,
  normalized_question TEXT NOT NULL,
  suggestion_key TEXT,
  session_id TEXT,
  visit_id TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  answer_notification_reserved_at TIMESTAMPTZ,
  answer_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_question_asks_question
  ON provider_question_asks(question_id, created_at);
CREATE INDEX IF NOT EXISTS idx_provider_question_asks_provider_created
  ON provider_question_asks(provider_identity_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_question_asks_campaign
  ON provider_question_asks(utm_source, utm_campaign, created_at DESC)
  WHERE utm_campaign IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_provider_question_asks_answer_notification
  ON provider_question_asks(question_id, answer_notified_at)
  WHERE asker_email IS NOT NULL;

ALTER TABLE provider_question_asks ENABLE ROW LEVEL SECURITY;

-- Build one deterministic mapping before mutating any legacy rows. Preserve an
-- answered thread first; otherwise keep the earliest provider-facing thread.
CREATE TEMP TABLE question_dedup_map ON COMMIT DROP AS
SELECT
  id AS legacy_question_id,
  first_value(id) OVER (
    PARTITION BY provider_identity_key, normalized_question
    ORDER BY
      CASE WHEN NULLIF(trim(answer), '') IS NOT NULL THEN 0 ELSE 1 END,
      created_at ASC,
      id ASC
  ) AS canonical_question_id,
  count(*) OVER (
    PARTITION BY provider_identity_key, normalized_question
  ) AS topic_ask_count
FROM provider_questions;

-- Every historical row becomes one immutable ask receipt before duplicate
-- threads are archived. Published historical answers are marked notified to
-- prevent a deployment-time email blast; future asks remain independently
-- notifiable.
INSERT INTO provider_question_asks (
  question_id,
  provider_id,
  provider_identity_key,
  business_profile_id,
  asker_name,
  asker_email,
  asker_user_id,
  original_question,
  normalized_question,
  suggestion_key,
  session_id,
  visit_id,
  utm_source,
  utm_campaign,
  metadata,
  answer_notified_at,
  created_at,
  updated_at
)
SELECT
  map.canonical_question_id,
  legacy.provider_id,
  legacy.provider_identity_key,
  legacy.business_profile_id,
  legacy.asker_name,
  legacy.asker_email,
  legacy.asker_user_id,
  legacy.question,
  legacy.normalized_question,
  legacy.suggestion_key,
  legacy.metadata->>'session_id',
  legacy.metadata->>'visit_id',
  legacy.metadata->>'utm_source',
  legacy.metadata->>'utm_campaign',
  COALESCE(legacy.metadata, '{}'::jsonb) || jsonb_build_object(
    'legacy_question_id', legacy.id,
    'legacy_status', legacy.status,
    'legacy_answer', legacy.answer,
    'legacy_answer_status', legacy.answer_status
  ),
  CASE
    WHEN canonical.answer_status = 'published' AND NULLIF(trim(canonical.answer), '') IS NOT NULL
      THEN COALESCE(canonical.answered_at, canonical.updated_at, now())
    ELSE NULL
  END,
  legacy.created_at,
  legacy.updated_at
FROM provider_questions legacy
JOIN question_dedup_map map ON map.legacy_question_id = legacy.id
JOIN provider_questions canonical ON canonical.id = map.canonical_question_id;

UPDATE provider_questions canonical
SET
  asked_count = grouped.topic_ask_count,
  metadata = COALESCE(canonical.metadata, '{}'::jsonb) ||
    CASE WHEN grouped.topic_ask_count > 1 THEN jsonb_build_object(
      'duplicate_rows_consolidated', grouped.topic_ask_count - 1,
      'deduplicated_at', now()
    ) ELSE '{}'::jsonb END,
  updated_at = CASE
    WHEN grouped.topic_ask_count > 1 THEN now()
    ELSE canonical.updated_at
  END
FROM (
  SELECT canonical_question_id, max(topic_ask_count) AS topic_ask_count
  FROM question_dedup_map
  GROUP BY canonical_question_id
) grouped
WHERE canonical.id = grouped.canonical_question_id;

UPDATE provider_questions duplicate
SET
  canonical_question_id = map.canonical_question_id,
  status = 'archived',
  is_public = false,
  metadata = COALESCE(duplicate.metadata, '{}'::jsonb) || jsonb_build_object(
    'duplicate_question', true,
    'duplicate_of_question_id', map.canonical_question_id,
    'deduplicated_at', now()
  ),
  updated_at = now()
FROM question_dedup_map map
WHERE duplicate.id = map.legacy_question_id
  AND duplicate.id <> map.canonical_question_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_questions_topic_text_unique
  ON provider_questions(provider_identity_key, normalized_question)
  WHERE canonical_question_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_questions_topic_suggestion_unique
  ON provider_questions(provider_identity_key, suggestion_key)
  WHERE canonical_question_id IS NULL AND suggestion_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_provider_questions_canonical
  ON provider_questions(canonical_question_id)
  WHERE canonical_question_id IS NOT NULL;

COMMENT ON COLUMN provider_questions.canonical_question_id IS
  'Non-null only on archived legacy duplicate threads. Points to the provider-facing canonical topic.';
COMMENT ON COLUMN provider_questions.asked_count IS
  'Number of append-only provider_question_asks receipts attached to this canonical topic.';
COMMENT ON TABLE provider_question_asks IS
  'Append-only family submissions behind canonical provider question topics. Source of truth for raw taps and answer fan-out.';

-- Atomically find/create one provider topic and always append the individual
-- family ask. The unique indexes are the concurrency boundary.
CREATE OR REPLACE FUNCTION record_provider_question_ask(
  p_provider_id TEXT,
  p_provider_identity_key TEXT,
  p_business_profile_id UUID,
  p_question TEXT,
  p_normalized_question TEXT,
  p_suggestion_key TEXT,
  p_asker_name TEXT,
  p_asker_email TEXT,
  p_asker_user_id UUID,
  p_status TEXT,
  p_is_public BOOLEAN,
  p_question_metadata JSONB,
  p_session_id TEXT,
  p_visit_id TEXT,
  p_utm_source TEXT,
  p_utm_campaign TEXT,
  p_ask_metadata JSONB
)
RETURNS TABLE (
  question_id UUID,
  ask_id UUID,
  is_new_topic BOOLEAN,
  question TEXT,
  answer TEXT,
  asker_name TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  normalized_question TEXT,
  suggestion_key TEXT,
  asked_count INTEGER,
  answer_status TEXT,
  is_public BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  topic provider_questions%ROWTYPE;
  appended_ask_id UUID;
  created_topic BOOLEAN := false;
BEGIN
  SELECT pq.* INTO topic
  FROM provider_questions pq
  WHERE pq.canonical_question_id IS NULL
    AND pq.provider_identity_key = p_provider_identity_key
    AND (
      (p_suggestion_key IS NOT NULL AND pq.suggestion_key = p_suggestion_key)
      OR pq.normalized_question = p_normalized_question
    )
  ORDER BY
    CASE WHEN p_suggestion_key IS NOT NULL AND pq.suggestion_key = p_suggestion_key THEN 0 ELSE 1 END,
    pq.created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF topic.id IS NULL THEN
    BEGIN
      INSERT INTO provider_questions (
        provider_id,
        provider_identity_key,
        business_profile_id,
        question,
        normalized_question,
        suggestion_key,
        asker_name,
        asker_email,
        asker_user_id,
        status,
        is_public,
        metadata,
        asked_count
      ) VALUES (
        p_provider_id,
        p_provider_identity_key,
        p_business_profile_id,
        p_question,
        p_normalized_question,
        p_suggestion_key,
        COALESCE(NULLIF(p_asker_name, ''), 'Anonymous'),
        p_asker_email,
        p_asker_user_id,
        p_status,
        p_is_public,
        COALESCE(p_question_metadata, '{}'::jsonb),
        1
      )
      RETURNING * INTO topic;
      created_topic := true;
    EXCEPTION WHEN unique_violation THEN
      SELECT pq.* INTO topic
      FROM provider_questions pq
      WHERE pq.canonical_question_id IS NULL
        AND pq.provider_identity_key = p_provider_identity_key
        AND (
          (p_suggestion_key IS NOT NULL AND pq.suggestion_key = p_suggestion_key)
          OR pq.normalized_question = p_normalized_question
        )
      ORDER BY pq.created_at ASC
      LIMIT 1
      FOR UPDATE;
    END;
  END IF;

  IF topic.id IS NULL THEN
    RAISE EXCEPTION 'Unable to resolve canonical provider question topic';
  END IF;

  IF NOT created_topic THEN
    UPDATE provider_questions pq
    SET
      asked_count = pq.asked_count + 1,
      suggestion_key = COALESCE(pq.suggestion_key, p_suggestion_key),
      updated_at = now()
    WHERE pq.id = topic.id
    RETURNING * INTO topic;
  END IF;

  INSERT INTO provider_question_asks (
    question_id,
    provider_id,
    provider_identity_key,
    business_profile_id,
    asker_name,
    asker_email,
    asker_user_id,
    original_question,
    normalized_question,
    suggestion_key,
    session_id,
    visit_id,
    utm_source,
    utm_campaign,
    metadata
  ) VALUES (
    topic.id,
    p_provider_id,
    p_provider_identity_key,
    p_business_profile_id,
    COALESCE(NULLIF(p_asker_name, ''), 'Anonymous'),
    p_asker_email,
    p_asker_user_id,
    p_question,
    p_normalized_question,
    p_suggestion_key,
    p_session_id,
    p_visit_id,
    p_utm_source,
    p_utm_campaign,
    COALESCE(p_ask_metadata, '{}'::jsonb)
  ) RETURNING id INTO appended_ask_id;

  RETURN QUERY SELECT
    topic.id,
    appended_ask_id,
    created_topic,
    topic.question,
    topic.answer,
    topic.asker_name,
    topic.status,
    topic.created_at,
    topic.normalized_question,
    topic.suggestion_key,
    topic.asked_count,
    topic.answer_status,
    topic.is_public;
END;
$$;

REVOKE ALL ON FUNCTION record_provider_question_ask(
  TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, BOOLEAN,
  JSONB, TEXT, TEXT, TEXT, TEXT, JSONB
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_provider_question_ask(
  TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, BOOLEAN,
  JSONB, TEXT, TEXT, TEXT, TEXT, JSONB
) TO service_role;

-- Reserve email recipients before sending so concurrent publication paths do
-- not notify the same asker twice. Failed sends release their reservation.
CREATE OR REPLACE FUNCTION reserve_provider_question_answer_notifications(p_question_id UUID)
RETURNS SETOF provider_question_asks
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE provider_question_asks
  SET answer_notification_reserved_at = now(),
      updated_at = now()
  WHERE question_id = p_question_id
    AND asker_email IS NOT NULL
    AND answer_notified_at IS NULL
    AND (
      answer_notification_reserved_at IS NULL
      OR answer_notification_reserved_at < now() - interval '15 minutes'
    )
  RETURNING *;
$$;

REVOKE ALL ON FUNCTION reserve_provider_question_answer_notifications(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reserve_provider_question_answer_notifications(UUID) TO service_role;

-- Repair missing claimed-profile categories from their exact linked directory
-- rows. Runtime inheritance mirrors this for rows created before migration.
UPDATE business_profiles bp
SET category = CASE op.provider_category
  WHEN 'Home Care (Non-medical)' THEN 'home_care_agency'
  WHEN 'Home Health Care' THEN 'home_health_agency'
  WHEN 'Assisted Living' THEN 'assisted_living'
  WHEN 'Assisted Living | Independent Living' THEN 'assisted_living'
  WHEN 'Independent Living' THEN 'independent_living'
  WHEN 'Memory Care' THEN 'memory_care'
  WHEN 'Memory Care | Assisted Living' THEN 'memory_care'
  WHEN 'Nursing Home' THEN 'nursing_home'
  WHEN 'Hospice' THEN 'hospice_agency'
  ELSE bp.category
END
FROM "olera-providers" op
WHERE bp.source_provider_id = op.provider_id
  AND bp.category IS NULL
  AND op.deleted IS NOT TRUE
  AND op.provider_category IN (
    'Home Care (Non-medical)', 'Home Health Care', 'Assisted Living',
    'Assisted Living | Independent Living', 'Independent Living',
    'Memory Care', 'Memory Care | Assisted Living', 'Nursing Home', 'Hospice'
  );
