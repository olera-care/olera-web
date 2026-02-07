-- Provider Portal Tables Migration
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query
-- Created: 2026-02-06
-- Purpose: Create tables for web provider portal (PR #21 integration)

-- ============================================
-- 1. ACCOUNTS TABLE
-- User identity for web portal users
-- Note: iOS uses "profiles" table for this purpose
-- ============================================

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active_profile_id UUID, -- Will reference business_profiles after that table exists
  display_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

COMMENT ON TABLE accounts IS 'Web portal user accounts. iOS uses the "profiles" table for user identity.';

-- ============================================
-- 2. BUSINESS_PROFILES TABLE
-- Organizations, caregivers, and families
-- Renamed from Logan's "profiles" to avoid iOS conflict
-- ============================================

CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  source_provider_id TEXT, -- Links to olera-providers.provider_id when claiming existing listing
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('organization', 'caregiver', 'family')),
  category TEXT, -- e.g., 'home_care', 'assisted_living', etc.
  display_name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  service_area TEXT,
  care_types TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  claim_state TEXT DEFAULT 'unclaimed' CHECK (claim_state IN ('unclaimed', 'pending', 'claimed', 'rejected')),
  verification_state TEXT DEFAULT 'unverified' CHECK (verification_state IN ('unverified', 'pending', 'verified')),
  source TEXT DEFAULT 'user_created',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Now add the foreign key for active_profile_id
ALTER TABLE accounts
ADD CONSTRAINT fk_accounts_active_profile
FOREIGN KEY (active_profile_id) REFERENCES business_profiles(id) ON DELETE SET NULL;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_business_profiles_account_id ON business_profiles(account_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_source_provider ON business_profiles(source_provider_id) WHERE source_provider_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_business_profiles_slug ON business_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_business_profiles_type ON business_profiles(type);
CREATE INDEX IF NOT EXISTS idx_business_profiles_city_state ON business_profiles(city, state);

COMMENT ON TABLE business_profiles IS 'Business entities (orgs, caregivers, families). Named to avoid conflict with iOS "profiles" table. source_provider_id links to olera-providers when claiming existing listings.';

-- ============================================
-- 3. MEMBERSHIPS TABLE
-- Subscription and billing information
-- ============================================

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'professional', 'enterprise')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly', NULL)),
  status TEXT DEFAULT 'free' CHECK (status IN ('free', 'trial', 'active', 'past_due', 'canceled')),
  trial_ends_at TIMESTAMPTZ,
  current_period_ends_at TIMESTAMPTZ,
  free_responses_used INTEGER DEFAULT 0,
  free_responses_reset_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for account lookups
CREATE INDEX IF NOT EXISTS idx_memberships_account_id ON memberships(account_id);

COMMENT ON TABLE memberships IS 'Subscription and billing info for web portal users.';

-- ============================================
-- 4. CONNECTIONS TABLE
-- Inquiries, saves, and matches between profiles
-- Note: iOS uses "conversations" for chat threads
-- ============================================

CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  to_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('inquiry', 'save', 'match', 'request')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_connections_from_profile ON connections(from_profile_id);
CREATE INDEX IF NOT EXISTS idx_connections_to_profile ON connections(to_profile_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);

COMMENT ON TABLE connections IS 'Inquiries/saves between business profiles. iOS uses "conversations" for chat.';

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- ACCOUNTS: Users can only access their own account
CREATE POLICY "Users can view own account" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own account" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own account" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- BUSINESS_PROFILES: Users can manage profiles they own, everyone can view active profiles
CREATE POLICY "Anyone can view active profiles" ON business_profiles
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can manage own profiles" ON business_profiles
  FOR ALL USING (
    account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid())
  );

-- MEMBERSHIPS: Users can only see their own membership
CREATE POLICY "Users can view own membership" ON memberships
  FOR SELECT USING (
    account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own membership" ON memberships
  FOR UPDATE USING (
    account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid())
  );

-- CONNECTIONS: Users can see connections involving their profiles
CREATE POLICY "Users can view own connections" ON connections
  FOR SELECT USING (
    from_profile_id IN (SELECT id FROM business_profiles WHERE account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()))
    OR
    to_profile_id IN (SELECT id FROM business_profiles WHERE account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can create connections from own profiles" ON connections
  FOR INSERT WITH CHECK (
    from_profile_id IN (SELECT id FROM business_profiles WHERE account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can update own connections" ON connections
  FOR UPDATE USING (
    from_profile_id IN (SELECT id FROM business_profiles WHERE account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()))
  );

-- ============================================
-- 6. SERVICE ROLE BYPASS
-- Allows server-side operations (ensure-account API)
-- ============================================

-- Service role can bypass RLS for account creation
CREATE POLICY "Service role can manage accounts" ON accounts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage profiles" ON business_profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage memberships" ON memberships
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 7. UPDATED_AT TRIGGER
-- Auto-update updated_at on row changes
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION
-- Run these to confirm tables were created
-- ============================================

-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('accounts', 'business_profiles', 'memberships', 'connections');
