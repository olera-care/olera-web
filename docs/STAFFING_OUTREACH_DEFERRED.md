# Staffing Outreach — Deferred Features

Tracking doc for capabilities intentionally left out of the Staffing
Outreach MVP. Each entry has the rationale for deferral, the trigger
that should make us revisit it, and notes on how it'd plug in.

The schema in `supabase/migrations/061_staffing_outreach.sql` already
includes enum values for the deferred channels (`fax_sent`, `mail_sent`)
so adding them later is non-breaking.

---

## Outreach channels

### Fax automation
- **What**: Send the pre-call info packet via fax to providers that list
  a fax number.
- **Why deferred**: Cost + integration overhead, and we don't yet know
  what % of home care providers prefer fax. Want first-city data first.
- **Revisit when**: The first 2 cities show ≥10% of providers with a fax
  number on file but no responsive phone or email.
- **Provider candidates**: Documo (formerly Phaxio), Telnyx Fax, SRFax.
  Twilio Programmable Fax was sunset for new customers in 2021 — verify
  Olera's existing Twilio account first.
- **Cost**: ~$0.07/page.

### Direct mail automation
- **What**: Send a printed agreement + cover letter via USPS to
  providers that don't respond to email/phone.
- **Why deferred**: Highest per-touch cost; only worth it for high-value
  prospects we can't reach digitally.
- **Revisit when**: Fax is in, and email response rates fall short of
  the per-university 10-enrollment goal.
- **Provider candidates**: Lob, PostGrid.
- **Cost**: ~$0.85–$1.50/letter incl. postage.

### Auto-website research
- **What**: Scrape provider websites to pre-populate the general email,
  fax, and contact form URL fields.
- **Why deferred**: Manual research is fast enough for MVP throughput
  (~2–3 min per provider). Scraping reliability is uneven.
- **Revisit when**: Manual research averages >5 min per provider, or
  admins request it.
- **Approach**: Playwright + LLM extraction (Claude or GPT) to find
  common contact info patterns.

### Auto-contact-form submission
- **What**: Programmatically fill and submit provider contact forms.
- **Why deferred**: Captchas, anti-bot heuristics, and per-vendor form
  variance make this brittle and could damage Olera's brand if it
  bounces wrong.
- **Revisit when**: A given city has >50% of providers using a small set
  of common form vendors (Wix, Squarespace, etc.) — write per-vendor
  adapters.

---

## Admin UX

### "Start a campaign" admin button
- **What**: A self-serve UI button in `/admin/staffing-outreach` that
  picks a university and runs the seed script behind the scenes.
- **Why deferred**: The seed script is fine for MVP (1–2 universities
  per week, run from a terminal). UI is unnecessary scaffolding.
- **Revisit when**: A 3rd team member joins, OR admins want to start
  campaigns without engineering help.

### Telephony integration (click-to-dial + recording)
- **What**: One-click dial from the admin drawer with auto-logged call
  duration, recording, and transcript.
- **Why deferred**: Admins use their own phones (Google Voice, etc.) for
  MVP. Click-to-call links via `tel:` href are sufficient.
- **Revisit when**: BD team grows past 4 people, OR we want call quality
  reviews / training feedback loops.
- **Provider candidates**: Twilio Voice, Aircall, Dialpad.

### Reply auto-detection
- **What**: When a provider replies to any pilot email, automatically
  pause the sequence and flag the outreach for admin review.
- **Why deferred**: Manual handling works at MVP volume — admin opens
  the inbox, marks "Replied" in the drawer.
- **Revisit when**: Manual "Mark as replied" exceeds 5/wk, OR replies
  start being missed.
- **Approach**: Resend inbound webhook OR poll an IMAP inbox tied to
  the from-address used for the campaign.

### Funnel reporting dashboard
- **What**: A single page showing per-university and overall funnel
  metrics (Contacted → Connected → Consented → Activated → Enrolled →
  Engaged → Converted), with conversion percentages and cohort
  breakdowns.
- **Why deferred**: Need real data first. Premature optimization.
- **Revisit when**: ≥1 month of post-PR-3 data, OR Logan wants
  university-level reporting to drive partnership decisions.
- **Approach**: New page at `/admin/staffing-outreach/funnel` joining
  `staffing_batches → staffing_outreach → staffing_touchpoints →
  business_profiles → interviews`.

---

## Targeting

### Drive-time API for catchment auto-generation
- **What**: For a new partner university, automatically compute its
  60-min drive catchment from a lat/long instead of curating cities
  manually.
- **Why deferred**: The 25 universities in
  `lib/staffing-outreach/partner-universities.ts` were curated by hand
  and that's fine at this scale. Geocoding all 39k+ providers + drive-
  time API calls is non-trivial.
- **Revisit when**: We want to scale past 25 universities, OR we want
  to add a new university quickly without manual catchment curation.
- **Provider candidates**: Google Distance Matrix, Mapbox Matrix.
- **Cost**: ~$0.005 per provider lookup. ~$200 one-time to geocode the
  full directory.

---

## Enrollment + agreement

### Dynamic per-provider PDF generation
- **What**: At Step 1 send time, render a personalized service agreement
  PDF with the provider's name pre-filled.
- **Why deferred**: Generic "Provider User" PDF works for MVP. Adding a
  PDF generation library and rendering pipeline is more code than the
  benefit warrants right now.
- **Revisit when**: A provider asks for a co-signed copy, OR we want to
  capture the provider name in the document for legal clarity.
- **Approach**: pdf-lib (in-process) or Puppeteer (HTML → PDF).
- **Storage**: Continue uploading to Supabase Storage; key by outreach
  ID for retrieval.

### Per-university service agreement variants
- **What**: Customize the agreement text for partner universities that
  request specific terms (e.g., a particular state's governing law).
- **Why deferred**: All 25 MVP universities can use the Texas-governed
  agreement. Customization is a v2 problem.
- **Revisit when**: A university partnership requires it.
