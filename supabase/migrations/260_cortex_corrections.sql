-- Corrections the founder has made to Cortex, kept so they stick.
--
-- On 2026-09-26 Cortex told the founder to "call Hoop Cares and ask her point
-- blank why she paid" and he answered: "mid-curve advice, it's obvious why
-- Hoop Cares subscribed. She wants more leads." Nothing carried that forward;
-- the next answer could say the same thing. Each correction is a short dated
-- line, loaded into every DM answer and every brief. Cortex may append to this
-- list; it never edits north_star or targets.
--
-- Seeded with the business corrections made so far. Additive; re-running is a
-- no-op because the seed only applies to an empty list.

ALTER TABLE war_room_company_models
  ADD COLUMN IF NOT EXISTS corrections jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE war_room_company_models
SET corrections = '[
  {"at": "2026-09-25", "lesson": "Provider calls are made by TJ and Ces (Ces Chavez), nobody else. Never assign or draft provider calls for Chantel or Graize."},
  {"at": "2026-09-25", "lesson": "Provider partnership and expansion signals are top priority and should surface the same day (e.g. Robbie at Assisting Hands wanting to be preferred provider for North Texas)."},
  {"at": "2026-09-25", "lesson": "Meeting transcripts misspell Ces as Seth, SES or Tess. Ces is a woman."},
  {"at": "2026-09-26", "lesson": "Hoop Cares is the one paying provider ($75/month, Stripe renews Oct 15). Providers pay for leads; she subscribed because she wants more leads. Protecting that renewal means delivering her qualified leads."},
  {"at": "2026-09-26", "lesson": "Do not recommend asking a provider why they paid. The founder called it mid-curve advice: the answer is obvious (leads). The move is getting them good leads, not discovery calls about motive."},
  {"at": "2026-09-26", "lesson": "Hoop Cares has a Meta instant-form campaign (pascagoula-ms, live Sep 20 to Oct 12) as well as Google. Read city_campaigns and city_leads before saying what is running for a provider; team notes go out of date."}
]'::jsonb,
  updated_at = now()
WHERE key = 'olera'
  AND corrections = '[]'::jsonb;
