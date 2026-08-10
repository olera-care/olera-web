# Gmail webhook

Receives Gmail `users.watch` notifications through Google Cloud Pub/Sub and inserts a tiny event into `support_email_events`. The scheduled `support-email-sync` worker performs the real Gmail synchronization.

## Deploy

```bash
supabase secrets set GMAIL_WEBHOOK_SECRET=<high-entropy-secret>
supabase functions deploy gmail-webhook --no-verify-jwt
```

Create a Pub/Sub push subscription whose endpoint is:

```text
https://<supabase-project>.supabase.co/functions/v1/gmail-webhook?token=<same-secret>
```

Grant `gmail-api-push@system.gserviceaccount.com` Pub/Sub Publisher on the topic. Set the full topic name (`projects/<project>/topics/<topic>`) as `GMAIL_PUBSUB_TOPIC` in Vercel. Gmail watches are renewed automatically before expiration.

`GMAIL_WEBHOOK_SECRET` belongs in Supabase Edge secrets. `GOOGLE_GMAIL_CLIENT_ID`, `GOOGLE_GMAIL_CLIENT_SECRET`, `GMAIL_TOKEN_ENCRYPTION_KEY`, and `GMAIL_OAUTH_STATE_SECRET` belong in the app environment.
