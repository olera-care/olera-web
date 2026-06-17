# Design Improvements — Master Design Pass

Run a complete design pass on a screen: **diagnose, then execute the right fixes in the right order.** This is the orchestrator that strings together the four single-purpose design commands so you don't have to invoke them one at a time.

Input: `$ARGUMENTS` — a screenshot (mobile viewport preferred) plus a short note on what page this is and what feels off. If only a screenshot is pasted, ask which page/route it is before doing anything.

---

## The crew (read these at runtime — don't reproduce them from memory)

This command is a conductor, not a rewrite. Each sub-command owns its own logic, inspiration set, and gotchas, and they get edited over time. **Open and follow the actual file** for whichever lane you run — never paraphrase a stale copy:

| Lane | Command file | What it does | Builds? |
|---|---|---|---|
| **Diagnose** | `.claude/commands/ui-critique.md` | Prioritized visual/UX critique — the map for everything below | No |
| **Boldness / copy** | `.claude/commands/punch.md` | Make it bolder, simpler, punchier; kill template smell | Yes (≤8 edits) |
| **Mobile** | `.claude/commands/mobilize.md` | Mobile-specific refinement — thumb economics, container discipline, 7 lenses | Yes (waits for confirmation) |
| **Motion** | `.claude/commands/dejank.md` | Eliminate jank — layout shifts, flickers, transition smoothing | Yes |

The three **aesthetic** lanes — `ui-critique`, `punch`, `mobilize` — ground in the same inspiration folder (`~/Desktop/olera-hq/docs/Design Inspirations/`); `ui-critique` and `punch` also carry the explicit anti-anchor rule, and `mobilize` adds a second reference set (`~/Desktop/olera-web/docs/Mobile Optimized Pages/`). Ground once, reuse across these lanes. `dejank` is the odd one out: it's a **behavioral/motion** tool (console + state tracing), not an aesthetic one — it reads no inspiration folder, so don't expect a folder study when you run it.

---

## Pipeline (order is deliberate)

The lanes run in this sequence because each builds on the last: structure before mobile-fit before motion. Don't reorder without a reason.

```
ui-critique  →  punch  →  mobilize  →  dejank  →  verify
(diagnose)     (shape)    (mobile)     (motion)
```

### Phase 1 — Diagnose (always)
Follow `ui-critique.md` in full: study the inspiration folder, read the component code if a path is available, run its analysis framework. Produce the prioritized critique (What's Working / Suggested / Quick Wins / Optional). **This is the map** — every edit downstream traces back to a finding here.

### Phase 2 — Triage into lanes, then get TJ's call
Sort the critique's findings into the three execution lanes:

- **Boldness/copy/hierarchy/clarity** → `punch`
- **Mobile layout, thumb reach, container discipline, viewport** → `mobilize`
- **Jank, flicker, layout shift, transition timing** → `dejank`

Present a short routing plan: *"Findings split as — punch: 4 (headline, CTA, value-prop compression, dead air); mobilize: 2 (sticky CTA, de-box sections); dejank: 1 (card flicker on load). Propose running punch → mobilize → dejank."*

Then ask TJ to confirm **scope** — run all lanes, or only some. Don't assume all three; a screen may only need one.

### Phase 3 — Execute the confirmed lanes, in pipeline order
For each lane TJ greenlights, **open that command file and follow its process exactly** — including its own confirmation gates. Notably:

- `mobilize` restates the problem, asks 2–4 clarifying questions, and **waits before editing**. Honor that — don't bulldoze its gate just because this is a master run.
- `punch` decides one direction and makes ≤8 surgical edits with before/after rationale.
- `dejank` traces each jank source to its cause before patching.

Run them sequentially, not in parallel — `mobilize` adapts the layout `punch` produced; `dejank` smooths transitions of the final layout. Summarize after each lane before starting the next, so partial state is easy to roll back.

### Phase 4 — Verify once, at the end
Don't build after every lane — build once after the last executed lane. Then follow `mobilize`'s Vercel handoff (Phase 7): the PR's auto-updating preview link on a real phone is the source of truth, not local dev or a pinned deployment hash. Call out specifically what to check per lane that ran.

---

## Scope control

- **`$ARGUMENTS` may name a lane** — e.g. `/design-improvements <screenshot> mobile only` runs Phase 1 then jumps straight to `mobilize`. Respect an explicit lane request; skip the triage menu.
- **Default is diagnose + propose**, not diagnose + auto-execute-everything. TJ confirms scope at Phase 2.
- **One screen per run.** This orchestrates depth on a single screen, not a sweep across pages.

## Anti-patterns

- **Don't duplicate the sub-commands' content here.** Read their files. This command goes stale the moment it copies their logic.
- **Don't skip Phase 1.** Executing without the critique map produces unanchored edits — the exact thing each sub-command warns against.
- **Don't run lanes out of order or in parallel.** Shape → mobile → motion. Later lanes depend on earlier output.
- **Don't override a sub-command's confirmation gate.** If `mobilize` says wait, wait.
- **Don't run lanes TJ didn't greenlight.** A clean lens needs no pass.
- **Don't add features or copy.** Every lane here sharpens what exists; none of them build new sections.
