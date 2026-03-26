-- Removal requests from providers wanting their page hidden or deleted
-- These come from the public removal request form (no auth required)

CREATE TABLE IF NOT EXISTS removal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  provider_slug TEXT,
  full_name TEXT NOT NULL,
  business_email TEXT NOT NULL,
  business_phone TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('hide', 'delete')),
  reason TEXT NOT NULL,
  additional_details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_removal_requests_status ON removal_requests(status);
CREATE INDEX IF NOT EXISTS idx_removal_requests_created ON removal_requests(created_at DESC);

-- RLS: service role only (admin access via service key)
ALTER TABLE removal_requests ENABLE ROW LEVEL SECURITY;
