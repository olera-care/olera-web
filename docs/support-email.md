# Olera Support Email

The admin Support Email inbox mirrors a connected Gmail mailbox into Supabase, backfills the complete mailbox without a date cutoff, and generates a human-reviewed next action for each active inbound thread.

## Activation

1. Apply `supabase/migrations/171_support_email_inbox.sql` in the Supabase SQL editor.
2. In the Olera Google Cloud organization:
   - Enable Gmail API and Cloud Pub/Sub API.
   - Configure the OAuth audience as **Internal**.
   - Create a Web application OAuth client.
   - Register `https://olera.care/api/admin/support-email/oauth/callback` (and the stable staging callback if staging will connect a different mailbox).
3. Add the app secrets documented in `.env.example` to Vercel. `GMAIL_OAUTH_STATE_SECRET` and `GMAIL_TOKEN_ENCRYPTION_KEY` must be different high-entropy values.
4. Create a Pub/Sub topic and grant `gmail-api-push@system.gserviceaccount.com` the Pub/Sub Publisher role on it.
5. Deploy `supabase/functions/gmail-webhook` using its README, then create a Pub/Sub push subscription to the secret-bearing Edge Function URL.
6. Deploy the app and open `/admin/support-email`. Click **Connect Gmail** while signed into the actual mailbox behind `support@olera.care`.

If `support@olera.care` is an alias, connect the underlying mailbox and set `GMAIL_SUPPORT_FROM_ADDRESS=support@olera.care`; the alias must already be a verified Gmail send-as address. If it is a Google Group rather than a Gmail mailbox, convert/reroute it to a mailbox before activation; Gmail threads and drafts belong to mailboxes, not Groups.

## Operating model

- New Gmail history is processed before each historical page, so an old mailbox never delays current support.
- The worker imports 100 historical messages per 5-minute run until Gmail returns no next page. There is no date cutoff. That is up to 28,800 historical messages per day without letting the backfill monopolize a serverless run.
- Pub/Sub provides the prompt notification. The 5-minute cron is also the mandatory recovery poll for missed notifications.
- Gmail is the transport source of truth. Supabase owns assignment, triage, Olera identity links, agent recommendations, and audit history.
- Agent output is advisory. Sends, archives, unsubscribes, escalations, and Do Not Contact writes require an explicit admin action.
- Message HTML is converted to plain text. Remote images never load and attachments remain metadata-only in the first release.

## Required checks after connection

1. Confirm the mailbox banner says **Importing history** and the imported count rises.
2. Send a test email from outside Olera and confirm it appears under **Needs attention**.
3. Save a reply draft and confirm it appears in Gmail Drafts.
4. Send from Olera and confirm Gmail Sent plus the admin thread both show the reply.
5. Archive from Gmail and confirm the Olera state catches up on the next sync.
6. Confirm obvious bulk mail lands in **Noise**, while family/provider support remains in **Needs attention**.
