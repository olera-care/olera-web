# Benefits first-SMS rollout — 2026-08-19

## Decision

Roll out one question-led hybrid message to the full eligible cohort. Do not run an A/B test yet. Keep the private-plan link available for families who prefer to self-serve, but make a bounded human question the first action.

Copy version written to `email_log.metadata.copy_version`:

`question_led_v1_2026_08_19`

Approved positive-match message:

> Olera care team: Need help choosing, qualifying, or applying? Reply. Plan: {link} Next step within 48h. STOP to opt out.

With the production-length tagged URL used during review, the message is 155 GSM-7 characters and one SMS segment.

The zero-match message is unchanged and records `zero_match_v1`.

## Why this version

- Leads with Olera's care team rather than introducing a new individual identity later.
- Offers three bounded places where a family may need help instead of asking an open-ended “Where are you stuck?” question.
- Keeps the plan link in the first message. The baseline shows a meaningful silent self-service cohort, so access is not gated on replying.
- Makes the operational promise explicit: one reviewed next step within 48 hours.
- Uses a stable copy version and entry source so later comparisons do not depend on reconstructing message text.

## Read-only baseline captured before rollout

Window queried: 2026-07-29 through 2026-08-19. Sources: `email_log`, `sms_inbound`, and `benefits_results_tokens`.

- 56 `benefits_results_sms` rows across 52 unique recipients.
- 27 sends carried working `?s=r` SMS click attribution; 13 were clicked (48.1%).
- At the person level, 12 of 24 measurable recipients clicked (50%).
- 11 of 13 attributable clicks occurred within the first hour.
- In the measurable cohort: 9 clicked without replying, 2 replied without clicking, 3 both clicked and replied, and 10 did neither.
- Five unique people replied directly to the first results text: 3 sent free-form responses and 2 sent STOP.
- Every direct first-message reply arrived within approximately 72 minutes.
- Twenty-nine historical sends used an untagged link. Their plan views cannot be attributed honestly to SMS, so they are excluded from click-rate claims.

This is a small observational baseline, not an experiment. It supports keeping the link but does not establish causality for the new question-led copy.

## Outcome definitions for later review

North star: percentage of recipients who take a verified next step within seven days of the first SMS.

Qualifying next steps:

- a non-STOP inbound question or request for care-team help;
- a structured progress response such as `CALLED`, `STUCK`, or `APPLIED`;
- another recorded care-team action or introduction request.

Guardrails and diagnostics:

- inbound STOP within seven days, attributed to the immediately preceding outbound SMS;
- plan click rate among tagged, delivered sends;
- non-STOP reply rate and time to first reply;
- first reviewed guidance delivered by intake +48 hours;
- delivery failures and messages without a terminal carrier receipt.

Do not treat a plan click alone as verified progress. Do not attribute a STOP to Day 0 merely because it occurred within seven days; join it to the most recent outbound message first.

## Operational changes paired with the promise

- The coordinator prepares the navigator draft on its first daily run after intake instead of waiting until hour 48.
- The draft stores `due_at = intake +48h`.
- `/admin/benefits` identifies drafts that pass the deadline.
- The new-draft Slack reminder includes the earliest 48-hour deadline.
- Guidance remains human-reviewed; there is no automatic send of unreviewed program advice.

## Deferred experiment

A reply-gated variant that withholds the plan until the family responds is deliberately deferred. If tested later, compare it against this version and preserve a fallback for non-responders. The pre-rollout records show nine measurable families who clicked without replying; removing immediate plan access could harm that cohort.

## Twilio access safety

No Twilio console or API access was used for this rollout. Repository code and read-only Supabase aggregates were sufficient. Future work requiring the Twilio account must pause until TJ confirms the VPN is enabled.
