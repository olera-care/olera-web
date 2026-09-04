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

- Each worker drains Gmail history for up to three minutes, saving its cursor after every successful chunk. Chunks contain up to 100 changed messages, except that a single bulk Gmail record stays atomic even when larger. A backlog no longer throttles the worker to one change every five minutes.
- A six-minute mailbox lease covers the entire worker, including history checkpoints, backfill, and watch renewal. Expired leases recover after a terminated worker; handled errors release the lease immediately.
- Manual **Sync** requests run in the background with the same five-minute server limit as cron. The visible inbox refreshes every 15 seconds. Cron summaries include processed history chunks and mailboxes still catching up.
- When time remains after incremental sync, the worker imports 100 historical messages per 5-minute run until Gmail returns no next page. There is no date cutoff. That is up to 28,800 historical messages per day without letting the backfill monopolize a serverless run.
- Pub/Sub provides the prompt notification. The 5-minute cron is also the mandatory recovery poll for missed notifications.
- Gmail is the transport source of truth. Supabase owns assignment, triage, Olera identity links, agent recommendations, and audit history.
- Agent output is advisory. Sends, archives, unsubscribes, escalations, and Do Not Contact writes require an explicit admin action.
- Message HTML is converted to plain text and remote images never load. Attachments stay in Gmail and are fetched through an authenticated admin-only route when an operator opens or downloads one; Olera does not create a second permanent file copy.
- The queue can be filtered by support category and recent date window, and sorted newest- or oldest-first.
- Voicemail notifications bypass the generic automation rule. Written transcripts in the email body or a small `.txt`, `.vtt`, or `.srt` attachment are summarized into a callback brief; audio-only messages expose the Gmail recording and clearly note that no written transcript was available.

## Required checks after connection

1. Confirm the mailbox banner says **Importing history** and the imported count rises.
2. Send a test email from outside Olera and confirm it appears under **Needs attention**.
3. Save a reply draft and confirm it appears in Gmail Drafts.
4. Send from Olera and confirm Gmail Sent plus the admin thread both show the reply.
5. Archive from Gmail and confirm the Olera state catches up on the next sync.
6. Confirm obvious bulk mail lands in **Noise**, while family/provider support remains in **Needs attention**.

## Regression checks

Run `node scripts/check-support-email-sync.cjs` to exercise chunk draining, cursor checkpoints, time limits, overlapping workers, bulk records, and expired Gmail cursors without live credentials.
