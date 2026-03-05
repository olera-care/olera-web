# Olera v1.0 → v2.0 DNS Cutover Runbook

> **Owner:** TJ | **Estimated time:** ~30 minutes | **Rollback time:** ~5 minutes
> **Prerequisites:** All migration sanity check items resolved (see `docs/migration-sanity-check.md`)

---

## Before Cutover Day

### 1. Pre-flight checks (do these the day before)

- [ ] **Staging QA pass** — walk through key flows on staging-olera2-web.vercel.app:
  - Homepage loads, search works
  - Provider page loads (try 3-4 different providers)
  - Power pages load (e.g., `/assisted-living/florida/miami`)
  - `/caregiver-support` articles load
  - `/community` page loads
  - Auth flow works (sign in via Google, sign in via email OTP)
  - Portal loads after auth
  - Provider dashboard loads after provider auth
  - `/for-providers/claim` flow works
- [ ] **Verify env vars on production Vercel project** — ensure these are set:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - All Stripe keys (if applicable)
  - Any other production secrets
- [ ] **Verify redirects work on staging** — test a few from each tier:
  - `/provider/sign-up` → `/for-providers`
  - `/assisted-living/fl` → `/assisted-living/florida`
  - `/caregiver-forum/some-topic` → `/community`
  - `/provider-portal` → `/portal`
- [ ] **Note the v2.0 production deployment URL** — go to Vercel dashboard → v2.0 project → Deployments → copy the unique URL (looks like `olera-web-xxxx-olera.vercel.app`)
- [ ] **Confirm Cloudflare access** — log in and verify you can edit DNS records for olera.care
- [ ] **Notify the team** — let everyone know cutover is happening and when

---

## Cutover Steps

### Phase 1: Prepare (5 min)

```bash
# 1. Get the latest production deployment URL from Vercel
#    Dashboard → olera-web project → Deployments → latest "Production" → copy URL
#    Example: olera-web-abc123-olera.vercel.app
DEPLOY_URL="olera-web-XXXXX-olera.vercel.app"  # replace with actual

# 2. Verify it loads
curl -sI "https://$DEPLOY_URL" | head -5
# Should show HTTP/2 200
```

- [ ] Deployment URL noted: `___________________________`
- [ ] Deployment loads correctly

### Phase 2: Cloudflare DNS (2 min)

- [ ] Log into Cloudflare → olera.care → DNS
- [ ] For EACH DNS record pointing to Vercel (A/CNAME for `@` and `www`):
  - Click Edit
  - Ensure **Proxy status** is **DNS only** (gray cloud, NOT orange)
  - Save
- [ ] Verify: `dig olera.care` should show Vercel IP (76.76.21.21 or similar), NOT Cloudflare IPs

### Phase 3: Alias swap (2 min — this is the actual switch)

```bash
# 3. Point olera.care to v2.0 deployment
vercel alias set $DEPLOY_URL olera.care

# 4. Point www.olera.care to same deployment
vercel alias set $DEPLOY_URL www.olera.care
```

> **olera.care is now serving v2.0.** The switch is instant.

- [ ] `vercel alias set` succeeded for apex domain
- [ ] `vercel alias set` succeeded for www

### Phase 4: Verify (5 min)

```bash
# 5. Quick smoke test
curl -sI "https://olera.care" | head -10
# Should show HTTP/2 200, x-powered-by: Next.js (or similar v2 indicator)

# 6. Test a provider page
curl -sI "https://olera.care/provider/home-instead-houston-southwest" | head -5

# 7. Test a redirect
curl -sI "https://olera.care/provider/sign-up" | head -5
# Should show 308 or 301 → /for-providers

# 8. Test a middleware redirect
curl -sI "https://olera.care/assisted-living/fl" | head -5
# Should show 301 → /assisted-living/florida
```

- [ ] Homepage loads on olera.care
- [ ] Provider page loads
- [ ] Redirects working (static)
- [ ] Redirects working (middleware)
- [ ] Auth flow works on production domain
- [ ] Sitemap accessible: `https://olera.care/sitemap.xml`

### Phase 5: Make it permanent (5 min)

```bash
# 9. Remove olera.care from v1.0 Vercel project
#    Vercel Dashboard → v1.0 project → Settings → Domains → Remove olera.care and www.olera.care
```

- [ ] Removed `olera.care` from v1.0 project
- [ ] Removed `www.olera.care` from v1.0 project

```bash
# 10. Add olera.care to v2.0 Vercel project
#     Vercel Dashboard → v2.0 project → Settings → Domains → Add olera.care and www.olera.care
```

- [ ] Added `olera.care` to v2.0 project
- [ ] Added `www.olera.care` to v2.0 project

```bash
# 11. Verify SSL
curl -sI "https://olera.care" | grep -i "strict-transport"
# Should see strict-transport-security header
```

- [ ] SSL certificate valid on v2.0 project

```bash
# 12. Trigger a production deploy to confirm auto-aliasing
git push origin main  # or merge a PR to main
# After deploy completes, verify olera.care shows the new deployment
```

- [ ] New deploy auto-updates olera.care

---

## After Cutover

### Immediate (same day)

- [ ] **Submit sitemap to Google Search Console**
  - Go to GSC → olera.care property → Sitemaps
  - Submit: `https://olera.care/sitemap.xml`
  - If old sitemaps exist, remove them
- [ ] **Request indexing for key pages**
  - GSC → URL Inspection → inspect homepage, top category pages
  - Click "Request Indexing" for each
- [ ] **Monitor GSC for errors** — check Coverage report for new 404s
- [ ] **Test all email links** — send yourself a test provider notification email and verify the links work

### First week

- [ ] **Check GSC daily** for:
  - 404 spikes (indicates missing redirects)
  - Crawl anomalies
  - Indexing drops
- [ ] **Check Google Analytics** — compare traffic to previous week
- [ ] **Monitor Core Web Vitals** in GSC → Experience section
- [ ] **Spot-check 10 random provider pages** from Google search results

### First month

- [ ] **Compare organic traffic** month-over-month in GA
- [ ] **Check keyword rankings** for top terms (if using a rank tracker)
- [ ] **Review 404 report in GSC** — add any missing redirects
- [ ] **Retire v1.0 Vercel project** (after 30 days of clean operation)
- [ ] **Retire Cloudflare** if only used for DNS (Vercel handles SSL)

---

## Rollback Plan

If something goes catastrophically wrong after Phase 3:

```bash
# Option A: Re-alias to v1.0 (if domain not yet removed from v1.0 project)
V1_DEPLOY_URL="<v1.0-deployment-url>"  # find in v1.0 Vercel dashboard
vercel alias set $V1_DEPLOY_URL olera.care
vercel alias set $V1_DEPLOY_URL www.olera.care
# olera.care is back on v1.0 instantly

# Option B: If domain already moved to v2.0 project
# Just revert: remove domain from v2.0 project, add back to v1.0 project
# Then re-deploy v1.0
```

> **Key:** Don't delete the v1.0 project until you're confident v2.0 is stable (minimum 2 weeks).

---

## Contacts

| Role | Person | Reach via |
|------|--------|-----------|
| Cutover lead | TJ | Slack / phone |
| Frontend | Esther, Logan | Slack |
| Cloudflare access | TJ | — |
| Vercel access | TJ | — |
| Google Search Console | TJ | — |
