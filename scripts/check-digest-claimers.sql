-- Find providers who clicked weekly digest emails but have no accounts
-- Weekly digest uses the claim-complete route which tracks "one_click_access" events

SELECT DISTINCT
  bp.slug,
  bp.display_name,
  bp.email,
  bp.claim_state,
  bp.verification_state,
  bp.account_id IS NULL as missing_account,
  COUNT(DISTINCT pa.id) as digest_clicks
FROM business_profiles bp
INNER JOIN provider_activity pa ON 
  (bp.slug = pa.provider_id OR bp.id::text = pa.provider_id)
  AND pa.event_type = 'one_click_access'
  AND (pa.metadata->>'source' = 'claim-complete' OR pa.metadata IS NULL)
WHERE 
  bp.type IN ('organization', 'caregiver')  -- PROVIDERS ONLY
  AND bp.account_id IS NULL  -- No account linked
  AND bp.claim_state = 'unclaimed'  -- Not claimed
GROUP BY bp.id
ORDER BY digest_clicks DESC;
