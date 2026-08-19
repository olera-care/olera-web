# Benefits first-SMS rollout — 2026-08-19

## Decision

Roll out one continuity-led hybrid message to the full eligible results cohort. Do not run an A/B test yet. Keep the private-plan link available for families who prefer to self-serve, acknowledge the answers they just submitted, and invite questions without assuming they are stuck.

Copy version written to `email_log.metadata.copy_version`:

`continuity_question_v1_2026_08_19`

Approved positive-match message:

> Olera care team: We got your answers. Any questions about next steps? Plan: {link} We'll reply within 48h. STOP to opt out.

With the production-length tagged URL used during review, the message is 158 GSM-7 characters and one SMS segment.

The zero-match message is unchanged and records `zero_match_v1`.

The later `wants_help` phone-capture path records `help_request_v1_2026_08_19`
and acknowledges the action the family just took instead of asking whether they want help:

> Olera care team: We got your request. What should we help with first? Plan: {link} We'll reply within 48h. STOP to opt out.

## Why this version

- Leads with Olera's care team rather than introducing a new individual identity later.
- Acknowledges the action the family just completed, preserving continuity from the benefits questions into the text conversation.
- Invites questions without presuming that the family is confused, blocked, or already needs help.
- Keeps the plan link in the first message. The baseline shows a meaningful silent self-service cohort, so access is not gated on replying.
- Makes the operational promise explicit and conditional: when a family replies, Olera's care team replies within 48 hours.
- Avoids promising a second proactive message to silent self-serve families or people who add a phone after earlier navigator guidance.
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
- care-team response sent within 48 hours of the first qualifying inbound reply;
- delivery failures and messages without a terminal carrier receipt.

Do not treat a plan click alone as verified progress. Do not attribute a STOP to Day 0 merely because it occurred within seven days; join it to the most recent outbound message first.

## Operational support for the promise

- The inbound webhook stores the reply, immediately acknowledges it, and queues free-form questions for research.
- The family-answer worker prepares a review packet every five minutes; it never auto-sends unreviewed advice.
- `/admin/inbox` calculates the deadline from the oldest unanswered inbound, places overdue conversations first, and labels any thread that passes 48 hours.
- The existing navigator remains a separate proactive follow-up; it is not the mechanism behind this conditional response promise.

## Deferred experiment

A reply-gated variant that withholds the plan until the family responds is deliberately deferred. If tested later, compare it against this version and preserve a fallback for non-responders. The pre-rollout records show nine measurable families who clicked without replying; removing immediate plan access could harm that cohort.

## Twilio access safety

No Twilio console or API access was used for this rollout. Repository code and read-only Supabase aggregates were sufficient. Future work requiring the Twilio account must pause until TJ confirms the VPN is enabled.
