-- Migration: Create disputes table for ownership dispute submissions
-- Users who believe a claimed profile belongs to them can submit a dispute.
-- Olera team reviews and resolves manually.

CREATE TABLE IF NOT EXISTS disputes (
  id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id   TEXT         NOT NULL,   -- olera-providers.provider_id
  provider_name TEXT         NOT NULL,   -- denormalised for admin readability
  claimant_name TEXT         NOT NULL,
  claimant_role TEXT         NOT NULL,
  reason        TEXT         NOT NULL,
  status        TEXT         DEFAULT 'pending'
                             CHECK (status IN ('pending', 'resolved', 'rejected')),
  created_at    TIMESTAMPTZ  DEFAULT now()
);
