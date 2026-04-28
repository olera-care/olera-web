-- Migration: Add per-step benefits funnel events to provider_activity event_type CHECK
--
-- Context: PR B of the benefits intake conversion lift work introduces three
-- new event types fired from /api/benefits/track-step:
--   - benefits_entry_viewed   → fires once when BenefitsDiscoveryModule mounts
--                                (gives us the visit→started denominator we
--                                 don't have today)
--   - benefits_step_viewed    → fires on each step mount with step_number,
--                                step_name. Deduped per session.
--   - benefits_step_completed → fires on each step submit with time_on_step_ms.
--                                Not deduped (back-button + resubmit is real).
--
-- All three are written to provider_activity (matching where benefits_started
-- already lives) keyed on providerSlug. Without this CHECK update, every
-- insert from the new route fails silently (the route is fire-and-forget;
-- the client never sees the rejection).
--
-- The admin analytics summary at app/api/admin/analytics/summary/route.ts
-- uses an exact-match allowlist on event_type, so these new types will not
-- inflate the existing benefits_started / benefits_completed KPIs.
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE provider_activity DROP CONSTRAINT IF EXISTS provider_activity_event_type_check;
ALTER TABLE provider_activity ADD CONSTRAINT provider_activity_event_type_check
  CHECK (event_type IN (
    'email_click',
    'page_view',
    'lead_opened',
    'lead_received',
    'question_received',
    'question_responded',
    'review_viewed',
    'review_received',
    'one_click_access',
    'contact_revealed',
    'reviews_cta_clicked',
    'suspicious_claim',
    'search_click',
    'cta_click_public',
    'analytics_teaser_impression',
    'analytics_teaser_cta_clicked',
    'benefits_started',
    'claim_completed',
    'benefits_entry_viewed',
    'benefits_step_viewed',
    'benefits_step_completed'
  ));
