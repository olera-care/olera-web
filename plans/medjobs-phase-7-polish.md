# Phase 7 — Polish + Extensions

Status: **SKELETON / DEFERRED** (low-priority, demand-driven; ships as signal emerges)
Branch: TBD
Owner: Claude (build) + Logan (approval gate before build starts)

## Goal

Capture low-priority items so they're tracked, not lost. Each is its own 1–2 week project; ships as demand signal emerges (volume / team-size / admin feedback).

## Bullets

1. **Provider self-serve admin tools** — let Pilot Active providers edit their public org info / verify their listing / configure notifications from the welcome page
2. **Pilot continuation flow** — post-3-month conversion to paid. New agreement template (separate from pilot agreement per PDF). Admin task at Day-T-14 to start conversation. Pricing + tier model TBD with TJ.
3. **Inline Smartlead reply UI** — replace the "open Smartlead inbox →" deep-link with inline composition via Smartlead's reply API. Volume-dependent; ship when admins want it.
4. **Magic-token verification flow** — collapse the existing formal verification flow into the magic-link path so Pilot Active providers get the "Verified" badge in one click. Big UX win but big code lift.
5. **Calendly account migration** — move from Dr. DuBose's personal Calendly to an Olera org account when ≥2 team members host events.
6. **Multi-team-member support** — proper team-per-org schema rework. Unblocks the co-tenancy edge case from Phase 2. Long-term.

## Dependencies

Per bullet:
- **(1) Provider self-serve admin tools** — Phase 5 done
- **(2) Pilot continuation** — Phase 5 done + TJ pricing decision + new agreement drafted
- **(3) Inline reply UI** — Phase 3 (Emails tab) done + reply volume justifies build
- **(4) Magic-token verification** — Phase 5 done + existing verification flow understood end-to-end
- **(5) Calendly migration** — second team member hosting events
- **(6) Multi-team-member** — long-term schema migration project; needs separate planning artifact

## Estimated work

Each bullet is 1–2 weeks at 1 dev. No fixed sequence — ships as triggers fire.

## References

- Master plan: [`medjobs-master-plan.md`](medjobs-master-plan.md) § 5.9, 7.3, 7.4, 7.5, 7.6
- Pilot agreement PDF Cost clause: "After the three-month pilot, continued use of the platform may be offered on a paid basis; any future paid relationship will be covered by a separate written agreement after this term ends."
