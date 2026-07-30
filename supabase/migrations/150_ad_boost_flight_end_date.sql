-- Migration: Ad Boost flight end date
--
-- Campaign flights have real, varying end dates in the ad platform (Franchil
-- ran 14 days, Legacy Haven 27) that the platform never stored — the queue
-- could only show the setup week, so "when does/did this flight end" lived in
-- Google Ads alone. Adds an admin-entered end date so the queue can render the
-- flight as a range and wrap-up timing is visible at a glance.
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE ad_campaign_requests ADD COLUMN IF NOT EXISTS flight_end_date DATE;

COMMENT ON COLUMN ad_campaign_requests.flight_end_date IS
'Last serving day of the ad flight, from the ad platform''s campaign dates. Entered by the concierge; shown as the flight range in the admin queue.';
