# Provider Outreach -- How Fax and Direct Mail Work

A step-by-step guide to how faxes (Telnyx) and postcards (PostGrid) are sent and tracked.

---

## Fax (Telnyx)

### Setup

- **Telnyx account**: Mission Control dashboard at portal.telnyx.com
- **Fax Application**: "Olera Care" (App ID: `3015667679311692880`)
- **From number**: `+14372938713` (Telnyx-provisioned fax number)
- **Webhook URL** (configured in Telnyx): `https://olera2-web.vercel.app/api/admin/provider-outreach/fax-webhook`
- **Env vars** (in `.env.local` and Vercel):
  - `TELNYX_API_KEY`
  - `TELNYX_FAX_APP_ID`
  - `TELNYX_FROM_NUMBER`

### How a fax is sent (step by step)

1. **Admin opens Re-Engagement page** (`/admin/provider-outreach/re-engagement`)
2. **Clicks "Find Fax"** on a provider card to look up their fax number
3. **Clicks "Send Fax"** -- opens the Fax Preview Sidebar showing exactly what will be faxed
4. **Clicks "Send Fax via Telnyx"** -- frontend calls `POST /api/admin/provider-outreach/send-fax` with the provider ID
5. **send-fax API route** does the following:
   - Looks up the provider's fax number from `provider_outreach_tracking`
   - Looks up the provider name and slug from `olera-providers`
   - Builds a `media_url` pointing to our fax document: `https://olera2-web.vercel.app/api/admin/provider-outreach/fax-pdf?provider_id=xxx`
   - Calls Telnyx `POST https://api.telnyx.com/v2/faxes` with `media_url`, `to` (fax number), `from`, and `connection_id`
   - Saves `fax_telnyx_id`, `fax_sent_at`, `fax_status: "queued"` to `provider_outreach_tracking`
6. **Telnyx fetches the media_url** -- it hits our `fax-pdf` API route, which renders a full-page HTML document (the one-pager with Olera header, QR code, letter, Logan's signature, opt-out notice)
7. **Telnyx converts the HTML to a fax image** and transmits it to the provider's fax machine

### How fax status tracking works

1. **Telnyx sends webhooks** to `https://olera2-web.vercel.app/api/admin/provider-outreach/fax-webhook` as the fax progresses
2. Webhook events: `fax.queued` -> `fax.media.processed` -> `fax.sending.started` -> `fax.delivered` or `fax.failed`
3. **fax-webhook API route** receives the event, looks up the provider by `fax_telnyx_id`, and updates `fax_status` (and `fax_delivered_at` or `fax_failure_reason`) in `provider_outreach_tracking`
4. **Re-engagement page** reads these fields on load and shows delivery status on each provider card

### How to preview/debug a fax

- **Before sending**: The Fax Preview Sidebar shows the exact document
- **After sending**: Open the media URL in your browser: `https://olera2-web.vercel.app/api/admin/provider-outreach/fax-pdf?provider_id=xxx`
- **Telnyx dashboard**: Go to Debugging > Webhook Deliveries to see webhook attempts and payloads
- **Failure reasons**: Check the `fax.failed` webhook payload for `failure_reason` (e.g., `user_busy`, `receiver_no_answer`)

### Key files

| File | Purpose |
|------|---------|
| `app/api/admin/provider-outreach/send-fax/route.ts` | Sends the fax via Telnyx API |
| `app/api/admin/provider-outreach/fax-pdf/route.ts` | Renders the fax document HTML (what Telnyx fetches) |
| `app/api/admin/provider-outreach/fax-webhook/route.ts` | Receives Telnyx delivery status webhooks |
| `app/admin/provider-outreach/re-engagement/page.tsx` | UI with fax preview sidebar and status display |

---

## Direct Mail / Postcards (PostGrid)

### Setup

- **PostGrid account**: Dashboard at app.postgrid.com
- **API mode**: Currently test mode (`test_sk_` prefix key)
- **Return address**: Olera Care Inc., 1337 West 43rd Street, Unit 1010, Houston, TX 77018
- **Env vars** (in `.env.local` and Vercel):
  - `POSTGRID_API_KEY`

### How a postcard is sent (step by step)

1. **Admin opens Re-Engagement page**, goes to the **Direct Mailer** tab
2. **Clicks "Find Address"** on a provider card -- scrapes the provider's website for a mailing address (or uses Google Places API as fallback). Found address is saved to `mail_address` in `provider_outreach_tracking`
3. **Clicks "Send Mailer"** -- opens the Postcard Preview Sidebar showing front and back
4. **Verifies the QR code** links to the correct provider page
5. **Clicks "Send Postcard via PostGrid"** -- frontend calls `POST /api/admin/provider-outreach/send-mailer` with:
   - `provider_id` -- the provider's ID
   - `provider_name` -- the provider's name (passed explicitly, not looked up in the API)
   - `address` -- the full mailing address (passed explicitly from the UI)
   - `slug` -- the provider's URL slug for QR code generation
6. **send-mailer API route** does the following:
   - Validates that `provider_name` and `address` are present (address must contain a street number)
   - Parses the address into structured components (street, city, state, zip)
   - Builds front HTML (headline, features, QR code) and back HTML (letter, signature)
   - Calls PostGrid `POST https://api.postgrid.com/print-mail/v1/postcards` with `frontHTML`, `backHTML`, `to` (provider address), `from` (Olera return address)
   - Saves `mail_postgrid_id`, `mail_sent_at`, `mail_status` to `provider_outreach_tracking`
7. **PostGrid prints, stamps, and mails** the postcard via USPS

### How postcard status tracking works

1. **On-demand sync**: Click "Sync PostGrid Status" button on the Direct Mail tab. This calls `POST /api/admin/provider-outreach/sync-mail-status`, which polls PostGrid's API for the latest status of each tracked postcard
2. **Webhook (optional)**: PostGrid can also send webhooks to `https://olera2-web.vercel.app/api/admin/provider-outreach/postcard-webhook` for real-time updates. Configure the webhook URL in PostGrid dashboard settings.
3. PostGrid statuses: `draft` -> `ready` -> `printed` -> `in_transit` -> `delivered` (or `cancelled` / `returned`)
4. **Re-engagement page** shows the status with color-coded indicators (green = delivered, blue = in transit, amber = ready, red = cancelled/returned)

### How to preview/debug a postcard

- **Before sending**: The Postcard Preview Sidebar shows front and back
- **After sending**: Go to PostGrid dashboard (app.postgrid.com) > Postcards > click the postcard > "View PDF" to see exactly what was printed
- **Address issues**: Make sure "Find Address" was clicked and a valid address with a street number is showing before sending

### Key files

| File | Purpose |
|------|---------|
| `app/api/admin/provider-outreach/send-mailer/route.ts` | Builds HTML and sends postcard via PostGrid API |
| `app/api/admin/provider-outreach/postcard-webhook/route.ts` | Receives PostGrid delivery status webhooks |
| `app/api/admin/provider-outreach/sync-mail-status/route.ts` | Polls PostGrid API for latest statuses |
| `app/api/admin/provider-outreach/find-address/route.ts` | Scrapes provider website for mailing address |
| `app/admin/provider-outreach/re-engagement/page.tsx` | UI with postcard preview sidebar and status display |

---

## Database: provider_outreach_tracking

Both channels write to the same table. Key columns:

| Column | Set by | Purpose |
|--------|--------|---------|
| `fax_number` | Find Fax | Provider's fax number |
| `fax_sent_at` | send-fax | When the fax was sent |
| `fax_telnyx_id` | send-fax | Telnyx fax ID for webhook matching |
| `fax_status` | fax-webhook | `queued`, `processing`, `sending`, `delivered`, `failed` |
| `fax_delivered_at` | fax-webhook | When fax was confirmed delivered |
| `fax_failure_reason` | fax-webhook | Why the fax failed (e.g., `user_busy`) |
| `mail_address` | find-address | Provider's mailing address |
| `mail_sent_at` | send-mailer | When the postcard was sent |
| `mail_postgrid_id` | send-mailer | PostGrid postcard ID for status tracking |
| `mail_status` | sync-mail-status / postcard-webhook | `draft`, `ready`, `printed`, `in_transit`, `delivered`, `cancelled`, `returned` |
| `mail_delivered_at` | postcard-webhook | When postcard was confirmed delivered |

---

## Switching PostGrid to Production

When ready to send real postcards:
1. Get a live API key from PostGrid (starts with `live_sk_`)
2. Replace `POSTGRID_API_KEY` in Vercel env vars
3. Postcards will now actually be printed and mailed via USPS
