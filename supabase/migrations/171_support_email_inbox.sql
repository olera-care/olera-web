-- Migration 171: Gmail-backed support inbox + Olera Support Copilot
--
-- Gmail remains the transport/source of truth. These tables are the durable,
-- queryable operating layer: full-history sync state, normalized messages,
-- Olera identity links, human workflow state, agent recommendations, and an
-- immutable action trail. Backfill is deliberately unbounded. The sync worker
-- walks Gmail's page tokens until the entire mailbox has been imported, then
-- stays current from Gmail history cursors.
--
-- Apply via Supabase dashboard SQL editor (NOT CLI).

CREATE TABLE IF NOT EXISTS support_mailboxes (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                           text NOT NULL UNIQUE,
  provider                        text NOT NULL DEFAULT 'gmail' CHECK (provider = 'gmail'),
  encrypted_refresh_token         text,
  oauth_scopes                    text[] NOT NULL DEFAULT '{}',
  gmail_history_id                text,
  watch_expiration                timestamptz,
  full_sync_page_token            text,
  full_sync_complete              boolean NOT NULL DEFAULT false,
  full_sync_messages_imported     bigint NOT NULL DEFAULT 0,
  sync_status                     text NOT NULL DEFAULT 'disconnected'
    CHECK (sync_status IN ('disconnected', 'backfilling', 'connected', 'error')),
  last_sync_at                    timestamptz,
  last_error                      text,
  connected_by                    text,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_email_threads (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id            uuid NOT NULL REFERENCES support_mailboxes(id) ON DELETE CASCADE,
  gmail_thread_id       text NOT NULL,
  subject               text NOT NULL DEFAULT '(no subject)',
  snippet               text NOT NULL DEFAULT '',
  participants          jsonb NOT NULL DEFAULT '[]'::jsonb,
  gmail_label_ids       text[] NOT NULL DEFAULT '{}',
  last_message_at       timestamptz NOT NULL,
  message_count         integer NOT NULL DEFAULT 0,
  unread                boolean NOT NULL DEFAULT false,

  state                 text NOT NULL DEFAULT 'handled'
    CHECK (state IN ('needs_reply', 'handled', 'snoozed', 'escalated', 'noise')),
  category              text NOT NULL DEFAULT 'other'
    CHECK (category IN (
      'care_seeker', 'provider', 'partner', 'marketing', 'automated',
      'legal', 'security', 'billing', 'voicemail', 'internal', 'other'
    )),
  priority              text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to           text,
  snoozed_until         timestamptz,
  handled_at            timestamptz,
  handled_by            text,

  matched_profile_id    uuid,
  matched_profile_type  text CHECK (matched_profile_type IN ('family', 'provider', 'student')),
  matched_profile_name  text,
  matched_provider_id   text,

  agent_summary         text,
  agent_reason          text,
  agent_confidence      numeric(4,3) CHECK (agent_confidence BETWEEN 0 AND 1),
  suggested_action      text CHECK (suggested_action IN (
    'draft_reply', 'archive', 'unsubscribe', 'escalate', 'call_back',
    'provider_removal', 'do_not_contact', 'create_task', 'no_action'
  )),
  suggested_owner       text,
  suggested_draft       text,
  agent_risk_flags      text[] NOT NULL DEFAULT '{}',
  analyzed_at           timestamptz,
  analysis_message_id   text,

  gmail_draft_id        text,
  draft_body            text,
  draft_updated_at      timestamptz,
  draft_updated_by      text,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mailbox_id, gmail_thread_id)
);

CREATE INDEX IF NOT EXISTS idx_support_threads_queue
  ON support_email_threads (state, priority, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_threads_mailbox_recent
  ON support_email_threads (mailbox_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_threads_profile
  ON support_email_threads (matched_profile_id) WHERE matched_profile_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS support_email_messages (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id            uuid NOT NULL REFERENCES support_mailboxes(id) ON DELETE CASCADE,
  thread_id             uuid NOT NULL REFERENCES support_email_threads(id) ON DELETE CASCADE,
  gmail_message_id      text NOT NULL,
  rfc_message_id        text,
  direction             text NOT NULL CHECK (direction IN ('in', 'out')),
  from_email            text,
  from_name             text,
  to_emails             text[] NOT NULL DEFAULT '{}',
  cc_emails             text[] NOT NULL DEFAULT '{}',
  reply_to              text,
  subject               text NOT NULL DEFAULT '(no subject)',
  snippet               text NOT NULL DEFAULT '',
  body_text             text NOT NULL DEFAULT '',
  gmail_label_ids       text[] NOT NULL DEFAULT '{}',
  raw_headers           jsonb NOT NULL DEFAULT '{}'::jsonb,
  internal_date         timestamptz NOT NULL,
  has_attachments       boolean NOT NULL DEFAULT false,
  attachments           jsonb NOT NULL DEFAULT '[]'::jsonb,
  list_unsubscribe      text[] NOT NULL DEFAULT '{}',
  list_unsubscribe_post boolean NOT NULL DEFAULT false,
  auto_submitted        text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mailbox_id, gmail_message_id)
);

CREATE INDEX IF NOT EXISTS idx_support_messages_thread
  ON support_email_messages (thread_id, internal_date ASC);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender
  ON support_email_messages (lower(from_email)) WHERE direction = 'in';

CREATE TABLE IF NOT EXISTS support_email_recommendations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id             uuid NOT NULL REFERENCES support_email_threads(id) ON DELETE CASCADE,
  gmail_message_id      text NOT NULL,
  category              text NOT NULL,
  priority              text NOT NULL,
  summary               text NOT NULL,
  reason                text NOT NULL,
  confidence            numeric(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  suggested_action      text NOT NULL,
  suggested_owner       text,
  suggested_draft       text,
  risk_flags            text[] NOT NULL DEFAULT '{}',
  model                  text NOT NULL,
  feedback               text CHECK (feedback IN ('correct', 'incorrect')),
  feedback_note          text,
  feedback_by            text,
  feedback_at            timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thread_id, gmail_message_id)
);

CREATE TABLE IF NOT EXISTS support_email_actions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id             uuid NOT NULL REFERENCES support_email_threads(id) ON DELETE CASCADE,
  action                text NOT NULL,
  actor                  text NOT NULL,
  details                jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_actions_thread
  ON support_email_actions (thread_id, created_at DESC);

-- Gmail Pub/Sub only tells us "mailbox X advanced to history Y". The Edge
-- Function records that tiny notification here and acknowledges immediately;
-- the authenticated cron worker performs the Gmail reads and AI work.
CREATE TABLE IF NOT EXISTS support_email_events (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pubsub_message_id     text UNIQUE,
  mailbox_email         text NOT NULL,
  gmail_history_id      text NOT NULL,
  published_at          timestamptz,
  processed_at          timestamptz,
  error                 text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_events_pending
  ON support_email_events (created_at ASC) WHERE processed_at IS NULL;

ALTER TABLE support_mailboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_email_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_email_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_email_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE support_mailboxes IS
  'Connected Gmail support mailboxes and resumable full-history/incremental sync cursors.';
COMMENT ON TABLE support_email_threads IS
  'Admin support queue state and current Olera Support Copilot recommendation, keyed to Gmail thread.';
COMMENT ON TABLE support_email_messages IS
  'Normalized Gmail messages. Gmail owns transport; this copy powers Olera context, search, and agent analysis.';
COMMENT ON TABLE support_email_events IS
  'Minimal Gmail Pub/Sub queue. Supabase Edge writes; authenticated support-email-sync cron consumes.';
